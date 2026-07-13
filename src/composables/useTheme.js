import { ref } from 'vue'

// 主题配置
const themeConfigs = {
  sweet: {
    name: '甜蜜可爱',
    desc: '粉色系、圆润、甜美',
    primaryColor: '#FF6B81',
    bgColor: '#FFF0F3',
    vars: {
      '--color-primary': '#FF6B81',
      '--color-primary-light': '#FF8FA2',
      '--color-primary-dark': '#FF4D6D',
      '--color-secondary': '#FFB6C1',
      '--color-bg': '#FFF0F3',
      '--color-bg-secondary': '#FFE4E9',
      '--color-card': '#FFFFFF',
      '--color-text': '#4A3035',
      '--color-text-secondary': '#8B6B72',
      '--color-text-light': '#C0A0A8',
      '--color-text-placeholder': '#D4B8BF',
      '--color-accent': '#FF4D6D',
      '--color-success': '#7DD3A8',
      '--color-warning': '#FFD166',
      '--color-error': '#FF6B6B',
      '--color-info': '#74B9FF',
      '--color-gradient-start': '#FF6B81',
      '--color-gradient-end': '#FF8FA2',
      '--color-border': '#FFE0E6',
      '--color-divider': '#FFF0F3',
      '--color-mask': 'rgba(74, 48, 53, 0.5)',
      '--color-tabbar': '#FFFFFF',
      '--color-tabbar-active': '#FF6B81',
      '--color-tabbar-inactive': '#C0A0A8',
      '--shadow-card': '0 4rpx 20rpx rgba(255, 107, 129, 0.12)',
      '--shadow-button': '0 4rpx 12rpx rgba(255, 107, 129, 0.3)',
      '--shadow-float': '0 8rpx 30rpx rgba(255, 107, 129, 0.18)',
      '--radius-card': '24rpx',
      '--radius-button': '40rpx',
      '--radius-input': '16rpx',
      '--radius-tag': '20rpx',
      '--radius-image': '16rpx',
      '--font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }
  },
  ins: {
    name: '极简ins',
    desc: '低饱和、留白、高级感',
    primaryColor: '#8B7E74',
    bgColor: '#FAF8F5',
    vars: {
      '--color-primary': '#8B7E74',
      '--color-primary-light': '#A89B91',
      '--color-primary-dark': '#6E6359',
      '--color-secondary': '#C4B8AD',
      '--color-bg': '#FAF8F5',
      '--color-bg-secondary': '#F3EFE9',
      '--color-card': '#FFFFFF',
      '--color-text': '#3D3630',
      '--color-text-secondary': '#7A7068',
      '--color-text-light': '#B0A89F',
      '--color-text-placeholder': '#D1CBC4',
      '--color-accent': '#6E6359',
      '--color-success': '#8FAE8B',
      '--color-warning': '#D4B87A',
      '--color-error': '#C97B7B',
      '--color-info': '#7B9EC9',
      '--color-gradient-start': '#8B7E74',
      '--color-gradient-end': '#A89B91',
      '--color-border': '#E8E2DB',
      '--color-divider': '#F3EFE9',
      '--color-mask': 'rgba(61, 54, 48, 0.45)',
      '--color-tabbar': '#FFFFFF',
      '--color-tabbar-active': '#8B7E74',
      '--color-tabbar-inactive': '#B0A89F',
      '--shadow-card': '0 2rpx 12rpx rgba(61, 54, 48, 0.06)',
      '--shadow-button': '0 2rpx 8rpx rgba(61, 54, 48, 0.1)',
      '--shadow-float': '0 6rpx 20rpx rgba(61, 54, 48, 0.1)',
      '--radius-card': '8rpx',
      '--radius-button': '8rpx',
      '--radius-input': '6rpx',
      '--radius-tag': '4rpx',
      '--radius-image': '6rpx',
      '--font-family': "'Georgia', 'Noto Serif SC', serif"
    }
  },
  cream: {
    name: '温柔奶油',
    desc: '暖黄奶油、柔软、包裹感',
    primaryColor: '#D4A574',
    bgColor: '#FFF8EE',
    vars: {
      '--color-primary': '#D4A574',
      '--color-primary-light': '#E0BE95',
      '--color-primary-dark': '#C08B5C',
      '--color-secondary': '#F0D9BE',
      '--color-bg': '#FFF8EE',
      '--color-bg-secondary': '#FFF0DE',
      '--color-card': '#FFFFFF',
      '--color-text': '#5C4832',
      '--color-text-secondary': '#9B8570',
      '--color-text-light': '#C8B8A5',
      '--color-text-placeholder': '#DDD0C0',
      '--color-accent': '#C08B5C',
      '--color-success': '#9BC49B',
      '--color-warning': '#F0C97A',
      '--color-error': '#E88B7B',
      '--color-info': '#7BB8D4',
      '--color-gradient-start': '#D4A574',
      '--color-gradient-end': '#E0BE95',
      '--color-border': '#F0E0CC',
      '--color-divider': '#FFF0DE',
      '--color-mask': 'rgba(92, 72, 50, 0.45)',
      '--color-tabbar': '#FFFFFF',
      '--color-tabbar-active': '#D4A574',
      '--color-tabbar-inactive': '#C8B8A5',
      '--shadow-card': '0 4rpx 16rpx rgba(212, 165, 116, 0.1)',
      '--shadow-button': '0 4rpx 12rpx rgba(212, 165, 116, 0.25)',
      '--shadow-float': '0 8rpx 28rpx rgba(212, 165, 116, 0.15)',
      '--radius-card': '16rpx',
      '--radius-button': '32rpx',
      '--radius-input': '12rpx',
      '--radius-tag': '16rpx',
      '--radius-image': '12rpx',
      '--font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }
  },
  wood: {
    name: '清新原木',
    desc: '自然木质、素雅、清爽',
    primaryColor: '#7BA17D',
    bgColor: '#F5F0E8',
    vars: {
      '--color-primary': '#7BA17D',
      '--color-primary-light': '#96B898',
      '--color-primary-dark': '#5E8760',
      '--color-secondary': '#B8D4B9',
      '--color-bg': '#F5F0E8',
      '--color-bg-secondary': '#EDE6DA',
      '--color-card': '#FFFDF8',
      '--color-text': '#3E4A3C',
      '--color-text-secondary': '#7A8578',
      '--color-text-light': '#B0BAA8',
      '--color-text-placeholder': '#CDD5C8',
      '--color-accent': '#5E8760',
      '--color-success': '#7BA17D',
      '--color-warning': '#D4B87A',
      '--color-error': '#C97B7B',
      '--color-info': '#7B9EC9',
      '--color-gradient-start': '#7BA17D',
      '--color-gradient-end': '#96B898',
      '--color-border': '#DDD8CC',
      '--color-divider': '#EDE6DA',
      '--color-mask': 'rgba(62, 74, 60, 0.45)',
      '--color-tabbar': '#FFFDF8',
      '--color-tabbar-active': '#7BA17D',
      '--color-tabbar-inactive': '#B0BAA8',
      '--shadow-card': '0 2rpx 12rpx rgba(62, 74, 60, 0.08)',
      '--shadow-button': '0 3rpx 10rpx rgba(123, 161, 125, 0.2)',
      '--shadow-float': '0 6rpx 24rpx rgba(123, 161, 125, 0.12)',
      '--radius-card': '12rpx',
      '--radius-button': '24rpx',
      '--radius-input': '10rpx',
      '--radius-tag': '12rpx',
      '--radius-image': '10rpx',
      '--font-family': "-apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Microsoft YaHei', sans-serif"
    }
  }
}

// 当前主题（全局响应式）
const currentTheme = ref('sweet')

export function useTheme() {
  const applyTheme = (themeName) => {
    const config = themeConfigs[themeName]
    if (!config) return

    // 在 H5 端直接操作 DOM
    // #ifdef H5
    const root = document.documentElement
    Object.entries(config.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
    // #endif

    // 在 APP 端使用 uni.setPageStyle 或全局 class
    // #ifdef APP-PLUS
    // APP端通过页面style注入
    const pages = getCurrentPages()
    const page = pages[pages.length - 1]
    if (page && page.$page) {
      const pageStyle = Object.entries(config.vars)
        .map(([k, v]) => `${k}:${v}`)
        .join(';')
      // 通过全局class方式
    }
    // #endif

    currentTheme.value = themeName
  }

  const getThemeConfig = (themeName) => {
    return themeConfigs[themeName || currentTheme.value]
  }

  const getAllThemes = () => {
    return Object.entries(themeConfigs).map(([key, config]) => ({
      key,
      name: config.name,
      desc: config.desc,
      primaryColor: config.primaryColor,
      bgColor: config.bgColor
    }))
  }

  return {
    currentTheme,
    applyTheme,
    getThemeConfig,
    getAllThemes,
    themeConfigs
  }
}
