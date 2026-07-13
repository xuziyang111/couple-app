/**
 * useCloudSync - 云端同步组合函数（Supabase）
 * 
 * 提供响应式的同步状态和便捷的同步方法
 * 在 App.vue 中初始化，在页面中按需使用
 * 
 * 使用方式：
 * const { initCloud, syncStatus, pushData, isOnline } = useCloudSync()
 */
import { ref, computed } from 'vue'
import { isSupabaseConfigured, initSupabase } from '../supabase/index'
import * as auth from '../supabase/auth'
import * as sync from '../supabase/sync'
import * as realtime from '../supabase/realtime'
import { db } from '../db'

// 全局状态
const syncStatus = ref('idle') // idle | connecting | connected | syncing | disconnected | error
const isOnline = ref(false)
const lastSyncTime = ref(null)
const pendingCount = ref(0)
const coupleId = ref(null)

// 回调注册表（供 store 注册数据更新回调）
const dataCallbacks = new Map()

export function useCloudSync() {
  
  /**
   * 初始化云端连接
   * 在 App.vue 启动时调用
   */
  const initCloud = async () => {
    if (!isSupabaseConfigured()) {
      console.log('[CloudSync] Supabase 未配置，使用纯本地模式')
      syncStatus.value = 'idle'
      return false
    }

    try {
      console.log('[CloudSync] 开始初始化...')
      syncStatus.value = 'connecting'
      
      // 1. 初始化 SDK
      initSupabase()
      console.log('[CloudSync] Supabase SDK 已初始化')
      
      // 2. 登录
      let user
      try {
        user = await auth.login()
      } catch (loginErr) {
        console.error('[CloudSync] 登录异常:', loginErr.message || loginErr)
        // 如果是匿名登录失败，很可能是 Supabase 未开启匿名登录
        if (loginErr.message && (loginErr.message.includes('anonymous') || loginErr.message.includes('Anonymous'))) {
          console.error('[CloudSync] ❗ 请在 Supabase 控制台 → Authentication → Providers 中开启 Anonymous 登录')
        }
        syncStatus.value = 'error'
        isOnline.value = false
        return false
      }
      
      if (!user) {
        console.error('[CloudSync] 登录返回空用户')
        syncStatus.value = 'error'
        isOnline.value = false
        return false
      }
      console.log('[CloudSync] 用户登录成功:', user.id)

      isOnline.value = true
      console.log('[CloudSync] ✅ 云端连接成功')

      // 3. 检查是否已有情侣绑定
      const savedCoupleId = uni.getStorageSync('couple_id_cloud')
      console.log('[CloudSync] 保存的 coupleId:', savedCoupleId)
      if (savedCoupleId) {
        coupleId.value = savedCoupleId
        console.log('[CloudSync] 启动 Realtime 监听...')
        try {
          await _startRealtimeListening(savedCoupleId)
          console.log('[CloudSync] ✅ Realtime 监听已启动')
        } catch (rtErr) {
          console.error('[CloudSync] Realtime 启动失败:', rtErr.message || rtErr)
        }
      } else {
        console.warn('[CloudSync] ⚠️ 未找到 coupleId，等待绑定后激活')
      }

      // 4. 处理离线时的待同步队列
      try {
        await sync.processSyncQueue()
        pendingCount.value = sync.getSyncStatus().queueLength
      } catch (qErr) {
        console.warn('[CloudSync] 处理同步队列失败:', qErr)
      }

      syncStatus.value = savedCoupleId ? 'connected' : 'idle'
      console.log('[CloudSync] 初始化完成, status:', syncStatus.value, ', isOnline:', isOnline.value, ', coupleId:', coupleId.value)
      return true
    } catch (e) {
      console.error('[CloudSync] ❌ 初始化失败:', e.message || e)
      syncStatus.value = 'error'
      isOnline.value = false
      return false
    }
  }

  /**
   * 绑定情侣后激活实时同步
   * 在配对成功后调用
   */
  const activateCoupleSync = async (newCoupleId) => {
    console.log('[CloudSync] 激活情侣同步, coupleId:', newCoupleId)
    coupleId.value = newCoupleId
    uni.setStorageSync('couple_id_cloud', newCoupleId)
    
    // 执行首次全量同步
    syncStatus.value = 'syncing'
    console.log('[CloudSync] 开始全量同步...')
    await sync.fullSync(newCoupleId, db)
    lastSyncTime.value = new Date().toISOString()
    console.log('[CloudSync] ✅ 全量同步完成')
    
    // 启动实时监听
    console.log('[CloudSync] 启动 Realtime 监听...')
    await _startRealtimeListening(newCoupleId)
    console.log('[CloudSync] ✅ Realtime 监听已启动')
    syncStatus.value = 'connected'
    console.log('[CloudSync] 情侣同步激活完成')
  }

  /**
   * 推送数据到云端
   * 在本地数据变更后调用（异步，不阻塞UI）
   */
  const pushData = async (storeName, record) => {
    if (!isOnline.value || !coupleId.value) return
    
    // 确保记录有 coupleId
    if (!record.coupleId) {
      record.coupleId = coupleId.value
    }
    
    // 异步上传，不阻塞
    sync.uploadRecord(storeName, record).then(() => {
      pendingCount.value = sync.getSyncStatus().queueLength
    })
  }

  /**
   * 从云端拉取指定类型的最新数据
   */
  const pullData = async (storeName) => {
    if (!isOnline.value || !coupleId.value) return []
    return await sync.downloadRecords(storeName, coupleId.value)
  }

  /**
   * 执行全量同步
   */
  const doFullSync = async () => {
    if (!isOnline.value || !coupleId.value) return
    syncStatus.value = 'syncing'
    const result = await sync.fullSync(coupleId.value, db)
    lastSyncTime.value = new Date().toISOString()
    syncStatus.value = 'connected'
    return result
  }

  /**
   * 删除云端记录
   */
  const removeCloudData = async (storeName, recordId) => {
    if (!isOnline.value || !coupleId.value) return
    await sync.deleteCloudRecord(storeName, recordId, coupleId.value)
  }

  /**
   * 解绑时清除云端数据
   */
  const clearCoupleCloud = async () => {
    if (coupleId.value) {
      await auth.unbindCloud(coupleId.value)
    }
    realtime.stopWatching()
    coupleId.value = null
    isOnline.value = false
    syncStatus.value = 'idle'
    uni.removeStorageSync('couple_id_cloud')
  }

  /**
   * 注册数据更新回调（供 store 使用）
   * 当收到实时数据推送时，通知对应的 store 更新
   */
  const registerCallback = (storeName, callback) => {
    dataCallbacks.set(storeName, callback)
  }

  /**
   * 取消注册
   */
  const unregisterCallback = (storeName) => {
    dataCallbacks.delete(storeName)
  }

  // ========== 内部方法 ==========

  const _startRealtimeListening = async (cid) => {
    await realtime.startWatching(cid, {
      onData: (storeName, record, event) => {
        console.log(`[CloudSync] 收到实时数据: ${storeName}/${record.id} (${event})`)
        
        // 写入本地 IndexedDB
        if (db[storeName] && record.id) {
          db[storeName].setItem(record.id, record)
        }
        
        // 通知对应 store
        const callback = dataCallbacks.get(storeName)
        if (callback) {
          callback(record, event)
        }
      },
      onDelete: (storeName, recordId) => {
        console.log(`[CloudSync] 收到删除: ${storeName}/${recordId}`)
        if (db[storeName]) {
          db[storeName].removeItem(recordId)
        }
        const callback = dataCallbacks.get(storeName)
        if (callback) {
          callback({ id: recordId, _deleted: true }, 'delete')
        }
      },
      onStatusChange: (status) => {
        if (status === 'connected') {
          isOnline.value = true
          syncStatus.value = 'connected'
        } else if (status === 'disconnected') {
          syncStatus.value = 'disconnected'
        }
      },
      onError: (error) => {
        console.error('[CloudSync] 实时监听错误:', error)
      }
    })
  }

  return {
    // 状态
    syncStatus,
    isOnline,
    lastSyncTime,
    pendingCount,
    coupleId,
    
    // 方法
    initCloud,
    activateCoupleSync,
    pushData,
    pullData,
    doFullSync,
    removeCloudData,
    clearCoupleCloud,
    registerCallback,
    unregisterCallback,
    
    // 认证相关
    cloudAuth: auth,
    isConfigured: isSupabaseConfigured
  }
}

