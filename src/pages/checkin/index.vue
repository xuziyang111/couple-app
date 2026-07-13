<template>
  <view class="checkin-page">
    <view class="checkin-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">打卡心愿</text>
    </view>
    <!-- 统计卡片 -->
    <view class="stats-card card">
      <view class="stat-item">
        <text class="stat-number">{{ checkinStore.streakDays }}</text>
        <text class="stat-label">连续打卡</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ checkinStore.completedWishCount }}/{{ checkinStore.wishCount }}</text>
        <text class="stat-label">心愿完成</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ checkinStore.progressPercent }}%</text>
        <text class="stat-label">完成进度</text>
      </view>
    </view>
    <!-- 今日签到 -->
    <view class="checkin-today card" @click="doCheckin">
      <text class="checkin-icon">{{ todayChecked ? '✅' : '📋' }}</text>
      <text class="checkin-text">{{ todayChecked ? '今日已打卡' : '点击今日打卡' }}</text>
    </view>
    <!-- 心愿列表 -->
    <view class="section-header">
      <text class="section-title">心愿清单</text>
      <text class="add-btn" @click="showAddWish = true">+ 添加</text>
    </view>
    <EmptyState v-if="wishes.length === 0" icon="🌟" text="还没有心愿，快去添加吧" />
    <view v-for="wish in wishes" :key="wish.id" class="wish-card card">
      <view class="wish-header">
        <text class="wish-title" :class="{ completed: wish.completed }">{{ wish.title }}</text>
        <text class="wish-status" @click="toggleWish(wish)">{{ wish.completed ? '✅' : '⬜' }}</text>
      </view>
      <text v-if="wish.description" class="wish-desc">{{ wish.description }}</text>
      <view v-if="wish.category" class="wish-tag">{{ wish.category }}</view>
    </view>
    <!-- 添加心愿弹窗 -->
    <view v-if="showAddWish" class="modal-mask" @click="showAddWish = false">
      <view class="modal-content card" @click.stop>
        <text class="modal-title">添加心愿</text>
        <input class="modal-input" v-model="newWish.title" placeholder="心愿标题" />
        <input class="modal-input" v-model="newWish.description" placeholder="心愿描述（选填）" />
        <input class="modal-input" v-model="newWish.category" placeholder="分类（旅行/美食/约会）" />
        <GradientButton text="添加" @click="addWish" class="mt-lg" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCheckinStore } from '../../stores/checkin'
import { generateId } from '../../utils/id'
import EmptyState from '../../components/common/EmptyState.vue'
import GradientButton from '../../components/common/GradientButton.vue'

const checkinStore = useCheckinStore()
const statusBarHeight = ref(44)
const showAddWish = ref(false)
const newWish = ref({ title: '', description: '', category: '' })
const wishes = computed(() => checkinStore.wishes)
const todayChecked = ref(false)

const doCheckin = () => {
  if (todayChecked.value) return
  const today = new Date().toISOString().split('T')[0]
  checkinStore.updateStreak(today)
  checkinStore.addCheckinRecord({ id: generateId(), date: today, createdAt: new Date().toISOString() })
  todayChecked.value = true
  uni.showToast({ title: '打卡成功！', icon: 'success' })
}

const toggleWish = (wish) => {
  checkinStore.updateWish(wish.id, { completed: !wish.completed, completedAt: !wish.completed ? new Date().toISOString() : null })
}

const addWish = () => {
  if (!newWish.value.title.trim()) return
  checkinStore.addWish({ id: generateId(), title: newWish.value.title, description: newWish.value.description, category: newWish.value.category, completed: false, createdAt: new Date().toISOString() })
  newWish.value = { title: '', description: '', category: '' }
  showAddWish.value = false
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  todayChecked.value = checkinStore.lastCheckinDate === new Date().toISOString().split('T')[0]
})
</script>

<style lang="scss" scoped>
.checkin-page { min-height: 100vh; background: var(--color-bg); padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.checkin-header { background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); padding: 20rpx 30rpx; text-align: center;
  .header-title { font-size: var(--font-size-xl); color: #fff; font-weight: bold; }
}
.stats-card { display: flex; justify-content: space-around; margin: -20rpx 30rpx 20rpx; position: relative; z-index: 2;
  .stat-item { text-align: center;
    .stat-number { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-primary); display: block; }
    .stat-label { font-size: var(--font-size-xs); color: var(--color-text-light); display: block; margin-top: 4rpx; }
  }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 24rpx; margin: 0 30rpx 20rpx; }
.checkin-today { display: flex; align-items: center; justify-content: center; gap: 16rpx; padding: 30rpx;
  .checkin-icon { font-size: 48rpx; }
  .checkin-text { font-size: var(--font-size-md); color: var(--color-text); font-weight: bold; }
}
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 0 30rpx; margin-bottom: 16rpx;
  .section-title { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); }
  .add-btn { font-size: var(--font-size-sm); color: var(--color-primary); }
}
.wish-card { margin: 0 30rpx 16rpx;
  .wish-header { display: flex; justify-content: space-between; align-items: center;
    .wish-title { font-size: var(--font-size-base); color: var(--color-text); font-weight: 500; &.completed { text-decoration: line-through; color: var(--color-text-light); } }
    .wish-status { font-size: 36rpx; }
  }
  .wish-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; margin-top: 8rpx; }
  .wish-tag { display: inline-block; font-size: var(--font-size-xs); color: var(--color-primary); background: var(--color-bg-secondary); padding: 4rpx 12rpx; border-radius: var(--radius-tag); margin-top: 8rpx; }
}
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--color-mask); display: flex; align-items: center; justify-content: center; z-index: 500; }
.modal-content { width: 80%; padding: 40rpx;
  .modal-title { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 24rpx; text-align: center; }
  .modal-input { background: var(--color-bg); border-radius: var(--radius-input); padding: 20rpx; font-size: var(--font-size-base); margin-bottom: 16rpx; }
}
</style>
