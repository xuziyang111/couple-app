import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useFinanceStore = defineStore('finance', () => {
  // 记账记录列表（摘要，完整数据在IndexedDB）
  const records = ref([])
  // 当月汇总缓存
  const monthlySummary = ref({ total: 0, byCategory: {} })

  const totalAmount = computed(() => {
    return records.value.reduce((sum, r) => sum + r.amount, 0)
  })

  const setRecords = (list) => {
    records.value = list
  }

  const addRecord = (record) => {
    records.value.push(record)
  }

  const removeRecord = (id) => {
    records.value = records.value.filter(r => r.id !== id)
  }

  const updateMonthlySummary = (summary) => {
    monthlySummary.value = summary
  }

  return {
    records,
    monthlySummary,
    totalAmount,
    setRecords,
    addRecord,
    removeRecord,
    updateMonthlySummary
  }
}, {
  unistorage: {
    paths: ['records', 'monthlySummary']
  }
})
