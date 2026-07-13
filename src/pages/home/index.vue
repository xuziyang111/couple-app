<template>
  <view class="home-page">
    <!-- 顶部状态栏 -->
    <view class="home-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="couple-info">
        <image v-if="coupleStore.myInfo.avatar" :src="coupleStore.myInfo.avatar" class="avatar" />
        <view v-else class="avatar-placeholder">👤</view>
        <view class="names">
          <text class="couple-names">{{ coupleStore.bothNames || '我们' }}</text>
        </view>
        <image v-if="coupleStore.partnerInfo.avatar" :src="coupleStore.partnerInfo.avatar" class="avatar" />
        <view v-else class="avatar-placeholder">👤</view>
      </view>
    </view>

    <!-- 恋爱天数卡片 -->
    <view class="love-days-card card animate-slide-up">
      <view class="days-content">
        <text class="days-label">在一起</text>
        <text class="days-number">{{ loveDays }}</text>
        <text class="days-unit">天</text>
      </view>
      <view class="love-time" v-if="showTime">
        <text class="time-item">{{ loveTime.hours }}时</text>
        <text class="time-item">{{ loveTime.minutes }}分</text>
        <text class="time-item">{{ loveTime.seconds }}秒</text>
      </view>
      <HeartIcon :animate="true" :size="48" />
    </view>

    <!-- 纪念日倒计时 -->
    <view v-if="nextAnniversary" class="anniversary-card card animate-slide-up">
      <view class="anniversary-header">
        <text class="anniversary-icon">📅</text>
        <text class="anniversary-title">{{ nextAnniversary.title }}</text>
      </view>
      <view class="countdown">
        <view class="countdown-item">
          <text class="countdown-number">{{ countdown.days }}</text>
          <text class="countdown-label">天</text>
        </view>
        <text class="countdown-sep">:</text>
        <view class="countdown-item">
          <text class="countdown-number">{{ countdown.hours }}</text>
          <text class="countdown-label">时</text>
        </view>
        <text class="countdown-sep">:</text>
        <view class="countdown-item">
          <text class="countdown-number">{{ countdown.minutes }}</text>
          <text class="countdown-label">分</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-entry animate-slide-up">
      <view class="entry-grid">
        <view class="entry-item" v-for="item in entryList" :key="item.path" @click="navigateTo(item.path)">
          <view class="entry-icon-wrapper" :style="{ background: item.bgColor }">
            <text class="entry-icon">{{ item.icon }}</text>
          </view>
          <text class="entry-text">{{ item.label }}</text>
        </view>
      </view>
    </view>

    <!-- 最新动态预览 -->
    <view class="latest-section animate-slide-up">
      <view class="section-header">
        <text class="section-title">最新动态</text>
        <text class="section-more" @click="navigateTo('/pages/diary/index')">更多 ></text>
      </view>
      <EmptyState v-if="!latestDiary" icon="💭" text="还没有动态哦，快去记录吧" />
      <view v-else class="latest-diary card">
        <text class="diary-title">{{ latestDiary.title }}</text>
        <text class="diary-content">{{ latestDiary.content }}</text>
        <text class="diary-time">{{ latestDiary.createdAt }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCoupleStore } from '../../stores/couple'
import { useDateCalc } from '../../composables/useDateCalc'
import { useAnniversaryStore } from '../../stores/anniversary'
import { useDiaryStore } from '../../stores/diary'
import HeartIcon from '../../components/common/HeartIcon.vue'
import EmptyState from '../../components/common/EmptyState.vue'

const coupleStore = useCoupleStore()
const anniversaryStore = useAnniversaryStore()
const diaryStore = useDiaryStore()
const { loveDays, loveTime, calcCountdown, startTimer, stopTimer } = useDateCalc()

const statusBarHeight = ref(44)
const showTime = ref(true)
const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const latestDiary = ref(null)

const entryList = [
  { icon: '💬', label: '聊天', path: '/pages/chat/index', bgColor: 'rgba(255,107,129,0.1)' },
  { icon: '📝', label: '日记', path: '/pages/diary/index', bgColor: 'rgba(255,182,193,0.1)' },
  { icon: '📸', label: '相册', path: '/pages/album/index', bgColor: 'rgba(116,185,255,0.1)' },
  { icon: '✅', label: '打卡', path: '/pages/checkin/index', bgColor: 'rgba(125,211,168,0.1)' },
  { icon: '📅', label: '纪念日', path: '/pages/anniversary/index', bgColor: 'rgba(255,209,102,0.1)' },
  { icon: '💰', label: '记账', path: '/pages/finance/index', bgColor: 'rgba(212,165,116,0.1)' },
  { icon: '🎮', label: '工具', path: '/pages/tools/index', bgColor: 'rgba(123,158,201,0.1)' },
  { icon: '⚙️', label: '设置', path: '/pages/settings/index', bgColor: 'rgba(176,168,159,0.1)' }
]

