/**
 * 数据同步层
 * 
 * 负责本地数据 ↔ 云端数据的双向同步
 * 策略：
 * - 写入时：先写本地 IndexedDB/localStorage，再异步写云端
 * - 读取时：优先读本地，定期/实时从云端拉取
 * - 冲突解决：基于 updatedAt 时间戳，保留最新的
 * 
 * 云端数据模型（LeanCloud Class）：
 * - CoupleMessage: 聊天消息
 * - CoupleDiary: 日记
 * - CouplePhoto: 照片元数据
 * - CoupleMediaBlob: 媒体数据（大图/语音）
 * - CoupleCheckin: 打卡记录
 * - CoupleWish: 心愿
 * - CoupleAnniversary: 纪念日
 * - CoupleFinance: 记账
 * - CoupleQuizRecord: 问答记录
 */
import { getAV, isLeanCloudConfigured } from './index'
import { getCurrentUser } from './auth'

// 本地 store 名称 → 云端 class 名称映射
const STORE_CLASS_MAP = {
  messages: 'CoupleMessage',
  diaries: 'CoupleDiary',
  photos: 'CouplePhoto',
  mediaBlobs: 'CoupleMediaBlob',
  checkins: 'CoupleCheckin',
  wishes: 'CoupleWish',
  anniversaries: 'CoupleAnniversary',
  finances: 'CoupleFinance',
  quizRecords: 'CoupleQuizRecord'
}

// 同步状态
let syncQueue = []
let isSyncing = false
let lastSyncTime = null

/**
 * 上传单条记录到云端
 */
export const uploadRecord = async (storeName, record) => {
  if (!isLeanCloudConfigured()) return null
  const AV = getAV()
  const user = getCurrentUser()
  if (!user || !record) return null

  const className = STORE_CLASS_MAP[storeName]
  if (!className) return null

  try {
    // 检查云端是否已存在该记录
    const query = new AV.Query(className)
    query.equalTo('recordId', record.id)
    query.equalTo('coupleId', record.coupleId)
    const existing = await query.first()

    if (existing) {
      // 比较 updatedAt，保留最新的
      const cloudTime = existing.get('updatedAt') ? new Date(existing.get('updatedAt')).getTime() : 0
      const localTime = record.updatedAt ? new Date(record.updatedAt).getTime() : 0
      
      if (localTime >= cloudTime) {
        // 本地更新，覆盖云端
        _setRecordFields(existing, record, storeName)
        await existing.save()
        return existing
      }
      // 云端更新，不覆盖
      return existing
    } else {
      // 新建云端记录
      const Obj = AV.Object.extend(className)
      const obj = new Obj()
      _setRecordFields(obj, record, storeName)
      await obj.save()
      return obj
    }
  } catch (e) {
    console.error(`[Sync] 上传失败 ${storeName}/${record.id}:`, e)
    // 加入重试队列
    syncQueue.push({ action: 'upload', storeName, record, retries: 0 })
    return null
  }
}

/**
 * 从云端下载指定类型的所有记录
 */
export const downloadRecords = async (storeName, coupleId) => {
  if (!isLeanCloudConfigured()) return []
  const AV = getAV()

  const className = STORE_CLASS_MAP[storeName]
  if (!className) return []

  try {
    const query = new AV.Query(className)
    query.equalTo('coupleId', coupleId)
    query.limit(1000)
    query.descending('updatedAt')
    const results = await query.find()
    
    return results.map(obj => _cloudToLocal(obj, storeName))
  } catch (e) {
    console.error(`[Sync] 下载失败 ${storeName}:`, e)
    return []
  }
}

/**
 * 删除云端记录
 */
export const deleteCloudRecord = async (storeName, recordId, coupleId) => {
  if (!isLeanCloudConfigured()) return
  const AV = getAV()

  const className = STORE_CLASS_MAP[storeName]
  if (!className) return

  try {
    const query = new AV.Query(className)
    query.equalTo('recordId', recordId)
    query.equalTo('coupleId', coupleId)
    const obj = await query.first()
    if (obj) await obj.destroy()
  } catch (e) {
    console.error(`[Sync] 删除云端记录失败:`, e)
  }
}

