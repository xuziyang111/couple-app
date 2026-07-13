<template>
  <view class="chat-page">
    <!-- 顶部导航 -->
    <view class="chat-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-content">
        <text class="header-title">{{ coupleStore.partnerInfo.nickname || '悄悄话' }}</text>
        <text class="header-status">在线</text>
      </view>
    </view>

    <!-- 消息列表 -->
    <scroll-view class="message-list" scroll-y :scroll-into-view="scrollToId" @scrolltoupper="loadMore">
      <view v-if="loading" class="loading-more">
        <text class="animate-spin">◌</text>
        <text>加载中...</text>
      </view>
      
      <view v-for="(msg, index) in displayMessages" :key="msg.id" :id="'msg-' + msg.id" class="message-wrapper">
        <!-- 时间分隔 -->
        <view v-if="shouldShowTime(index)" class="time-divider">
          <text>{{ formatMsgTime(msg.timestamp) }}</text>
        </view>
        
        <!-- 消息气泡 -->
        <view class="message-row" :class="{ 'is-me': msg.senderId === myUserId }">
          <image v-if="msg.senderId !== myUserId" :src="coupleStore.partnerInfo.avatar || '/static/default-avatar.png'" class="msg-avatar" />
          <view class="msg-bubble" :class="getBubbleClass(msg)">
            <!-- 文字消息 -->
            <text v-if="msg.type === 'text'" class="msg-text">{{ msg.content }}</text>
            <!-- 图片消息 -->
            <image v-else-if="msg.type === 'image'" :src="msg.content" class="msg-image" mode="widthFix" @click="previewImage(msg.content)" />
            <!-- 语音消息 -->
            <view v-else-if="msg.type === 'voice'" class="msg-voice" @click="playVoice(msg)">
              <text class="voice-icon">🔊</text>
              <text class="voice-duration">{{ msg.duration || 0 }}"</text>
            </view>
            <!-- 系统消息 -->
            <text v-else-if="msg.type === 'system'" class="msg-system">{{ msg.content }}</text>
          </view>
          <image v-if="msg.senderId === myUserId" :src="coupleStore.myInfo.avatar || '/static/default-avatar.png'" class="msg-avatar" />
        </view>
      </view>
      
      <view id="msg-bottom" style="height: 20rpx;"></view>
    </scroll-view>

    <!-- 输入栏 -->
    <view class="input-bar">
      <view class="input-row">
        <text class="input-action" @click="toggleVoice">🎤</text>
        <input v-if="!showVoice" class="msg-input" v-model="inputText" placeholder="说点什么..." confirm-type="send" @confirm="sendText" />
        <view v-else class="voice-btn" @touchstart="startRecord" @touchend="stopRecord" @touchcancel="cancelRecord">
          <text>{{ isRecording ? '松开结束' : '按住说话' }}</text>
        </view>
        <text class="input-action" @click="toggleEmoji">😊</text>
        <text class="input-action" @click="chooseImage">📷</text>
      </view>
      
      <!-- 表情面板 -->
      <view v-if="showEmoji" class="emoji-panel">
        <view class="emoji-grid">
          <text v-for="(emoji, i) in emojis" :key="i" class="emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useCoupleStore } from '../../stores/couple'
import { useChatStore } from '../../stores/chat'
import { useVoiceRecorder } from '../../composables/useVoiceRecorder'
import { useImageCompress } from '../../composables/useImageCompress'
import { useCloudSync } from '../../composables/useCloudSync'
import { emojis } from '../../data/emojis'
import { generateId } from '../../utils/id'
import { formatDateTime } from '../../utils/date'
import { createRecord, getAllRecords } from '../../db'

const coupleStore = useCoupleStore()
const chatStore = useChatStore()
const cloudSync = useCloudSync()
const { isRecording, startRecord, stopRecord, cancelRecord, playVoice, currentRecordPath, duration } = useVoiceRecorder()
const { compressImage } = useImageCompress()

