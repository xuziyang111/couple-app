<template>
  <view class="detail-page">
    <view v-if="diary" class="detail-content">
      <view class="detail-header">
        <text class="detail-mood">{{ getMoodEmoji(diary.mood) }}</text>
        <text class="detail-date">{{ diary.createdAt }}</text>
      </view>
      <text class="detail-title">{{ diary.title }}</text>
      <text class="detail-body">{{ diary.content }}</text>
      <view v-if="diary.imageIds && diary.imageIds.length > 0" class="detail-images">
        <image v-for="(img, i) in diary.imageIds" :key="i" :src="img" class="detail-image" mode="widthFix" @click="previewImage(img)" />
      </view>
      <view v-if="diary.tags && diary.tags.length > 0" class="detail-tags">
        <text v-for="tag in diary.tags" :key="tag" class="tag">#{{ tag }}</text>
      </view>
      <view class="detail-actions">
        <view class="action-btn" @click="toggleLike">
          <text>{{ diary.liked ? '❤️' : '🤍' }} {{ diary.liked ? '已点赞' : '点赞' }}</text>
        </view>
        <view class="action-btn" @click="generatePoster">
          <text>🖼️ 生成海报</text>
        </view>
      </view>
      <!-- 评论区 -->
      <view class="comment-section card">
        <text class="section-title">评论</text>
        <view v-for="comment in diary.comments || []" :key="comment.id" class="comment-item">
          <text class="comment-author">{{ comment.author }}</text>
          <text class="comment-content">{{ comment.content }}</text>
          <text class="comment-time">{{ comment.createdAt }}</text>
        </view>
        <view class="comment-input">
          <input class="input" v-model="commentText" placeholder="写评论..." />
          <text class="send-btn" @click="addComment">发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { moods } from '../../data/moods'
import { getRecord, updateRecord } from '../../db'
import { usePoster } from '../../composables/usePoster'
import { useCoupleStore } from '../../stores/couple'
import { generateId } from '../../utils/id'

const diary = ref(null)
const commentText = ref('')
const coupleStore = useCoupleStore()
const { generatePoster: genPoster, posterUrl } = usePoster()

const getMoodEmoji = (moodId) => {
  const mood = moods.find(m => m.id === moodId)
  return mood ? mood.emoji : '😊'
}

const toggleLike = () => {
  diary.value.liked = !diary.value.liked
  diary.value.likes = (diary.value.likes || 0) + (diary.value.liked ? 1 : -1)
  updateRecord('diaries', diary.value.id, diary.value)
}

const addComment = () => {
  if (!commentText.value.trim()) return
  if (!diary.value.comments) diary.value.comments = []
  diary.value.comments.push({
    id: generateId(),
    author: coupleStore.myInfo.nickname,
    content: commentText.value,
    createdAt: new Date().toISOString().split('T')[0]
  })
  commentText.value = ''
  updateRecord('diaries', diary.value.id, diary.value)
}

const previewImage = (url) => {
  uni.previewImage({ urls: diary.value.imageIds })
}

const generatePoster = async () => {
  await genPoster(diary.value, coupleStore.coupleInfo)
  uni.previewImage({ urls: [posterUrl.value] })
}

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1]
  const id = page.options?.id
  if (id) {
    diary.value = await getRecord('diaries', id)
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: 30rpx;
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  .detail-mood { font-size: 40rpx; }
  .detail-date { font-size: var(--font-size-sm); color: var(--color-text-light); }
}

.detail-title {
  font-size: var(--font-size-xl);
  font-weight: bold;
  color: var(--color-text);
  display: block;
  margin-bottom: 20rpx;
}

.detail-body {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.8;
  display: block;
  margin-bottom: 24rpx;
}

.detail-images {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 20rpx;
  .detail-image { width: 100%; border-radius: var(--radius-image); }
}

.detail-tags {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
  margin-bottom: 24rpx;
  .tag { font-size: var(--font-size-sm); color: var(--color-primary); background: var(--color-bg-secondary); padding: 6rpx 16rpx; border-radius: var(--radius-tag); }
}

.detail-actions {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  .action-btn {
    padding: 16rpx 32rpx;
    background: var(--color-card);
    border-radius: var(--radius-button);
    box-shadow: var(--shadow-card);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
}

.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 24rpx;
}

.comment-section {
  .section-title { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 16rpx; }
  .comment-item { padding: 16rpx 0; border-bottom: 1rpx solid var(--color-border);
    .comment-author { font-size: var(--font-size-sm); color: var(--color-primary); display: block; }
    .comment-content { font-size: var(--font-size-base); color: var(--color-text); display: block; margin-top: 6rpx; }
    .comment-time { font-size: var(--font-size-xs); color: var(--color-text-light); display: block; margin-top: 6rpx; }
  }
  .comment-input {
    display: flex;
    gap: 16rpx;
    margin-top: 16rpx;
    .input { flex: 1; background: var(--color-bg); border-radius: var(--radius-input); padding: 16rpx 20rpx; font-size: var(--font-size-base); }
    .send-btn { color: var(--color-primary); font-size: var(--font-size-base); line-height: 56rpx; }
  }
}
</style>
