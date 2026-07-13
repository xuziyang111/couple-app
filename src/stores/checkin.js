import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCheckinStore = defineStore('checkin', () => {
  // 心愿列表
  const wishes = ref([])
  // 打卡记录
  const checkinRecords = ref([])
  // 连续打卡天数
  const streakDays = ref(0)
  // 最后打卡日期
  const lastCheckinDate = ref('')
  // 总打卡天数
  const totalCheckinDays = ref(0)

  const wishCount = computed(() => wishes.value.length)
  const completedWishCount = computed(() => wishes.value.filter(w => w.completed).length)
  const progressPercent = computed(() => {
    if (wishCount.value === 0) return 0
    return Math.round((completedWishCount.value / wishCount.value) * 100)
  })

  const addWish = (wish) => {
    wishes.value.push(wish)
  }

  const updateWish = (id, data) => {
    const idx = wishes.value.findIndex(w => w.id === id)
    if (idx > -1) {
      wishes.value[idx] = { ...wishes.value[idx], ...data }
    }
  }

  const removeWish = (id) => {
    wishes.value = wishes.value.filter(w => w.id !== id)
  }

  const addCheckinRecord = (record) => {
    checkinRecords.value.push(record)
  }

  const updateStreak = (date) => {
    if (lastCheckinDate.value === date) return
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (lastCheckinDate.value === yesterdayStr) {
      streakDays.value++
    } else {
      streakDays.value = 1
    }
    lastCheckinDate.value = date
    totalCheckinDays.value++
  }

  return {
    wishes,
    checkinRecords,
    streakDays,
    lastCheckinDate,
    totalCheckinDays,
    wishCount,
    completedWishCount,
    progressPercent,
    addWish,
    updateWish,
    removeWish,
    addCheckinRecord,
    updateStreak
  }
}, {
  unistorage: true
})
