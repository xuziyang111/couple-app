<template>
  <view class="album-page">
    <view class="album-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">甜蜜相册</text>
      <text class="header-count">共 {{ photos.length }} 张照片</text>
    </view>
    <scroll-view class="album-content" scroll-y>
      <EmptyState v-if="photos.length === 0" icon="📷" text="还没有照片，快去拍一些吧" />
      <view v-for="group in groupedPhotos" :key="group.month" class="month-group">
        <view class="month-header">
          <text class="month-text">{{ group.month }}</text>
          <text class="month-count">{{ group.photos.length }}张</text>
        </view>
        <view class="photo-grid">
          <view v-for="photo in group.photos" :key="photo.id" class="photo-item" @click="previewPhoto(photo)">
            <image :src="photo.thumbnail || photo.url" class="photo-thumb" mode="aspectFill" lazy-load />
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllRecords } from '../../db'
import EmptyState from '../../components/common/EmptyState.vue'

const statusBarHeight = ref(44)
const photos = ref([])

const groupedPhotos = computed(() => {
  const groups = {}
  photos.value.forEach(photo => {
    const month = photo.createdAt ? photo.createdAt.substring(0, 7) : '未知'
    if (!groups[month]) groups[month] = []
    groups[month].push(photo)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([month, items]) => ({ month, photos: items }))
})

const previewPhoto = (photo) => {
  const urls = photos.value.map(p => p.url)
  uni.previewImage({ urls, current: photo.url })
}

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  const records = await getAllRecords('photos')
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  photos.value = records
})
</script>

<style lang="scss" scoped>
.album-page { min-height: 100vh; background: var(--color-bg); padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.album-header { background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); padding: 20rpx 30rpx; text-align: center;
  .header-title { font-size: var(--font-size-xl); color: #fff; font-weight: bold; display: block; }
  .header-count { font-size: var(--font-size-sm); color: rgba(255,255,255,0.8); display: block; margin-top: 8rpx; }
}
.album-content { padding: 20rpx 30rpx; -webkit-overflow-scrolling: touch; }
.month-group { margin-bottom: 30rpx;
  .month-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx;
    .month-text { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); }
    .month-count { font-size: var(--font-size-sm); color: var(--color-text-light); }
  }
  .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8rpx;
    .photo-item { aspect-ratio: 1; border-radius: var(--radius-image); overflow: hidden;
      .photo-thumb { width: 100%; height: 100%; }
    }
  }
}
</style>
