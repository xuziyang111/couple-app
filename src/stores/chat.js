import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useChatStore = defineStore('chat', () => {
  // 消息列表（缓存最近50条）
  const messages = ref([])
  // 未读数
  const unreadCount = ref(0)
  // 收藏消息ID列表
  const favoriteIds = ref([])
  // 最后一条消息时间
  const lastMessageTime = ref(null)

  const hasMessages = computed(() => messages.value.length > 0)

  // 添加消息
  const addMessage = (msg) => {
    messages.value.push(msg)
    // 保持缓存不超过200条
    if (messages.value.length > 200) {
      messages.value = messages.value.slice(-200)
    }
    lastMessageTime.value = msg.timestamp
  }

  // 设置消息列表
  const setMessages = (list) => {
    messages.value = list
    if (list.length > 0) {
      lastMessageTime.value = list[list.length - 1].timestamp
    }
  }

  // 清除未读
  const clearUnread = () => {
    unreadCount.value = 0
  }

  // 收藏/取消收藏
  const toggleFavorite = (msgId) => {
    const idx = favoriteIds.value.indexOf(msgId)
    if (idx > -1) {
      favoriteIds.value.splice(idx, 1)
    } else {
      favoriteIds.value.push(msgId)
    }
  }

  // 清空所有消息
  const clearMessages = () => {
    messages.value = []
    unreadCount.value = 0
    favoriteIds.value = []
    lastMessageTime.value = null
  }

  return {
    messages,
    unreadCount,
    favoriteIds,
    lastMessageTime,
    hasMessages,
    addMessage,
    setMessages,
    clearUnread,
    toggleFavorite,
    clearMessages
  }
}, {
  unistorage: {
    paths: ['unreadCount', 'favoriteIds', 'lastMessageTime']
  }
})