const statusBarHeight = ref(44)
const inputText = ref('')
const showVoice = ref(false)
const showEmoji = ref(false)
const scrollToId = ref('msg-bottom')
const loading = ref(false)
const myUserId = computed(() => coupleStore.myInfo.userId)

const displayMessages = computed(() => chatStore.messages)

const shouldShowTime = (index) => {
  if (index === 0) return true
  const curr = displayMessages.value[index]
  const prev = displayMessages.value[index - 1]
  return (curr.timestamp - prev.timestamp) > 5 * 60 * 1000 // 5分钟间隔
}

const formatMsgTime = (timestamp) => {
  return formatDateTime(new Date(timestamp))
}

const getBubbleClass = (msg) => {
  if (msg.type === 'system') return 'system'
  return msg.senderId === myUserId.value ? 'is-me' : 'is-partner'
}

const sendText = async () => {
  if (!inputText.value.trim()) return
  const msg = {
    id: generateId(),
    senderId: myUserId.value,
    type: 'text',
    content: inputText.value.trim(),
    timestamp: Date.now(),
    isFavorite: false,
    isRead: false,
    coupleId: coupleStore.coupleInfo?.id || null
  }
  try {
    chatStore.addMessage(msg)
    await createRecord('messages', msg)
    
    // 推送到云端（触发实时同步）
    if (cloudSync.isOnline && cloudSync.coupleId) {
      cloudSync.pushData('messages', msg)
    }
    
    inputText.value = ''
    scrollToBottom()
  } catch (e) {
    console.error('[Chat] 发送消息失败:', e)
    uni.showToast({ title: '发送失败，请重试', icon: 'none' })
  }
}

const chooseImage = async () => {
  try {
    const res = await new Promise((resolve, reject) => {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: resolve,
        fail: reject
      })
    })
    const compressed = await compressImage(res.tempFilePaths[0])
    const msg = {
      id: generateId(),
      senderId: myUserId.value,
      type: 'image',
      content: compressed,
      timestamp: Date.now(),
      isFavorite: false,
      isRead: false,
      coupleId: coupleStore.coupleInfo?.id || null
    }
    chatStore.addMessage(msg)
    await createRecord('messages', msg)
    
    // 推送到云端（触发实时同步）
    if (cloudSync.isOnline && cloudSync.coupleId) {
      cloudSync.pushData('messages', msg)
    }
    
    scrollToBottom()
  } catch (e) {
    if (e.errMsg && e.errMsg.includes('cancel')) {
      console.log('选择图片取消')
    } else {
      console.error('[Chat] 发送图片失败:', e)
      uni.showToast({ title: '发送失败，请重试', icon: 'none' })
    }
  }
}

const previewImage = (url) => {
  uni.previewImage({ urls: [url] })
}

const toggleVoice = () => {
  showVoice.value = !showVoice.value
  showEmoji.value = false
}

const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value
  showVoice.value = false
}

const insertEmoji = (emoji) => {
  inputText.value += emoji
}

const scrollToBottom = async () => {
  await nextTick()
  scrollToId.value = 'msg-bottom'
}

// 加载更多消息（向上滚动时触发）
const loadMore = async () => {
  // TODO: 实现分页加载历史消息
  console.log('[Chat] 加载更多消息')
}

// 处理收到的实时消息
const handleIncomingMessage = (record, event) => {
  if (event === 'delete' || record._deleted) {
    // 删除消息
    chatStore.messages = chatStore.messages.filter(m => m.id !== record.id)
    return
  }
  
  // 检查是否是自己发送的消息（避免重复显示）
  const exists = chatStore.messages.some(m => m.id === record.id)
  if (!exists) {
    chatStore.addMessage(record)
    scrollToBottom()
  }
}

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  
  console.log('[Chat] 页面挂载, cloudSync.isOnline:', cloudSync.isOnline, ', cloudSync.coupleId:', cloudSync.coupleId)
  
  // 加载本地消息
  const messages = await getAllRecords('messages')
  messages.sort((a, b) => a.timestamp - b.timestamp)
  chatStore.setMessages(messages)
  chatStore.clearUnread()
  scrollToBottom()
  
  // 注册实时消息回调
  if (cloudSync.isOnline && cloudSync.coupleId) {
    cloudSync.registerCallback('messages', handleIncomingMessage)
    console.log('[Chat] ✅ 已注册实时消息监听')
  } else {
    console.warn('[Chat] ⚠️ 未注册实时监听 - isOnline:', cloudSync.isOnline, ', coupleId:', cloudSync.coupleId)
  }
})

