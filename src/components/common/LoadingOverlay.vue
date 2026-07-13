<template>
  <view v-if="visible" class="loading-overlay">
    <view class="loading-content">
      <text class="loading-heart animate-heartbeat">❤</text>
      <text class="loading-text">{{ text }}</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  text: { type: String, default: '加载中...' }
})
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-mask);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  
  .loading-content {
    background: var(--color-card);
    border-radius: var(--radius-card);
    padding: 40rpx 60rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
  }
  
  .loading-heart {
    font-size: 60rpx;
    color: var(--color-primary);
  }
  
  .loading-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}
</style>
