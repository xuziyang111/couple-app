<template>
  <view class="album-page">
    <view class="album-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">甜蜜相册</text>
      <text class="header-count">共 {{ photos.length }} 张照片</text>
    </view>
    <scroll-view class="album-content" scroll-y>
      <EmptyState v-if="photos.length === 0" icon="📷" text="还没有照片，快去拍一些吧">
        <button class="add-photo-btn" @click="chooseAndUploadPhoto">
          <text class="btn-icon"></text>
          <text class="btn-text">添加照片</text>
        </button>
      </EmptyState>
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
    <!-- 浮动添加按钮 -->
    <view class="float-add-btn" @click="chooseAndUploadPhoto">
      <text class="float-icon">+</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllRecords, addRecord } from '../../db'
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

// 选择并上传照片
const chooseAndUploadPhoto = async () => {
  try {
    // 1. 选择图片
    const res = await new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      })
    })

    if (!res.tempFilePaths || res.tempFilePaths.length === 0) {
      return
    }

    uni.showLoading({ title: '上传中...' })

    // 2. 批量上传
    for (let i = 0; i < res.tempFilePaths.length; i++) {
      const tempPath = res.tempFilePaths[i]
      
      // 生成唯一ID
      const photoId = Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      
      // 读取文件为base64（用于本地存储）
      const base64 = await new Promise((resolve, reject) => {
        uni.getFileSystemManager().readFile({
          filePath: tempPath,
          encoding: 'base64',
          success: (res) => resolve('data:image/jpeg;base64,' + res.data),
          fail: reject
        })
      })

      // 创建照片对象
      const photo = {
        id: photoId,
        url: base64,
        thumbnail: base64,
        createdAt: new Date().toISOString(),
        description: ''
      }

      // 保存到数据库
      await addRecord('photos', photo)
      
      // 更新本地列表
      photos.value.unshift(photo)
    }

    uni.hideLoading()
    uni.showToast({ title: `成功添加${res.tempFilePaths.length}张照片`, icon: 'success' })
  } catch (error) {
    console.error('上传照片失败:', error)
    uni.hideLoading()
    uni.showToast({ title: '上传失败', icon: 'none' })
  }
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
.album-page { min-height: 100vh; background: var(--color-bg); padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); position: relative; }
.add-photo-btn { margin-top: 30rpx; padding: 20rpx 40rpx; background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); border-radius: 50rpx; display: flex; align-items: center; justify-content: center;
  .btn-icon { font-size: 36rpx; margin-right: 10rpx; }
  .btn-text { font-size: var(--font-size-md); color: #fff; font-weight: bold; }
}
.float-add-btn { position: fixed; right: 30rpx; bottom: calc(100rpx + constant(safe-area-inset-bottom)); bottom: calc(100rpx + env(safe-area-inset-bottom)); width: 100rpx; height: 100rpx; background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.15); z-index: 100;
  .float-icon { font-size: 60rpx; color: #fff; font-weight: bold; line-height: 1; }
}
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
