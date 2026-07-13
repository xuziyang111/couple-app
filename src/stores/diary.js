import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDiaryStore = defineStore('diary', () => {
  // 日记列表摘要（完整数据在IndexedDB）
  const diaryList = ref([])
  // 当前筛选条件
  const filterMood = ref('')
  const filterTag = ref('')
  // 草稿
  const draft = ref(null)

  const totalCount = computed(() => diaryList.value.length)

  const setDiaryList = (list) => {
    diaryList.value = list
  }

  const addDiaryToList = (diary) => {
    diaryList.value.unshift(diary)
  }

  const removeDiaryFromList = (id) => {
    diaryList.value = diaryList.value.filter(d => d.id !== id)
  }

  const setFilter = (mood, tag) => {
    filterMood.value = mood || ''
    filterTag.value = tag || ''
  }

  const saveDraft = (data) => {
    draft.value = data
  }

  const clearDraft = () => {
    draft.value = null
  }

  return {
    diaryList,
    filterMood,
    filterTag,
    draft,
    totalCount,
    setDiaryList,
    addDiaryToList,
    removeDiaryFromList,
    setFilter,
    saveDraft,
    clearDraft
  }
}, {
  unistorage: {
    paths: ['diaryList', 'draft']
  }
})
