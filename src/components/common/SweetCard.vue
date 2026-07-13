<template>
  <view class="sweet-card" :style="customStyle">
    <slot></slot>
  </view>
</template>

<script setup>
defineProps({
  customStyle: { type: Object, default: () => ({}) }
})
</script>

<style lang="scss" scoped>
.sweet-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 24rpx;
  margin-bottom: 20rpx;
}
</style>
