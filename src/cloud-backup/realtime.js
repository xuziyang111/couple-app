/**
 * LiveQuery 实时订阅模块
 * 
 * 监听云端数据变化，实时推送到本地
 * 当一方写入数据时，另一方能秒级收到更新
 * 
 * 使用方式：
 * 1. startWatching(coupleId, callbacks) - 开始监听所有数据类型
 * 2. stopWatching() - 停止所有监听
 * 3. 通过回调函数处理新增/更新/删除事件
 */
import { getAV, isLeanCloudConfigured } from './index'
import { getCurrentUser } from './auth'

// 当前活跃的订阅
let subscriptions = []
let liveQueryClient = null
let isWatching = false

// 云端 class 名称列表
const WATCH_CLASSES = [
  'CoupleMessage',
  'CoupleDiary',
  'CouplePhoto',
  'CoupleCheckin',
  'CoupleWish',
  'CoupleAnniversary',
  'CoupleFinance',
  'CoupleQuizRecord'
]

// class → store 映射
const CLASS_STORE_MAP = {
  CoupleMessage: 'messages',
  CoupleDiary: 'diaries',
  CouplePhoto: 'photos',
  CoupleMediaBlob: 'mediaBlobs',
  CoupleCheckin: 'checkins',
  CoupleWish: 'wishes',
  CoupleAnniversary: 'anniversaries',
  CoupleFinance: 'finances',
  CoupleQuizRecord: 'quizRecords'
}

/**
 * 开始监听情侣数据变化
 * @param {string} coupleId - 情侣ID
 * @param {object} callbacks - 回调函数
 *   - onData(storeName, record, event) - 收到数据更新
 *   - onDelete(storeName, recordId) - 收到删除通知
 *   - onError(error) - 错误回调
 */
export const startWatching = async (coupleId, callbacks = {}) => {
  if (!isLeanCloudConfigured()) {
    console.warn('[Realtime] LeanCloud 未配置，无法启动实时监听')
    return
  }

  const AV = getAV()
  const user = getCurrentUser()
  if (!user) {
    console.warn('[Realtime] 未登录，无法启动实时监听')
    return
  }

  // 先停止之前的监听
  stopWatching()

  try {
    // 订阅 LiveQuery
    liveQueryClient = await AV.LiveQuery.init()
    
    for (const className of WATCH_CLASSES) {
      try {
        const query = new AV.Query(className)
        query.equalTo('coupleId', coupleId)
        
        const subscription = await liveQueryClient.subscribe(query)
        
        // 监听创建事件
        subscription.on('create', (obj) => {
          const storeName = CLASS_STORE_MAP[className]
          const record = _parseRecord(obj)
          if (record && callbacks.onData) {
            callbacks.onData(storeName, record, 'create')
          }
        })

        // 监听更新事件
        subscription.on('update', (obj) => {
          const storeName = CLASS_STORE_MAP[className]
          const record = _parseRecord(obj)
          if (record && callbacks.onData) {
            callbacks.onData(storeName, record, 'update')
          }
        })

        // 监听删除事件
        subscription.on('delete', (obj) => {
          const storeName = CLASS_STORE_MAP[className]
          const recordId = obj.get('recordId')
          if (recordId && callbacks.onDelete) {
            callbacks.onDelete(storeName, recordId)
          }
        })

        // 监听进入事件（新数据符合查询条件时）
        subscription.on('enter', (obj) => {
          const storeName = CLASS_STORE_MAP[className]
          const record = _parseRecord(obj)
          if (record && callbacks.onData) {
            callbacks.onData(storeName, record, 'enter')
          }
        })

        subscriptions.push(subscription)
        console.log(`[Realtime] 已订阅: ${className}`)
      } catch (e) {
        console.warn(`[Realtime] 订阅 ${className} 失败:`, e)
      }
    }

    // 监听连接状态
    if (liveQueryClient.on) {
      liveQueryClient.on('login', () => {
        console.log('[Realtime] LiveQuery 已连接')
        if (callbacks.onStatusChange) callbacks.onStatusChange('connected')
      })

      liveQueryClient.on('disconnect', () => {
        console.log('[Realtime] LiveQuery 断开连接')
        if (callbacks.onStatusChange) callbacks.onStatusChange('disconnected')
      })

      liveQueryClient.on('reconnect', () => {
        console.log('[Realtime] LiveQuery 重新连接')
        if (callbacks.onStatusChange) callbacks.onStatusChange('connected')
      })
    }

    isWatching = true
    console.log('[Realtime] 实时监听已启动')
    if (callbacks.onStatusChange) callbacks.onStatusChange('connected')
  } catch (e) {
    console.error('[Realtime] 启动监听失败:', e)
    if (callbacks.onError) callbacks.onError(e)
  }
}

/**
 * 停止所有监听
 */
export const stopWatching = () => {
  for (const sub of subscriptions) {
    try {
      sub.unsubscribe()
    } catch (e) {
      // ignore
    }
  }
  subscriptions = []
  
  if (liveQueryClient) {
    try {
      liveQueryClient.close()
    } catch (e) {
      // ignore
    }
    liveQueryClient = null
  }
  
  isWatching = false
  console.log('[Realtime] 已停止所有监听')
}

/**
 * 获取监听状态
 */
export const getWatchingStatus = () => {
  return {
    isWatching,
    subscriptionCount: subscriptions.length
  }
}

/**
 * 手动触发一次数据拉取（用于 LiveQuery 不可用时降级）
 */
export const pullOnce = async (coupleId, callbacks = {}) => {
  if (!isLeanCloudConfigured()) return
  
  const AV = getAV()
  
  for (const className of WATCH_CLASSES) {
    try {
      const query = new AV.Query(className)
      query.equalTo('coupleId', coupleId)
      query.limit(100)
      query.descending('updatedAt')
      const results = await query.find()
      
      const storeName = CLASS_STORE_MAP[className]
      for (const obj of results) {
        const record = _parseRecord(obj)
        if (record && callbacks.onData) {
          callbacks.onData(storeName, record, 'pull')
        }
      }
    } catch (e) {
      console.warn(`[Realtime] 拉取 ${className} 失败:`, e)
    }
  }
}

// ========== 内部辅助 ==========

function _parseRecord(cloudObj) {
  try {
    const dataStr = cloudObj.get('data')
    if (dataStr) {
      return JSON.parse(dataStr)
    }
  } catch (e) {
    console.error('[Realtime] 解析记录失败:', e)
  }
  return null
}

export default {
  startWatching,
  stopWatching,
  getWatchingStatus,
  pullOnce
}
