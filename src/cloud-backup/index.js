/**
 * LeanCloud 初始化模块
 * 
 * 使用前需要在 LeanCloud 控制台创建应用，并填入以下配置：
 * https://console.leancloud.cn/apps
 * 
 * 需要开启的服务：
 * 1. 结构化数据（LeanStorage）- 数据存储
 * 2. 实时消息（LiveQuery）- 实时同步
 * 3. 匿名登录 - 免注册使用
 */
import AV from 'leancloud-storage'

// ============ 请填入你的 LeanCloud 配置 ============
const APP_ID = 'YOUR_APP_ID'
const APP_KEY = 'YOUR_APP_KEY'
const SERVER_URL = 'https://YOUR_DOMAIN.lc-cn-n1-shared.com' // 你的服务器地址
// ====================================================

let initialized = false

/**
 * 初始化 LeanCloud
 */
export const initLeanCloud = () => {
  if (initialized) return AV
  
  if (APP_ID === 'YOUR_APP_ID') {
    console.warn('[LeanCloud] 请先配置 APP_ID / APP_KEY / SERVER_URL')
    return null
  }

  AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
    serverURL: SERVER_URL
  })

  initialized = true
  console.log('[LeanCloud] 初始化成功')
  return AV
}

/**
 * 获取 AV 实例（确保已初始化）
 */
export const getAV = () => {
  // 如果未配置，直接返回 null
  if (!isLeanCloudConfigured()) {
    return null
  }
  
  if (!initialized) {
    initLeanCloud()
  }
  return AV
}

/**
 * 检查是否已配置 LeanCloud
 */
export const isLeanCloudConfigured = () => {
  return APP_ID !== 'YOUR_APP_ID'
}

/**
 * 检查网络连接状态
 */
export const checkNetwork = () => {
  return new Promise((resolve) => {
    if (!isLeanCloudConfigured()) {
      resolve(false)
      return
    }
    // 简单测试连接
    const TestObj = AV.Object.extend('TestConnection')
    const test = new TestObj()
    test.set('ping', Date.now())
    test.save()
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}

export default { initLeanCloud, getAV, isLeanCloudConfigured, checkNetwork }
