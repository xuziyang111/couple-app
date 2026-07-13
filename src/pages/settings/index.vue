<template>
  <view class="settings-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <text class="nav-title">我的</text>
      </view>
    </view>

    <scroll-view scroll-y class="scroll-area" :style="{ top: navHeight + 'px' }">
      <!-- 情侣信息卡片 -->
      <view class="couple-card">
        <view class="couple-avatars">
          <view class="avatar-wrap" @click="changeMyAvatar">
            <image v-if="myInfo.avatar" :src="myInfo.avatar" class="avatar-img" mode="aspectFill" />
            <view v-else class="avatar-placeholder">
              <text class="avatar-emoji">👤</text>
            </view>
            <text class="avatar-edit">编辑</text>
          </view>
          <view class="love-icon">
            <text class="heart-emoji">💕</text>
          </view>
          <view class="avatar-wrap">
            <image v-if="partnerInfo.avatar" :src="partnerInfo.avatar" class="avatar-img" mode="aspectFill" />
            <view v-else class="avatar-placeholder">
              <text class="avatar-emoji">👤</text>
            </view>
          </view>
        </view>
        <view class="couple-names">
          <view class="name-edit" @click="editNickname">
            <text class="name-text">{{ myInfo.nickname || '点击设置昵称' }}</text>
            <text class="edit-icon">✏️</text>
          </view>
          <text class="and-text">&</text>
          <text class="partner-name">{{ partnerInfo.nickname || 'TA' }}</text>
        </view>
        <view v-if="loveStartDate" class="love-days">
          <text class="days-text">在一起 {{ loveDays }} 天</text>
        </view>
      </view>

      <!-- 主题切换 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">🎨</text>
          <text class="section-title">主题风格</text>
        </view>
        <view class="theme-grid">
          <view
            v-for="theme in themes"
            :key="theme.key"
            class="theme-card"
            :class="{ active: currentTheme === theme.key }"
            @click="switchTheme(theme.key)"
          >
            <view class="theme-preview" :style="{ background: theme.bgColor }">
              <view class="theme-mock-card" :style="{ background: '#fff', borderRadius: theme.key === 'ins' ? '4px' : '12px' }">
                <view class="theme-mock-header" :style="{ background: theme.primaryColor, height: '20px', borderRadius: theme.key === 'ins' ? '4px 4px 0 0' : '12px 12px 0 0' }">
                  <view class="mock-dots">
                    <view class="mock-dot" :style="{ background: theme.primaryColor }"></view>
                    <view class="mock-dot" :style="{ background: theme.primaryColor, opacity: 0.6 }"></view>
                    <view class="mock-dot" :style="{ background: theme.primaryColor, opacity: 0.3 }"></view>
                  </view>
                </view>
                <view class="theme-mock-body">
                  <view class="mock-line" :style="{ background: theme.primaryColor, opacity: 0.3, width: '60%' }"></view>
                  <view class="mock-line" :style="{ background: theme.primaryColor, opacity: 0.15, width: '80%' }"></view>
                  <view class="mock-btn" :style="{ background: theme.primaryColor, borderRadius: theme.key === 'ins' ? '4px' : '20px' }"></view>
                </view>
              </view>
            </view>
            <view class="theme-info">
              <text class="theme-name">{{ theme.name }}</text>
              <view v-if="currentTheme === theme.key" class="theme-check">
                <text class="check-icon">✓</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 通用设置 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">⚙️</text>
          <text class="section-title">通用设置</text>
        </view>
        <view class="setting-list">
          <view class="setting-item" @click="toggleSound">
            <text class="setting-label">消息提示音</text>
            <view class="setting-value">
              <view class="toggle-switch" :class="{ on: settingsStore.soundEnabled }">
                <view class="toggle-dot"></view>
              </view>
            </view>
          </view>
          <view class="setting-item" @click="togglePrivacyLock">
            <text class="setting-label">隐私锁</text>
            <view class="setting-value">
              <view class="toggle-switch" :class="{ on: settingsStore.privacyLock }">
                <view class="toggle-dot"></view>
              </view>
            </view>
          </view>
          <view class="setting-item" @click="showQualityPicker">
            <text class="setting-label">图片质量</text>
            <view class="setting-value">
              <text class="value-text">{{ qualityLabel }}</text>
              <text class="arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 数据管理 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">📦</text>
          <text class="section-title">数据管理</text>
        </view>
        <view class="setting-list">
          <!-- 云端同步状态 -->
          <view class="setting-item" v-if="isConfigured()">
            <text class="setting-label">云端同步</text>
            <view class="setting-value">
              <view class="sync-status" :class="syncStatus">
                <view class="sync-dot"></view>
                <text class="sync-text">{{ syncStatusLabel }}</text>
              </view>
            </view>
          </view>
          <view class="setting-item" v-if="isConfigured()" @click="handleManualSync">
            <text class="setting-label">立即同步</text>
            <view class="setting-value">
              <text class="value-text">{{ syncing ? '同步中...' : '手动拉取最新数据' }}</text>
            </view>
          </view>
          <view class="setting-item" @click="handleExport">
            <text class="setting-label">导出数据</text>
            <view class="setting-value">
              <text class="value-text">加密备份</text>
              <text class="arrow">›</text>
            </view>
          </view>
          <view class="setting-item" @click="handleImport">
            <text class="setting-label">导入数据</text>
            <view class="setting-value">
              <text class="value-text">从文件恢复</text>
              <text class="arrow">›</text>
            </view>
          </view>
          <view class="setting-item" v-if="lastSyncTime">
            <text class="setting-label">上次同步</text>
            <view class="setting-value">
              <text class="value-text">{{ syncTimeLabel }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 关于我们 -->
      <view class="section">
        <view class="section-header">
          <text class="section-icon">💝</text>
          <text class="section-title">关于我们</text>
        </view>
        <view class="setting-list">
          <view class="setting-item">
            <text class="setting-label">情侣ID</text>
            <view class="setting-value">
              <text class="value-text">{{ coupleStore.coupleId || '未绑定' }}</text>
            </view>
          </view>
          <view class="setting-item">
            <text class="setting-label">版本</text>
            <view class="setting-value">
              <text class="value-text">v1.0.0</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 危险操作 -->
      <view class="section danger-section">
        <view class="danger-btn" @click="handleClearData">
          <text class="danger-text">清空所有数据</text>
        </view>
        <view class="danger-btn" @click="handleUnbind">
          <text class="danger-text">解除情侣绑定</text>
        </view>
      </view>

      <view class="footer">
        <text class="footer-text">用心记录每一刻 💕</text>
      </view>
    </scroll-view>

    <!-- 昵称编辑弹窗 -->
    <view v-if="showNicknameModal" class="modal-mask" @click="showNicknameModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">修改昵称</text>
        <input
          v-model="newNickname"
          class="modal-input"
          placeholder="输入新昵称"
          maxlength="12"
          :focus="showNicknameModal"
        />
        <view class="modal-btns">
          <view class="modal-btn cancel" @click="showNicknameModal = false">
            <text class="btn-text">取消</text>
          </view>
          <view class="modal-btn confirm" @click="saveNickname">
            <text class="btn-text">保存</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导出密码弹窗 -->
    <view v-if="showPasswordModal" class="modal-mask" @click="showPasswordModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">设置加密密码</text>
        <text class="modal-desc">请输入密码用于加密数据包</text>
        <input
          v-model="exportPassword"
          class="modal-input"
          placeholder="输入密码（至少4位）"
          type="password"
          :focus="showPasswordModal"
        />
        <view class="modal-btns">
          <view class="modal-btn cancel" @click="showPasswordModal = false">
            <text class="btn-text">取消</text>
          </view>
          <view class="modal-btn confirm" @click="confirmExport">
            <text class="btn-text">导出</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 图片质量选择弹窗 -->
    <view v-if="showQualityModal" class="modal-mask" @click="showQualityModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">图片质量</text>
        <view class="quality-options">
          <view
            v-for="q in qualityOptions"
            :key="q.value"
            class="quality-item"
            :class="{ active: settingsStore.imageQuality === q.value }"
            @click="selectQuality(q.value)"
          >
            <text class="quality-name">{{ q.label }}</text>
            <text v-if="settingsStore.imageQuality === q.value" class="quality-check">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 导入密码弹窗 -->
    <view v-if="showImportModal" class="modal-mask" @click="showImportModal = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">输入解密密码</text>
        <text class="modal-desc">请输入数据导出时设置的密码</text>
        <input
          v-model="importPassword"
          class="modal-input"
          placeholder="输入密码"
          type="password"
          :focus="showImportModal"
        />
        <view class="modal-btns">
          <view class="modal-btn cancel" @click="showImportModal = false">
            <text class="btn-text">取消</text>
          </view>
          <view class="modal-btn confirm" @click="confirmImport">
            <text class="btn-text">导入</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCoupleStore } from '../../stores/couple'
