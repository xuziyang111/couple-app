<template>
  <view class="gradient-button" :class="{ disabled, loading }" @click="handleClick">
    <text v-if="loading" class="loading-icon animate-spin">◌</text>
    <text class="btn-text">{{ text }}</text>
  </view>
</template>

<script setup>
const props = defineProps({
  text: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])

const handleClick = () => {
  if (!props.disabled && !props.loading) {
    emit('click')
  }
}
</script>

<style lang="scss" scoped>
.gradient-button {
  background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  color: #fff;
  border-radius: var(--radius-button);
  box-shadow: var(--shadow-button);
  padding: 20rpx 40rpx;
  text-align: center;
  font-size: var(--font-size-base);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  
  &.loading {
    pointer-events: none;
  }
  
  .loading-icon {
    font-size: 32rpx;
  }
}
</style>
