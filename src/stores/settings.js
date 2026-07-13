import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // 当前主题
  const currentTheme = ref('sweet')
  // 背景主题图
  const bgImage = ref('')
  // 消息提示音
  const soundEnabled = ref(true)
  // 隐私锁
  const privacyLock = ref(false)
  // 图片质量
  const imageQuality = ref('high') // high | medium | low

  const setTheme = (theme) => {
    currentTheme.value = theme
    uni.$emit('theme-change', theme)
  }

  const setBgImage = (image) => {
    bgImage.value = image
  }

  const toggleSound = () => {
    soundEnabled.value = !soundEnabled.value
  }

  const togglePrivacyLock = () => {
    privacyLock.value = !privacyLock.value
  }

  const setImageQuality = (quality) => {
    imageQuality.value = quality
  }

  return {
    currentTheme,
    bgImage,
    soundEnabled,
    privacyLock,
    imageQuality,
    setTheme,
    setBgImage,
    toggleSound,
    togglePrivacyLock,
    setImageQuality
  }
}, {
  unistorage: true
})