import { useSettingsStore } from '../../stores/settings'
import { useTheme } from '../../composables/useTheme'
import { useExportImport } from '../../composables/useExportImport'
import { useDateCalc } from '../../composables/useDateCalc'
import { useCloudSync } from '../../composables/useCloudSync'
import { clearAllData } from '../../db'

const coupleStore = useCoupleStore()
const settingsStore = useSettingsStore()
const { applyTheme, getAllThemes, currentTheme } = useTheme()
const { exportData, importData, exporting, importing } = useExportImport()
const { calcLoveDays } = useDateCalc()
const { syncStatus, isOnline, lastSyncTime: cloudLastSync, doFullSync, clearCoupleCloud, isConfigured } = useCloudSync()
const syncing = ref(false)

// 系统信息
const statusBarHeight = ref(20)
const navHeight = ref(64)

// 数据
const themes = ref(getAllThemes())
const myInfo = computed(() => coupleStore.myInfo)
const partnerInfo = computed(() => coupleStore.partnerInfo)
const loveStartDate = computed(() => coupleStore.loveStartDate)
const loveDays = computed(() => loveStartDate.value ? calcLoveDays(loveStartDate.value) : 0)
const lastSyncTime = ref(uni.getStorageSync('last_sync_time') || '')

// 弹窗状态
const showNicknameModal = ref(false)
const showPasswordModal = ref(false)
const showQualityModal = ref(false)
const showImportModal = ref(false)
const newNickname = ref('')
const exportPassword = ref('')
const importPassword = ref('')
const importFilePath = ref('')

