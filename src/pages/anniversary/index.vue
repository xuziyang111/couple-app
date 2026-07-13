<template>
  <view class="anniversary-page">
    <view class="anni-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">纪念日</text>
    </view>
    <!-- 恋爱天数 -->
    <view class="love-days-card card">
      <text class="days-label">我们在一起</text>
      <text class="days-number">{{ loveDays }}</text>
      <text class="days-unit">天</text>
      <text class="days-date">从 {{ coupleStore.loveStartDate || '???' }} 开始</text>
    </view>
    <!-- 纪念日列表 -->
    <view class="section-header">
      <text class="section-title">纪念日列表</text>
      <text class="add-btn" @click="showAdd = true">+ 添加</text>
    </view>
    <EmptyState v-if="anniversaries.length === 0" icon="📅" text="还没有纪念日" />
    <view v-for="item in anniversaries" :key="item.id" class="anni-card card">
      <view class="anni-header-row">
        <text class="anni-icon">{{ item.icon || '📅' }}</text>
        <view class="anni-info">
          <text class="anni-title">{{ item.title }}</text>
          <text class="anni-date">{{ item.date }}</text>
        </view>
        <view class="anni-countdown">
          <text v-if="getCountdown(item.date).passed" class="passed">已过</text>
          <text v-else class="countdown-num">{{ getCountdown(item.date).days }}天</text>
        </view>
      </view>
      <text v-if="item.note" class="anni-note">{{ item.note }}</text>
    </view>
    <!-- 添加弹窗 -->
    <view v-if="showAdd" class="modal-mask" @click="showAdd = false">
      <view class="modal-content card" @click.stop>
        <text class="modal-title">添加纪念日</text>
        <input class="modal-input" v-model="newItem.title" placeholder="纪念日名称" />
        <picker mode="date" @change="onDateChange">
          <view class="modal-input date-pick">{{ newItem.date || '选择日期' }}</view>
        </picker>
        <input class="modal-input" v-model="newItem.note" placeholder="备注（选填）" />
        <input class="modal-input" v-model="newItem.icon" placeholder="图标emoji（选填）" maxlength="2" />
        <GradientButton text="添加" @click="addAnniversary" class="mt-lg" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCoupleStore } from '../../stores/couple'
import { useAnniversaryStore } from '../../stores/anniversary'
import { useDateCalc } from '../../composables/useDateCalc'
import { generateId } from '../../utils/id'
import { createRecord } from '../../db'
import EmptyState from '../../components/common/EmptyState.vue'
import GradientButton from '../../components/common/GradientButton.vue'
import { useCloudSync } from '../../composables/useCloudSync'

const coupleStore = useCoupleStore()
const anniversaryStore = useAnniversaryStore()
const cloudSync = useCloudSync()
const { loveDays, calcLoveDays, calcCountdown } = useDateCalc()
const statusBarHeight = ref(44)
const showAdd = ref(false)
const newItem = ref({ title: '', date: '', note: '', icon: '📅' })
const anniversaries = computed(() => anniversaryStore.sortedAnniversaries)

const getCountdown = (date) => calcCountdown(date)
const onDateChange = (e) => { newItem.value.date = e.detail.value }
const addAnniversary = async () => {
  if (!newItem.value.title.trim() || !newItem.value.date) return
  const item = { id: generateId(), ...newItem.value, createdAt: new Date().toISOString() }
  anniversaryStore.addAnniversary(item)
  await createRecord('anniversaries', item)
  cloudSync.pushData('anniversaries', item)
  newItem.value = { title: '', date: '', note: '', icon: '📅' }
  showAdd.value = false
}

// 实时监听回调
const handleIncomingAnniversary = (record, event) => {
  if (event === 'delete' || record._deleted) {
    anniversaryStore.anniversaries = anniversaryStore.anniversaries.filter(a => a.id !== record.id)
    return
  }
  const exists = anniversaryStore.anniversaries.some(a => a.id === record.id)
  if (exists) {
    anniversaryStore.anniversaries = anniversaryStore.anniversaries.map(a => a.id === record.id ? record : a)
  } else {
    anniversaryStore.anniversaries.push(record)
  }
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  loveDays.value = calcLoveDays(coupleStore.loveStartDate)
  
  // 注册实时监听
  if (cloudSync.isOnline && cloudSync.coupleId) {
    cloudSync.registerCallback('anniversaries', handleIncomingAnniversary)
  }
})

onUnmounted(() => {
  cloudSync.unregisterCallback('anniversaries')
})
</script>

<style lang="scss" scoped>
.anniversary-page { min-height: 100vh; background: var(--color-bg); padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.anni-header { background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); padding: 20rpx 30rpx; text-align: center;
  .header-title { font-size: var(--font-size-xl); color: #fff; font-weight: bold; }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 24rpx; margin: 0 30rpx 20rpx; }
.love-days-card { text-align: center; margin-top: 20rpx; padding: 40rpx;
  .days-label { font-size: var(--font-size-base); color: var(--color-text-secondary); display: block; }
  .days-number { font-size: 96rpx; font-weight: bold; background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: block; }
  .days-unit { font-size: var(--font-size-lg); color: var(--color-primary); display: block; }
  .days-date { font-size: var(--font-size-sm); color: var(--color-text-light); display: block; margin-top: 12rpx; }
}
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 0 30rpx; margin-bottom: 16rpx;
  .section-title { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); }
  .add-btn { font-size: var(--font-size-sm); color: var(--color-primary); }
}
.anni-card { margin: 0 30rpx 16rpx;
  .anni-header-row { display: flex; align-items: center; gap: 16rpx;
    .anni-icon { font-size: 40rpx; }
    .anni-info { flex: 1;
      .anni-title { font-size: var(--font-size-base); font-weight: bold; color: var(--color-text); display: block; }
      .anni-date { font-size: var(--font-size-sm); color: var(--color-text-light); display: block; }
    }
    .anni-countdown { text-align: right;
      .countdown-num { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-primary); }
      .passed { font-size: var(--font-size-sm); color: var(--color-text-light); }
    }
  }
  .anni-note { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; margin-top: 8rpx; }
}
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--color-mask); display: flex; align-items: center; justify-content: center; z-index: 500; }
.modal-content { width: 80%; padding: 40rpx;
  .modal-title { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 24rpx; text-align: center; }
  .modal-input { background: var(--color-bg); border-radius: var(--radius-input); padding: 20rpx; font-size: var(--font-size-base); margin-bottom: 16rpx; }
  .date-pick { color: var(--color-text-light); }
}
</style>
