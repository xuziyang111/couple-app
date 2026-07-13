<template>
  <view class="finance-page">
    <view class="finance-header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="header-title">小账本</text>
    </view>
    <view class="summary-card card">
      <view class="summary-item">
        <text class="summary-label">本月支出</text>
        <text class="summary-amount">¥{{ monthlyTotal.toFixed(2) }}</text>
      </view>
      <view class="summary-item">
        <text class="summary-label">总支出</text>
        <text class="summary-amount total">¥{{ totalAmount.toFixed(2) }}</text>
      </view>
    </view>
    <view class="section-header">
      <text class="section-title">记账</text>
      <text class="add-btn" @click="showAdd = true">+ 记一笔</text>
    </view>
    <EmptyState v-if="records.length === 0" icon="💰" text="还没有记录" />
    <view v-for="record in records" :key="record.id" class="record-card card">
      <view class="record-header">
        <text class="record-category">{{ record.categoryIcon }} {{ record.category }}</text>
        <text class="record-amount">-¥{{ record.amount.toFixed(2) }}</text>
      </view>
      <view class="record-footer">
        <text class="record-note">{{ record.note }}</text>
        <text class="record-meta">{{ record.payer }} · {{ record.date }}</text>
      </view>
    </view>
    <view v-if="showAdd" class="modal-mask" @click="showAdd = false">
      <view class="modal-content card" @click.stop>
        <text class="modal-title">记一笔</text>
        <input class="modal-input" type="digit" v-model="newRecord.amount" placeholder="金额" />
        <view class="category-grid">
          <view v-for="cat in categories" :key="cat.id" class="cat-item" :class="{ active: newRecord.category === cat.name }" @click="newRecord.category = cat.name; newRecord.categoryIcon = cat.icon">
            <text>{{ cat.icon }}</text><text class="cat-name">{{ cat.name }}</text>
          </view>
        </view>
        <input class="modal-input" v-model="newRecord.note" placeholder="备注" />
        <input class="modal-input" v-model="newRecord.payer" placeholder="谁付的" />
        <picker mode="date" @change="onDateChange">
          <view class="modal-input date-pick">{{ newRecord.date || '选择日期' }}</view>
        </picker>
        <GradientButton text="保存" @click="addRecord" class="mt-lg" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '../../stores/finance'
import { generateId } from '../../utils/id'
import { createRecord, getAllRecords } from '../../db'
import EmptyState from '../../components/common/EmptyState.vue'
import GradientButton from '../../components/common/GradientButton.vue'

const financeStore = useFinanceStore()
const statusBarHeight = ref(44)
const showAdd = ref(false)
const records = ref([])
const categories = [
  { id: 1, name: '约会', icon: '💑' }, { id: 2, name: '餐饮', icon: '🍽️' },
  { id: 3, name: '礼物', icon: '🎁' }, { id: 4, name: '交通', icon: '🚗' },
  { id: 5, name: '购物', icon: '🛍️' }, { id: 6, name: '其他', icon: '📝' }
]
const newRecord = ref({ amount: '', category: '约会', categoryIcon: '💑', note: '', payer: '', date: new Date().toISOString().split('T')[0] })

const monthlyTotal = computed(() => {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return records.value.filter(r => r.date.startsWith(month)).reduce((s, r) => s + r.amount, 0)
})
const totalAmount = computed(() => records.value.reduce((s, r) => s + r.amount, 0))
const onDateChange = (e) => { newRecord.value.date = e.detail.value }
const addRecord = async () => {
  if (!newRecord.value.amount || parseFloat(newRecord.value.amount) <= 0) return
  const record = { id: generateId(), amount: parseFloat(newRecord.value.amount), category: newRecord.value.category, categoryIcon: newRecord.value.categoryIcon, note: newRecord.value.note, payer: newRecord.value.payer, date: newRecord.value.date, createdAt: new Date().toISOString() }
  await createRecord('finances', record)
  records.value.unshift(record)
  newRecord.value = { amount: '', category: '约会', categoryIcon: '💑', note: '', payer: '', date: new Date().toISOString().split('T')[0] }
  showAdd.value = false
}
onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  const data = await getAllRecords('finances')
  data.sort((a, b) => new Date(b.date) - new Date(a.date))
  records.value = data
})
</script>

<style lang="scss" scoped>
.finance-page { min-height: 100vh; background: var(--color-bg); padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.finance-header { background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end)); padding: 20rpx 30rpx; text-align: center;
  .header-title { font-size: var(--font-size-xl); color: #fff; font-weight: bold; }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 24rpx; margin: 0 30rpx 20rpx; }
.summary-card { display: flex; justify-content: space-around; margin-top: 20rpx;
  .summary-item { text-align: center;
    .summary-label { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; }
    .summary-amount { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-primary); display: block; margin-top: 8rpx;
      &.total { color: var(--color-text); }
    }
  }
}
.section-header { display: flex; justify-content: space-between; align-items: center; padding: 0 30rpx; margin-bottom: 16rpx;
  .section-title { font-size: var(--font-size-md); font-weight: bold; color: var(--color-text); }
  .add-btn { font-size: var(--font-size-sm); color: var(--color-primary); }
}
.record-card { margin: 0 30rpx 12rpx;
  .record-header { display: flex; justify-content: space-between; align-items: center;
    .record-category { font-size: var(--font-size-base); font-weight: 500; color: var(--color-text); }
    .record-amount { font-size: var(--font-size-md); font-weight: bold; color: var(--color-error); }
  }
  .record-footer { margin-top: 8rpx;
    .record-note { font-size: var(--font-size-sm); color: var(--color-text-secondary); display: block; }
    .record-meta { font-size: var(--font-size-xs); color: var(--color-text-light); display: block; margin-top: 4rpx; }
  }
}
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--color-mask); display: flex; align-items: center; justify-content: center; z-index: 500; }
.modal-content { width: 85%; padding: 40rpx; max-height: 80vh; overflow-y: auto;
  .modal-title { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 24rpx; text-align: center; }
  .modal-input { background: var(--color-bg); border-radius: var(--radius-input); padding: 20rpx; font-size: var(--font-size-base); margin-bottom: 16rpx; }
  .date-pick { color: var(--color-text-light); }
}
.category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12rpx; margin-bottom: 16rpx;
  .cat-item { display: flex; flex-direction: column; align-items: center; padding: 16rpx; border-radius: var(--radius-input); background: var(--color-bg);
    &.active { background: var(--color-primary); color: #fff; }
    .cat-name { font-size: var(--font-size-xs); margin-top: 4rpx; }
  }
}
</style>