// 图片质量选项
const qualityOptions = [
  { label: '高质量（原图压缩）', value: 'high' },
  { label: '中等质量（推荐）', value: 'medium' },
  { label: '低质量（省空间）', value: 'low' }
]

const qualityLabel = computed(() => {
  const map = { high: '高质量', medium: '中等', low: '低质量' }
  return map[settingsStore.imageQuality] || '中等'
})

// 同步状态标签
const syncStatusLabel = computed(() => {
  const map = {
    idle: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    syncing: '同步中...',
    disconnected: '已断开',
    error: '连接失败'
  }
  return map[syncStatus.value] || '未知'
})

const syncTimeLabel = computed(() => {
  if (!lastSyncTime.value) return ''
  const d = new Date(lastSyncTime.value)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
})

onMounted(() => {
  try {
    const sysInfo = uni.getSystemInfoSync()
    statusBarHeight.value = sysInfo.statusBarHeight || 20
    navHeight.value = statusBarHeight.value + 44
  } catch (e) {}
})

// 修改昵称
const editNickname = () => {
  newNickname.value = myInfo.value.nickname || ''
  showNicknameModal.value = true
}

const saveNickname = () => {
  const name = newNickname.value.trim()
  if (!name) {
    uni.showToast({ title: '昵称不能为空', icon: 'none' })
    return
  }
  coupleStore.updateMyInfo({ nickname: name })
  showNicknameModal.value = false
  uni.showToast({ title: '已更新', icon: 'success' })
}

// 修改头像
const changeMyAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempPath = res.tempFilePaths[0]
      coupleStore.updateMyInfo({ avatar: tempPath })
      uni.showToast({ title: '头像已更新', icon: 'success' })
    }
  })
}

// 主题切换
const switchTheme = (themeKey) => {
  applyTheme(themeKey)
  settingsStore.setTheme(themeKey)
  uni.showToast({ title: '主题已切换', icon: 'success' })
}

