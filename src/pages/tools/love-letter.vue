<template>
  <view class="letter-page">
    <view v-if="!selectedLetter" class="letter-list">
      <text class="page-title">情书模板</text>
      <view v-for="letter in loveLetters" :key="letter.id" class="letter-card card" @click="selectLetter(letter)">
        <text class="letter-title">{{ letter.title }}</text>
        <text class="letter-preview">{{ letter.content.substring(0, 50) }}...</text>
      </view>
    </view>
    <view v-else class="letter-detail">
      <view class="detail-header">
        <text class="back-btn" @click="selectedLetter = null">← 返回</text>
        <text class="letter-title">{{ selectedLetter.title }}</text>
      </view>
      <view class="letter-content card">
        <textarea class="letter-text" v-model="editedContent" auto-height />
      </view>
      <view class="letter-actions">
        <GradientButton text="保存" @click="saveLetter" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { loveLetters } from '../../data/love-letters'
import GradientButton from '../../components/common/GradientButton.vue'

const selectedLetter = ref(null)
const editedContent = ref('')
const selectLetter = (letter) => { selectedLetter.value = letter; editedContent.value = letter.content }
const saveLetter = () => {
  uni.setStorageSync(`letter_${selectedLetter.value.id}`, editedContent.value)
  uni.showToast({ title: '保存成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.letter-page { min-height: 100vh; background: var(--color-bg); padding: 30rpx; padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.letter-list { .page-title { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 24rpx; }
  .letter-card { margin-bottom: 16rpx; padding: 24rpx;
    .letter-title { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 8rpx; }
    .letter-preview { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  }
}
.letter-detail { .detail-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx;
    .back-btn { font-size: var(--font-size-base); color: var(--color-primary); }
    .letter-title { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-text); }
  }
  .letter-content { padding: 30rpx; min-height: 400rpx;
    .letter-text { width: 100%; font-size: var(--font-size-base); color: var(--color-text); line-height: 1.8; background: transparent; min-height: 300rpx; }
  }
  .letter-actions { margin-top: 30rpx; }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
</style>