/**
 * 全量同步（双向合并）
 * 用于初始化连接、从后台恢复等场景
 */
export const fullSync = async (coupleId, localDb) => {
  if (!isLeanCloudConfigured()) return { uploaded: 0, downloaded: 0 }
  
  isSyncing = true
  let uploaded = 0
  let downloaded = 0

  try {
    for (const [storeName, className] of Object.entries(STORE_CLASS_MAP)) {
      // 1. 获取本地数据
      const localRecords = []
      if (localDb[storeName]) {
        await localDb[storeName].iterate((value) => {
          localRecords.push(value)
        })
      }

      // 2. 获取云端数据
      const cloudRecords = await downloadRecords(storeName, coupleId)

      // 3. 合并（以 updatedAt 为准）
      const localMap = new Map(localRecords.map(r => [r.id, r]))
      const cloudMap = new Map(cloudRecords.map(r => [r.id, r]))

      // 上传本地有但云端没有/本地更新的
      for (const [id, local] of localMap) {
        const cloud = cloudMap.get(id)
        if (!cloud) {
          await uploadRecord(storeName, local)
          uploaded++
        } else if (local.updatedAt && cloud.updatedAt && 
                   new Date(local.updatedAt).getTime() > new Date(cloud.updatedAt).getTime()) {
          await uploadRecord(storeName, local)
          uploaded++
        }
      }

      // 下载云端有但本地没有/云端更新的
      for (const [id, cloud] of cloudMap) {
        const local = localMap.get(id)
        if (!local) {
          if (localDb[storeName]) {
            await localDb[storeName].setItem(id, cloud)
          }
          downloaded++
        } else if (cloud.updatedAt && local.updatedAt &&
                   new Date(cloud.updatedAt).getTime() > new Date(local.updatedAt).getTime()) {
          if (localDb[storeName]) {
            await localDb[storeName].setItem(id, cloud)
          }
          downloaded++
        }
      }
    }

    lastSyncTime = new Date().toISOString()
    uni.setStorageSync('last_sync_time', lastSyncTime)
    console.log(`[Sync] 全量同步完成: 上传${uploaded}条, 下载${downloaded}条`)
  } catch (e) {
    console.error('[Sync] 全量同步出错:', e)
  } finally {
    isSyncing = false
  }

  return { uploaded, downloaded }
}

/**
 * 处理离线时的待同步队列
 */
export const processSyncQueue = async () => {
  if (syncQueue.length === 0) return
  
  const queue = [...syncQueue]
  syncQueue = []
  
  for (const item of queue) {
    if (item.action === 'upload') {
      await uploadRecord(item.storeName, item.record)
    }
  }
}

/**
 * 获取同步状态
 */
export const getSyncStatus = () => ({
  isSyncing,
  queueLength: syncQueue.length,
  lastSyncTime
})

// ========== 内部辅助方法 ==========

function _setRecordFields(obj, record, storeName) {
  obj.set('recordId', record.id)
  obj.set('coupleId', record.coupleId)
  obj.set('data', JSON.stringify(record))
  obj.set('updatedAt', record.updatedAt || new Date().toISOString())
  obj.set('createdBy', record.createdBy || '')
  obj.set('storeName', storeName)
}

function _cloudToLocal(cloudObj, storeName) {
  try {
    const dataStr = cloudObj.get('data')
    if (dataStr) {
      return JSON.parse(dataStr)
    }
  } catch (e) {
    console.error('[Sync] 解析云端数据失败:', e)
  }
  return null
}

export default {
  uploadRecord,
  downloadRecords,
  deleteCloudRecord,
  fullSync,
  processSyncQueue,
  getSyncStatus
}