// 通用设置
const toggleSound = () => {
  settingsStore.toggleSound()
}

const togglePrivacyLock = () => {
  settingsStore.togglePrivacyLock()
}

const showQualityPicker = () => {
  showQualityModal.value = true
}

const selectQuality = (value) => {
  settingsStore.setImageQuality(value)
  showQualityModal.value = false
}

// 手动同步
const handleManualSync = async () => {
  if (syncing.value) return
  syncing.value = true
  try {
    const result = await doFullSync()
    if (result) {
      uni.showToast({ title: `同步完成 ↑${result.uploaded} ↓${result.downloaded}`, icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '同步失败', icon: 'none' })
  }
  syncing.value = false
}

// 数据导出
const handleExport = () => {
  exportPassword.value = ''
  showPasswordModal.value = true
}

const confirmExport = async () => {
  if (exportPassword.value.length < 4) {
    uni.showToast({ title: '密码至少4位', icon: 'none' })
    return
  }
  showPasswordModal.value = false
  uni.showLoading({ title: '正在导出...' })
  const success = await exportData(exportPassword.value)
  uni.hideLoading()
  if (success) {
    lastSyncTime.value = uni.getStorageSync('last_sync_time')
    uni.showToast({ title: '导出成功', icon: 'success' })
  }
}

// 数据导入
const handleImport = () => {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.couple'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      importFilePath.value = URL.createObjectURL(file)
      importPassword.value = ''
      showImportModal.value = true
    }
  }
  input.click()
  // #endif

  // #ifdef APP-PLUS
  uni.chooseFile({
    success: (res) => {
      importFilePath.value = res.tempFilePaths[0]
      importPassword.value = ''
      showImportModal.value = true
    }
  })
  // #endif
}

const confirmImport = async () => {
  if (!importPassword.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }
  showImportModal.value = false
  uni.showLoading({ title: '正在导入...' })
  const success = await importData(importFilePath.value, importPassword.value)
  uni.hideLoading()
  if (success) {
    lastSyncTime.value = uni.getStorageSync('last_sync_time')
  }
}

// 清空数据
const handleClearData = () => {
  uni.showModal({
    title: '确认清空',
    content: '将清空所有聊天记录、日记、相册等数据，此操作不可恢复！',
    confirmColor: '#FF4D6D',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '清空中...' })
        await clearAllData()
        // 清空localStorage（保留情侣信息和设置）
        const keys = ['couple_info', 'app_settings']
        const preserved = {}
        keys.forEach(k => {
          const v = uni.getStorageSync(k)
          if (v) preserved[k] = v
        })
        uni.clearStorageSync()
        keys.forEach(k => {
          if (preserved[k]) uni.setStorageSync(k, preserved[k])
        })
        uni.hideLoading()
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

// 解绑
const handleUnbind = () => {
  uni.showModal({
    title: '解除绑定',
    content: '解除后双方将无法再同步数据，确定要解除情侣绑定吗？',
    confirmColor: '#FF4D6D',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '解绑中...' })
        // 清除云端数据
        if (isConfigured()) {
          await clearCoupleCloud()
        }
        await clearAllData()
        uni.clearStorageSync()
        coupleStore.unbind()
        uni.hideLoading()
        uni.showToast({ title: '已解绑', icon: 'success' })
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/bind/index' })
        }, 1500)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.settings-page {
  min-height: 100vh;
  background: var(--color-bg);
}

.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--color-card);
  box-shadow: var(--shadow-card);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

.scroll-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-overflow-scrolling: touch;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 情侣信息卡片 */
.couple-card {
  margin: 16px;
  padding: 24px;
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  text-align: center;
}

.couple-avatars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}

.avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
}

.avatar-img {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 3px solid var(--color-primary);
}

.avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--color-border);
}

.avatar-emoji {
  font-size: 28px;
}

.avatar-edit {
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--color-primary);
  background: var(--color-card);
  padding: 1px 8px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
}

.love-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.heart-emoji {
  font-size: 24px;
}

