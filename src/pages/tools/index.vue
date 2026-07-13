<template>
  <view class="tools-page">
    <view class="tools-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">趣味工具</text>
    </view>
    <view class="tools-grid">
      <view class="tool-card card" @click="goTo('/pages/tools/truth-dare')">
        <text class="tool-icon">🎲</text>
        <text class="tool-name">真心话大冒险</text>
        <text class="tool-desc">随机抽取，考验默契</text>
      </view>
      <view class="tool-card card" @click="goTo('/pages/tools/quiz')">
        <text class="tool-icon">💕</text>
        <text class="tool-name">默契问答</text>
        <text class="tool-desc">看看你们有多了解</text>
      </view>
      <view class="tool-card card" @click="goTo('/pages/tools/love-letter')">
        <text class="tool-icon">💌</text>
        <text class="tool-name">情书模板</text>
        <text class="tool-desc">甜蜜情话，表达爱意</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const statusBarHeight = ref(44)
const goTo = (url) => uni.navigateTo({ url })
onMounted(() => { const sysInfo = uni.getSystemInfoSync(); statusBarHeight.value = sysInfo.statusBarHeight || 44 })
</script>

<style lang="scss" scoped>
.tools-page { min-height: 100vh; background: var(--color-bg); padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.tools-header { background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); padding: 20rpx 30rpx; text-align: center;
  .header-title { font-size: var(--font-size-xl); color: #fff; font-weight: bold; }
}
.tools-grid { padding: 30rpx; display: flex; flex-direction: column; gap: 24rpx;
  .tool-card { display: flex; flex-direction: column; align-items: center; padding: 40rpx;
    .tool-icon { font-size: 80rpx; margin-bottom: 16rpx; }
    .tool-name { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 8rpx; }
    .tool-desc { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
</style>
