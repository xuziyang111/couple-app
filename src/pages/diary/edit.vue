<template>
  <view class="edit-page">
    <view class="form-section">
      <input class="title-input" v-model="title" placeholder="标题" maxlength="50" />
      <textarea class="content-input" v-model="content" placeholder="记录你们的故事..." maxlength="2000" auto-height />
    </view>
    <view class="form-section">
      <text class="label">心情</text>
      <view class="mood-list">
        <view v-for="mood in moods" :key="mood.id" class="mood-item" :class="{ active: selectedMood === mood.id }" @click="selectedMood = mood.id">
          <text class="mood-emoji">{{ mood.emoji }}</text>
          <text class="mood-label">{{ mood.label }}</text>
        </view>
      </view>
    </view>
    <view class="form-section">
      <text class="label">图片</text>
      <view class="image-list">
        <view v-for="(img, i) in images" :key="i" class="image-item">
          <image :src="img" class="preview-image" mode="aspectFill" />
          <text class="remove-btn" @click="removeImage(i)">×</text>
        </view>
        <view v-if="images.length < 9" class="add-image" @click="chooseImage">
          <text class="add-icon">+</text>
        </view>
      </view>
    </view>
    <view class="form-section">
      <text class="label">标签</text>
      <view class="tag-input-row">
        <input class="tag-input" v-model="tagInput" placeholder="输入标签" @confirm="addTag" />
        <view class="tag-list">
          <view v-for="tag in tags" :key="tag" class="tag-item">
            <text>#{{ tag }}</text>
            <text class="tag-remove" @click="removeTag(tag)">×</text>
          </view>
        </view>
      </view>
    </view>
    <view class="bottom-actions">
      <GradientButton text="保存草稿" @click="saveDraft" />
      <GradientButton text="发布" @click="publish" />
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { moods } from '../../data/moods'
import { generateId } from '../../utils/id'
import { createRecord } from '../../db'
import { useDiaryStore } from '../../stores/diary'
import { useImageCompress } from '../../composables/useImageCompress'
import { useCloudSync } from '../../composables/useCloudSync'
import GradientButton from '../../components/common/GradientButton.vue'

const diaryStore = useDiaryStore()
const cloudSync = useCloudSync()
const { compressImage } = useImageCompress()

const title = ref('')
const content = ref('')
const selectedMood = ref('happy')
const images = ref([])
const tags = ref([])
const tagInput = ref('')

const chooseImage = async () => {
  try {
    const res = await new Promise((resolve, reject) => {
      uni.chooseImage({ count: 9 - images.value.length, sizeType: ['compressed'], sourceType: ['album', 'camera'], success: resolve, fail: reject })
    })
    for (const path of res.tempFilePaths) {
      const compressed = await compressImage(path)
      images.value.push(compressed)
    }
  } catch (e) { console.log('取消选择') }
}

const removeImage = (index) => { images.value.splice(index, 1) }
const addTag = () => { if (tagInput.value.trim() && tags.value.length < 5) { tags.value.push(tagInput.value.trim()); tagInput.value = '' } }
const removeTag = (tag) => { tags.value = tags.value.filter(t => t !== tag) }

const saveDraft = () => {
  diaryStore.saveDraft({ title: title.value, content: content.value, mood: selectedMood.value, images: images.value, tags: tags.value })
  uni.showToast({ title: '草稿已保存', icon: 'success' })
}

const publish = async () => {
  console.log('[DiaryEdit] 发布日记, title:', title.value, ', length:', title.value?.length)
  if (!title.value || !title.value.trim()) { 
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return 
  }
  const diary = {
    id: generateId(),
    title: title.value,
    content: content.value,
    mood: selectedMood.value,
    imageIds: images.value,
    tags: tags.value,
    likes: 0,
    liked: false,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  await createRecord('diaries', diary)
  diaryStore.addDiaryToList(diary)
  diaryStore.clearDraft()
  
  // 推送到云端
  cloudSync.pushData('diaries', diary)
  
  uni.showToast({ title: '发布成功', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 1500)
}

onMounted(() => {
  if (diaryStore.draft) {
    title.value = diaryStore.draft.title || ''
    content.value = diaryStore.draft.content || ''
    selectedMood.value = diaryStore.draft.mood || 'happy'
    images.value = diaryStore.draft.images || []
    tags.value = diaryStore.draft.tags || []
  }
})
</script>

<style lang="scss" scoped>
.edit-page { min-height: 100vh; background: var(--color-bg); padding: 30rpx; padding-bottom: calc(160rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(160rpx + env(safe-area-inset-bottom)); }
.form-section { margin-bottom: 30rpx;
  .label { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; margin-bottom: 12rpx; }
}
.title-input { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-text); background: transparent; padding: 0; margin-bottom: 20rpx; width: 100%; }
.content-input { font-size: var(--font-size-base); color: var(--color-text); background: var(--color-card); border-radius: var(--radius-card); padding: 24rpx; width: 100%; min-height: 300rpx; box-shadow: var(--shadow-card); }
.mood-list { display: flex; flex-wrap: wrap; gap: 16rpx;
  .mood-item { display: flex; flex-direction: column; align-items: center; padding: 12rpx 20rpx; border-radius: var(--radius-tag); background: var(--color-card); box-shadow: var(--shadow-card);
    &.active { background: var(--color-primary); .mood-label { color: #fff; } }
    .mood-emoji { font-size: 40rpx; }
    .mood-label { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: 4rpx; }
  }
}
.image-list { display: flex; flex-wrap: wrap; gap: 16rpx;
  .image-item { position: relative; width: 200rpx; height: 200rpx;
    .preview-image { width: 100%; height: 100%; border-radius: var(--radius-image); }
    .remove-btn { position: absolute; top: -10rpx; right: -10rpx; width: 40rpx; height: 40rpx; background: var(--color-error); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28rpx; }
  }
  .add-image { width: 200rpx; height: 200rpx; border: 2rpx dashed var(--color-border); border-radius: var(--radius-image); display: flex; align-items: center; justify-content: center;
    .add-icon { font-size: 60rpx; color: var(--color-text-light); }
  }
}
.tag-input-row { display: flex; flex-wrap: wrap; gap: 10rpx; align-items: center;
  .tag-input { background: var(--color-card); border-radius: var(--radius-input); padding: 12rpx 20rpx; font-size: var(--font-size-sm); flex: 1; min-width: 200rpx; }
  .tag-item { display: flex; align-items: center; gap: 6rpx; background: var(--color-bg-secondary); padding: 8rpx 16rpx; border-radius: var(--radius-tag); font-size: var(--font-size-sm); color: var(--color-primary);
    .tag-remove { font-size: 24rpx; color: var(--color-text-light); }
  }
}
.bottom-actions { position: fixed; bottom: 0; left: 0; right: 0; display: flex; gap: 20rpx; padding: 20rpx 30rpx; background: var(--color-card); border-top: 1rpx solid var(--color-border); padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); }
</style>
