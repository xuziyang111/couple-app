<template>
  <view class="empty-state">
    <text class="empty-icon">{{ icon }}</text>
    <text class="empty-text">{{ text }}</text>
    <slot></slot>
  </view>
</template>

<script setup>
defineProps({
  icon: { type: String, default: '💭' },
  text: { type: String, default: '暂无内容' }
})
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
  
  .empty-icon {
    font-size: 100rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: var(--font-size-base);
    color: var(--color-text-light);
  }
}
</style>
