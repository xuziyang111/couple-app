<template>
  <view class="td-page">
    <view class="td-content">
      <view class="mode-tabs">
        <view class="tab" :class="{ active: mode === 'truth' }" @click="mode = 'truth'">真心话</view>
        <view class="tab" :class="{ active: mode === 'dare' }" @click="mode = 'dare'">大冒险</view>
      </view>
      <view class="card-display card" @click="drawCard">
        <text class="card-icon">{{ mode === 'truth' ? '💬' : '🎯' }}</text>
        <text class="card-text">{{ currentText || '点击抽取' }}</text>
      </view>
      <GradientButton :text="currentText ? '换一个' : '开始抽取'" @click="drawCard" />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { truths } from '../../data/truths'
import { dares } from '../../data/dares'
import GradientButton from '../../components/common/GradientButton.vue'

const mode = ref('truth')
const currentText = ref('')
const drawCard = () => {
  const list = mode.value === 'truth' ? truths : dares
  currentText.value = list[Math.floor(Math.random() * list.length)]
}
</script>

<style lang="scss" scoped>
.td-page { min-height: 100vh; background: var(--color-bg); padding: 30rpx; padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); display: flex; align-items: center; justify-content: center; }
.td-content { width: 100%; text-align: center; }
.mode-tabs { display: flex; justify-content: center; gap: 20rpx; margin-bottom: 40rpx;
  .tab { padding: 16rpx 48rpx; border-radius: var(--radius-button); background: var(--color-card); font-size: var(--font-size-base); color: var(--color-text-secondary); box-shadow: var(--shadow-card);
    &.active { background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); color: #fff; }
  }
}
.card-display { padding: 60rpx 40rpx; text-align: center; margin-bottom: 40rpx; min-height: 300rpx; display: flex; flex-direction: column; align-items: center; justify-content: center;
  .card-icon { font-size: 80rpx; margin-bottom: 24rpx; }
  .card-text { font-size: var(--font-size-lg); color: var(--color-text); line-height: 1.6; }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
</style>
