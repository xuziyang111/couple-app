import { ref } from 'vue'

export function useStorage() {
  const get = (key, defaultValue = null) => {
    try {
      const value = uni.getStorageSync(key)
      return value || defaultValue
    } catch (e) {
      return defaultValue
    }
  }

  const set = (key, value) => {
    try {
      uni.setStorageSync(key, value)
    } catch (e) {
      console.error('Storage set error:', e)
    }
  }

  const remove = (key) => {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      console.error('Storage remove error:', e)
    }
  }

  const clear = () => {
    try {
      uni.clearStorageSync()
    } catch (e) {
      console.error('Storage clear error:', e)
    }
  }

  return { get, set, remove, clear }
}
