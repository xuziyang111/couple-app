<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useSettingsStore } from './stores/settings'
import { useCoupleStore } from './stores/couple'
import { useTheme } from './composables/useTheme'
import { useCloudSync } from './composables/useCloudSync'

const settingsStore = useSettingsStore()
const coupleStore = useCoupleStore()
const { applyTheme } = useTheme()
const { initCloud } = useCloudSync()

// 启动时应用保存的主题
applyTheme(settingsStore.currentTheme)

// 初始化云端连接（如果已配置 LeanCloud）
initCloud()

// 监听主题变化
uni.$on('theme-change', (theme) => {
  applyTheme(theme)
})

// 启动时检查是否已绑定情侣
onLaunch(() => {
  console.log('[App] Launch')
  // 从 localStorage 恢复数据后，检查是否已绑定
  setTimeout(() => {
    if (!coupleStore.isPaired || !coupleStore.coupleInfo) {
      console.log('[App] 未绑定，跳转到绑定页面')
      uni.reLaunch({ url: '/pages/bind/index' })
    }
  }, 100)
})

onShow(() => {
  console.log('[App] Show')
})

onHide(() => {
  console.log('[App] Hide')
})
</script>

<style lang="scss">
@import './styles/animation.scss';
</style>
