import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAnniversaryStore = defineStore('anniversary', () => {
  // 纪念日列表
  const anniversaries = ref([])

  const sortedAnniversaries = computed(() => {
    return [...anniversaries.value].sort((a, b) => {
      return new Date(a.date) - new Date(b.date)
    })
  })

  const addAnniversary = (item) => {
    anniversaries.value.push(item)
  }

  const updateAnniversary = (id, data) => {
    const idx = anniversaries.value.findIndex(a => a.id === id)
    if (idx > -1) {
      anniversaries.value[idx] = { ...anniversaries.value[idx], ...data }
    }
  }

  const removeAnniversary = (id) => {
    anniversaries.value = anniversaries.value.filter(a => a.id !== id)
  }

  return {
    anniversaries,
    sortedAnniversaries,
    addAnniversary,
    updateAnniversary,
    removeAnniversary
  }
}, {
  unistorage: true
})
