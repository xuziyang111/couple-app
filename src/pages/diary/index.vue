<template>
  <view class="diary-page">
    <view class="diary-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">我们的日记</text>
      <view class="header-actions">
        <text class="action-btn" @click="goEdit">✏️</text>
      </view>
    </view>

    <!-- 心情筛选 -->
    <scroll-view class="mood-filter" scroll-x>
      <view class="mood-tags">
        <view class="mood-tag" :class="{ active: !filterMood }" @click="setFilter('')">
          <text>全部</text>
        </view>
        <view class="mood-tag" v-for="mood in moods" :key="mood.id" :class="{ active: filterMood === mood.id }" @click="setFilter(mood.id)">
          <text>{{ mood.emoji }} {{ mood.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 日记列表 -->
    <scroll-view class="diary-list" scroll-y @scrolltolower="loadMore">
      <EmptyState v-if="diaryList.length === 0" icon="📝" text="还没有日记，快去写一篇吧" />
      <view v-for="diary in filteredDiaries" :key="diary.id" class="diary-card card" @click="goDetail(diary.id)">
        <view class="diary-header-row">
          <view class="diary-meta">
            <text class="diary-mood">{{ getMoodEmoji(diary.mood) }}</text>
            <text class="diary-date">{{ diary.createdAt }}</text>
          </view>
          <view class="diary-actions">
            <text class="action-icon" @click.stop="toggleLike(diary)">
              {{ diary.liked ? '❤️' : '🤍' }} {{ diary.likes || 0 }}
            </text>
          </view>
        </view>
        <text class="diary-title">{{ diary.title }}</text>
        <text class="diary-content">{{ diary.content }}</text>
        <view v-if="diary.imageIds && diary.imageIds.length > 0" class="diary-images">
          <image v-for="(img, i) in diary.imageIds.slice(0, 3)" :key="i" :src="img" class="diary-image" mode="aspectFill" />
          <view v-if="diary.imageIds.length > 3" class="more-images">
            <text>+{{ diary.imageIds.length - 3 }}</text>
          </view>
        </view>
        <view v-if="diary.tags && diary.tags.length > 0" class="diary-tags">
          <text v-for="tag in diary.tags" :key="tag" class="tag">#{{ tag }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDiaryStore } from '../../stores/diary'
import { moods } from '../../data/moods'
import EmptyState from '../../components/common/EmptyState.vue'
import { getAllRecords } from '../../db'

const diaryStore = useDiaryStore()
const statusBarHeight = ref(44)
const filterMood = ref('')
const diaryList = ref([])

const filteredDiaries = computed(() => {
  if (!filterMood.value) return diaryList.value
  return diaryList.value.filter(d => d.mood === filterMood.value)
})

const getMoodEmoji = (moodId) => {
  const mood = moods.find(m => m.id === moodId)
  return mood ? mood.emoji : '😊'
}

const setFilter = (mood) => {
  filterMood.value = mood
}

const toggleLike = (diary) => {
  diary.liked = !diary.liked
  diary.likes = (diary.likes || 0) + (diary.liked ? 1 : -1)
}

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/diary/detail?id=${id}` })
}

const goEdit = () => {
  uni.navigateTo({ url: '/pages/diary/edit' })
}

// 加载更多日记（向下滚动时触发）
const loadMore = async () => {
  // TODO: 实现分页加载历史日记
  console.log('[Diary] 加载更多日记')
}

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  const records = await getAllRecords('diaries')
  records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  diaryList.value = records
})
</script>

<style lang="scss" scoped>
.diary-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.diary-header {
  background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .header-title {
    font-size: var(--font-size-xl);
    color: #fff;
    font-weight: bold;
  }
  
  .action-btn {
    font-size: 40rpx;
  }
}

.mood-filter {
  white-space: nowrap;
  padding: 20rpx 30rpx;
  
  .mood-tags {
    display: flex;
    gap: 16rpx;
    
    .mood-tag {
      padding: 10rpx 24rpx;
      border-radius: var(--radius-tag);
      background: var(--color-card);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      flex-shrink: 0;
      
      &.active {
        background: var(--color-primary);
        color: #fff;
      }
    }
  }
}

.diary-list {
  padding: 0 30rpx 30rpx;
  
  .diary-card {
    background: var(--color-card);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    padding: 24rpx;
    margin-bottom: 20rpx;
    
    .diary-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12rpx;
      
      .diary-meta {
        display: flex;
        align-items: center;
        gap: 10rpx;
        
        .diary-mood {
          font-size: 32rpx;
        }
        
        .diary-date {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
        }
      }
      
      .action-icon {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }
    }
    
    .diary-title {
      font-size: var(--font-size-md);
      font-weight: bold;
      color: var(--color-text);
      display: block;
      margin-bottom: 8rpx;
    }
    
    .diary-content {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }
    
    .diary-images {
      display: flex;
      gap: 10rpx;
      margin-top: 16rpx;
      
      .diary-image {
        width: 200rpx;
        height: 200rpx;
        border-radius: var(--radius-image);
      }
      
      .more-images {
        width: 200rpx;
        height: 200rpx;
        border-radius: var(--radius-image);
        background: var(--color-bg-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-light);
      }
    }
    
    .diary-tags {
      display: flex;
      gap: 10rpx;
      margin-top: 12rpx;
      flex-wrap: wrap;
      
      .tag {
        font-size: var(--font-size-xs);
        color: var(--color-primary);
        background: var(--color-bg-secondary);
        padding: 4rpx 12rpx;
        border-radius: var(--radius-tag);
      }
    }
  }
}
</style>