onUnmounted(() => {
  // 取消注册
  cloudSync.unregisterCallback('messages')
  console.log('[Chat] 已取消实时消息监听')
})
</script>

<style lang="scss" scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  // iOS 视口高度修复
  height: -webkit-fill-available;
  height: 100dvh;
  background: var(--color-bg);
  overflow: hidden;
}

.chat-header {
  background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  
  .header-content {
    padding: 20rpx 30rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    
    .header-title {
      font-size: var(--font-size-lg);
      color: #fff;
      font-weight: bold;
    }
    
    .header-status {
      font-size: var(--font-size-xs);
      color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.2);
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
    }
  }
}

.message-list {
  flex: 1;
  padding: 20rpx;
  -webkit-overflow-scrolling: touch;
  overflow-y: auto;
  min-height: 0; // iOS flex child 滚动修复
  
  .loading-more {
    text-align: center;
    padding: 20rpx;
    color: var(--color-text-light);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
  }
  
  .time-divider {
    text-align: center;
    padding: 20rpx 0;
    
    text {
      font-size: var(--font-size-xs);
      color: var(--color-text-light);
      background: var(--color-bg-secondary);
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
    }
  }
  
  .message-row {
    display: flex;
    align-items: flex-start;
    gap: 16rpx;
    margin-bottom: 20rpx;
    
    &.is-me {
      flex-direction: row-reverse;
      
      .msg-bubble {
        background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
        color: #fff;
        border-radius: 24rpx 4rpx 24rpx 24rpx;
      }
    }
    
    .msg-avatar {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      flex-shrink: 0;
    }
    
    .msg-bubble {
      max-width: 60%;
      padding: 20rpx 24rpx;
      background: var(--color-card);
      border-radius: 4rpx 24rpx 24rpx 24rpx;
      box-shadow: var(--shadow-card);
      
      &.system {
        background: transparent;
        box-shadow: none;
        text-align: center;
        max-width: 100%;
        
        .msg-system {
          font-size: var(--font-size-sm);
          color: var(--color-text-light);
        }
      }
      
      .msg-text {
        font-size: var(--font-size-base);
        line-height: 1.5;
        word-break: break-all;
      }
      
      .msg-image {
        max-width: 400rpx;
        border-radius: var(--radius-image);
      }
      
      .msg-voice {
        display: flex;
        align-items: center;
        gap: 10rpx;
        min-width: 150rpx;
        
        .voice-icon {
          font-size: 32rpx;
        }
        
        .voice-duration {
          font-size: var(--font-size-sm);
        }
      }
    }
  }
}

.input-bar {
  background: var(--color-card);
  border-top: 1rpx solid var(--color-border);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  flex-shrink: 0; // iOS 防止输入栏被压缩
  
  .input-row {
    display: flex;
    align-items: center;
    padding: 16rpx 20rpx;
    gap: 16rpx;
    
    .input-action {
      font-size: 44rpx;
      flex-shrink: 0;
    }
    
    .msg-input {
      flex: 1;
      background: var(--color-bg);
      border-radius: 36rpx;
      padding: 16rpx 24rpx;
      font-size: var(--font-size-base);
    }
    
    .voice-btn {
      flex: 1;
      background: var(--color-bg);
      border-radius: 36rpx;
      padding: 16rpx 24rpx;
      text-align: center;
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }
  }
  
  .emoji-panel {
    max-height: 400rpx;
    overflow-y: auto;
    padding: 20rpx;
    
    .emoji-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10rpx;
      
      .emoji-item {
        font-size: 48rpx;
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}
</style>