.couple-names {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.name-edit {
  display: flex;
  align-items: center;
  gap: 4px;
}

.name-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.edit-icon {
  font-size: 12px;
}

.and-text {
  font-size: 14px;
  color: var(--color-primary);
  font-weight: 500;
}

.partner-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.love-days {
  margin-top: 4px;
}

.days-text {
  font-size: 13px;
  color: var(--color-primary);
  font-weight: 500;
}

/* 分区 */
.section {
  margin: 12px 16px;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 8px 0;
  gap: 6px;
}

.section-icon {
  font-size: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

/* 主题网格 */
.theme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.theme-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  border: 2px solid transparent;
  transition: all 0.3s;

  &.active {
    border-color: var(--color-primary);
  }
}

.theme-preview {
  height: 100px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-mock-card {
  width: 80%;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.theme-mock-body {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

.mock-line {
  height: 4px;
  border-radius: 2px;
}

.mock-btn {
  width: 30px;
  height: 10px;
  margin-top: 4px;
}

.mock-dots {
  display: flex;
  gap: 3px;
  padding: 5px 6px;
}

.mock-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255,255,255,0.6);
}

.theme-info {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.theme-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text);
}

.theme-check {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  font-size: 10px;
  color: #fff;
}

/* 设置列表 */
.setting-list {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-divider);

  &:last-child {
    border-bottom: none;
  }
}

.setting-label {
  font-size: 14px;
  color: var(--color-text);
}

.setting-value {
  display: flex;
  align-items: center;
  gap: 4px;
}

.value-text {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.arrow {
  font-size: 16px;
  color: var(--color-text-light);
}

/* 开关 */
.toggle-switch {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-border);
  position: relative;
  transition: all 0.3s;
  cursor: pointer;

  &.on {
    background: var(--color-primary);
  }
}

.toggle-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);

  .on & {
    left: 22px;
  }
}

/* 危险操作 */
.danger-section {
  margin-top: 24px;
  margin-bottom: 16px;
}

.danger-btn {
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: 14px;
  text-align: center;
  margin-bottom: 8px;
  box-shadow: var(--shadow-card);
}

.danger-text {
  font-size: 14px;
  color: var(--color-error);
  font-weight: 500;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-mask);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  width: 80%;
  max-width: 320px;
  background: var(--color-card);
  border-radius: var(--radius-card);
  padding: 24px;
  box-shadow: var(--shadow-float);
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  display: block;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
  display: block;
  margin-bottom: 16px;
}

.modal-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-input);
  padding: 0 12px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-bg);
  margin-bottom: 16px;
  box-sizing: border-box;
}

.modal-btns {
  display: flex;
  gap: 12px;
}

.modal-btn {
  flex: 1;
  height: 40px;
  border-radius: var(--radius-button);
  display: flex;
  align-items: center;
  justify-content: center;

  &.cancel {
    background: var(--color-bg-secondary);
  }

  &.confirm {
    background: linear-gradient(135deg, var(--color-gradient-start), var(--color-gradient-end));
  }
}

.btn-text {
  font-size: 14px;
  font-weight: 500;

  .cancel & {
    color: var(--color-text-secondary);
  }

  .confirm & {
    color: #fff;
  }
}

/* 图片质量选项 */
.quality-options {
  margin-top: 12px;
}

.quality-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-divider);

  &:last-child {
    border-bottom: none;
  }

  &.active {
    .quality-name {
      color: var(--color-primary);
      font-weight: 600;
    }
  }
}

.quality-name {
  font-size: 14px;
  color: var(--color-text);
}

.quality-check {
  font-size: 16px;
  color: var(--color-primary);
  font-weight: 600;
}

/* 同步状态 */
.sync-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-light);
  
  .connected & { background: var(--color-success); }
  .syncing & { background: var(--color-warning); animation: heartbeat 1s infinite; }
  .disconnected & { background: var(--color-text-light); }
  .error & { background: var(--color-error); }
  .connecting & { background: var(--color-info); animation: heartbeat 0.5s infinite; }
}

.sync-text {
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* 底部 */
.footer {
  text-align: center;
  padding: 24px 0 calc(40px + constant(safe-area-inset-bottom));
  padding: 24px 0 calc(40px + env(safe-area-inset-bottom));
}

.footer-text {
  font-size: 12px;
  color: var(--color-text-light);
}
</style>
