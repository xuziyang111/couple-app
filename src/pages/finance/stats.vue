<template>
  <view class="stats-page">
    <view class="stats-content">
      <view class="stats-card card">
        <text class="card-title">月度统计</text>
        <text class="total-amount">¥{{ monthlyTotal.toFixed(2) }}</text>
        <view class="category-list">
          <view v-for="cat in categoryStats" :key="cat.name" class="category-item">
            <view class="cat-info">
              <text class="cat-icon">{{ cat.icon }}</text>
              <text class="cat-name">{{ cat.name }}</text>
            </view>
            <view class="cat-bar">
              <view class="bar-fill" :style="{ width: cat.percent + '%' }"></view>
            </view>
            <text class="cat-amount">¥{{ cat.amount.toFixed(2) }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getAllRecords } from '../../db'

const records = ref([])
const monthlyTotal = computed(() => {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return records.value.filter(r => r.date.startsWith(month)).reduce((s, r) => s + r.amount, 0)
})
const categoryStats = computed(() => {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthRecords = records.value.filter(r => r.date.startsWith(month))
  const groups = {}
  monthRecords.forEach(r => {
    if (!groups[r.category]) groups[r.category] = { name: r.category, icon: r.categoryIcon, amount: 0 }
    groups[r.category].amount += r.amount
  })
  const total = monthlyTotal.value || 1
  return Object.values(groups).sort((a, b) => b.amount - a.amount).map(g => ({ ...g, percent: (g.amount / total) * 100 }))
})
onMounted(async () => {
  const data = await getAllRecords('finances')
  records.value = data
})
</script>

<style lang="scss" scoped>
.stats-page { min-height: 100vh; background: var(--color-bg); padding: 30rpx; padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 24rpx; }
.stats-card {
  .card-title { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); display: block; }
  .total-amount { font-size: 60rpx; font-weight: bold; color: var(--color-primary); display: block; margin: 20rpx 0; }
  .category-list { .category-item { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx;
    .cat-info { display: flex; align-items: center; gap: 8rpx; width: 150rpx;
      .cat-icon { font-size: 32rpx; }
      .cat-name { font-size: var(--font-size-sm); color: var(--color-text); }
    }
    .cat-bar { flex: 1; height: 16rpx; background: var(--color-bg); border-radius: 8rpx; overflow: hidden;
      .bar-fill { height: 100%; background: linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end)); border-radius: 8rpx; transition: width 0.3s; }
    }
    .cat-amount { font-size: var(--font-size-sm); color: var(--color-text-secondary); width: 150rpx; text-align: right; }
  }}
}
</style>