const nextAnniversary = ref(null)

onMounted(() => {
  // 获取状态栏高度
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  
  // 启动恋爱计时
  if (coupleStore.loveStartDate) {
    startTimer(coupleStore.loveStartDate)
  }
  
  // 获取最近的纪念日
  if (anniversaryStore.anniversaries.length > 0) {
    const sorted = anniversaryStore.sortedAnniversaries
    const upcoming = sorted.find(a => new Date(a.date) > new Date())
    if (upcoming) {
      nextAnniversary.value = upcoming
      updateCountdown()
    }
  }
  
  // 获取最新日记
  if (diaryStore.diaryList.length > 0) {
    latestDiary.value = diaryStore.diaryList[0]
  }
})

const updateCountdown = () => {
  if (nextAnniversary.value) {
    countdown.value = calcCountdown(nextAnniversary.value.date)
  }
}

const navigateTo = (path) => {
  // TabBar页面用switchTab
  const tabPaths = ['/pages/home/index', '/pages/chat/index', '/pages/diary/index', '/pages/album/index', '/pages/settings/index']
  if (tabPaths.includes(path)) {
    uni.switchTab({ url: path })
  } else {
    uni.navigateTo({ url: path })
  }
}

onUnmounted(() => {
  stopTimer()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: 0 30rpx 30rpx;
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.home-header {
  margin: 0 -30rpx;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  
  .couple-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20rpx;
    padding: 20rpx 0;
    
    .avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(255,255,255,0.5);
    }
    
    .avatar-placeholder {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background: rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 40rpx;
    }
    
    .couple-names {
      font-size: var(--font-size-lg);
      color: #fff;
      font-weight: bold;
    }
  }
}

.love-days-card {
  margin-top: -30rpx;
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 40rpx;
  
  .days-content {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8rpx;
    
    .days-label {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }
    
    .days-number {
      font-size: 80rpx;
      font-weight: bold;
      background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .days-unit {
      font-size: var(--font-size-lg);
      color: var(--color-primary);
    }
  }
  
  .love-time {
    display: flex;
    justify-content: center;
    gap: 16rpx;
    margin-top: 16rpx;
    
    .time-item {
      font-size: var(--font-size-sm);
      color: var(--color-text-light);
    }
  }
}

.anniversary-card {
  text-align: center;
  
  .anniversary-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    margin-bottom: 20rpx;
    
    .anniversary-icon {
      font-size: 32rpx;
    }
    
    .anniversary-title {
      font-size: var(--font-size-md);
      font-weight: bold;
      color: var(--color-text);
    }
  }
  
  .countdown {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    
    .countdown-item {
      text-align: center;
      
      .countdown-number {
        font-size: var(--font-size-xl);
        font-weight: bold;
        color: var(--color-primary);
        display: block;
      }
      
      .countdown-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-light);
      }
    }
    
    .countdown-sep {
      font-size: var(--font-size-lg);
      color: var(--color-text-light);
      margin-bottom: 20rpx;
    }
  }
}

.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 24rpx;
}

.quick-entry {
  margin-top: 20rpx;
  
  .entry-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    
    .entry-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10rpx;
      
      .entry-icon-wrapper {
        width: 100rpx;
        height: 100rpx;
        border-radius: var(--radius-card);
        display: flex;
        align-items: center;
        justify-content: center;
        
        .entry-icon {
          font-size: 48rpx;
        }
      }
      
      .entry-text {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
      }
    }
  }
}

.latest-section {
  margin-top: 30rpx;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .section-title {
      font-size: var(--font-size-md);
      font-weight: bold;
      color: var(--color-text);
    }
    
    .section-more {
      font-size: var(--font-size-sm);
      color: var(--color-primary);
    }
  }
  
  .latest-diary {
    .diary-title {
      font-size: var(--font-size-md);
      font-weight: bold;
      color: var(--color-text);
      display: block;
      margin-bottom: 10rpx;
    }
    
    .diary-content {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }
    
    .diary-time {
      font-size: var(--font-size-sm);
      color: var(--color-text-light);
      margin-top: 10rpx;
      display: block;
    }
  }
}
</style>
