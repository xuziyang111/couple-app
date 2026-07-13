<template>
  <view class="heart-icon" :class="{ 'animate-heartbeat': animate }" @click="$emit('click')">
    <text class="heart-emoji" :style="{ fontSize: size + 'rpx', color: color }">❤</text>
  </view>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 40 },
  color: { type: String, default: 'var(--color-primary)' },
  animate: { type: Boolean, default: false }
})
defineEmits(['click'])
</script>

<style lang="scss" scoped>
.heart-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
