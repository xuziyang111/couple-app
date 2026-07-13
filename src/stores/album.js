import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAlbumStore = defineStore('album', () => {
  // 照片元数据列表（完整blob在IndexedDB）
  const photos = ref([])
  // 当前查看的月份
  const currentMonth = ref('')

  const totalCount = computed(() => photos.value.length)

  const setPhotos = (list) => {
    photos.value = list
  }

  const addPhoto = (photo) => {
    photos.value.unshift(photo)
  }

  const removePhoto = (id) => {
    photos.value = photos.value.filter(p => p.id !== id)
  }

  const getPhotosByMonth = (month) => {
    return photos.value.filter(p => p.createdAt.startsWith(month))
  }

  return {
    photos,
    currentMonth,
    totalCount,
    setPhotos,
    addPhoto,
    removePhoto,
    getPhotosByMonth
  }
}, {
  unistorage: {
    paths: ['photos']
  }
})
