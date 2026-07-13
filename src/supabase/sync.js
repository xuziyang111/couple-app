/**
 * 数据同步层（Supabase）
 * 
 * 负责本地数据 ↔ 云端数据的双向同步
 */
import { getSupabase, isSupabaseConfigured } from './index'
import { getCurrentUser } from './auth'

// 本地 store 名称 → Supabase table 映射
const STORE_TABLE_MAP = {
  messages: 'couple_messages',
  diaries: 'couple_diaries',
  photos: 'couple_photos',
  mediaBlobs: 'couple_media_blobs',
  checkins: 'couple_checkins',
  wishes: 'couple_wishes',
  anniversaries: 'couple_anniversaries',
  finances: 'couple_finances',
  quizRecords: 'couple_quiz_records'
}

// 同步状态
let syncQueue = []
let isSyncing = false
let lastSyncTime = null

/**
 * 上传单条记录到云端
 */
export const uploadRecord = async (storeName, record) => {
  if (!isSupabaseConfigured()) {
    console.warn(`[Sync] Supabase 未配置，跳过上传: ${storeName}/${record?.id}`)
    return null
  }
  
  const supabase = getSupabase()
  const user = getCurrentUser()
  if (!user || !record) {
    console.warn(`[Sync] 用户未登录或记录为空，跳过上传: ${storeName}/${record?.id}`)
    return null
  }

  const tableName = STORE_TABLE_MAP[storeName]
  if (!tableName) {
    console.error(`[Sync] 找不到表映射: storeName=${storeName}`)
    return null
  }

  try {
    console.log(`[Sync] 开始上传: ${storeName}/${record.id} -> ${tableName}`)
    
    // 检查云端是否已存在该记录
    const { data: existing } = await supabase
      .from(tableName)
      .select('*')
      .eq('record_id', record.id)
      .eq('couple_id', record.coupleId)
      .maybeSingle()

    if (existing) {
      console.log(`[Sync] 记录已存在，比较时间戳...`)
      // 比较 updatedAt，保留最新的
      const cloudTime = existing.updated_at ? new Date(existing.updated_at).getTime() : 0
      const localTime = record.updatedAt ? new Date(record.updatedAt).getTime() : 0
      
      if (localTime >= cloudTime) {
        // 本地更新，覆盖云端
        console.log(`[Sync] 本地更新，覆盖云端记录`)
        const { data, error } = await supabase
          .from(tableName)
          .update({
            data: JSON.stringify(record),
            updated_at: record.updatedAt || new Date().toISOString(),
            created_by: record.createdBy || ''
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) throw error
        console.log(`[Sync] ✅ 更新成功: ${tableName}/${existing.id}`)
        return data
      }
      console.log(`[Sync] 云端更新，跳过上传`)
      return existing
    } else {
      // 新建云端记录
      console.log(`[Sync] 新建云端记录...`)
      const { data, error } = await supabase
        .from(tableName)
        .insert({
          record_id: record.id,
          couple_id: record.coupleId,
          data: JSON.stringify(record),
          updated_at: record.updatedAt || new Date().toISOString(),
          created_by: record.createdBy || ''
        })
        .select()
        .single()

      if (error) throw error
      console.log(`[Sync] ✅ 插入成功: ${tableName}/${data.id}`)
      return data
    }
  } catch (e) {
    console.error(`[Sync] ❌ 上传失败 ${storeName}/${record.id}:`, e.message || e)
    syncQueue.push({ action: 'upload', storeName, record, retries: 0 })
    return null
  }
}

/**
 * 从云端下载指定类型的所有记录
 */
export const downloadRecords = async (storeName, coupleId) => {
  if (!isSupabaseConfigured()) return []
  
  const supabase = getSupabase()
  const tableName = STORE_TABLE_MAP[storeName]
  if (!tableName) return []

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('couple_id', coupleId)
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (error) throw error
    
    return (data || []).map(obj => _cloudToLocal(obj))
  } catch (e) {
    console.error(`[Sync] 下载失败 ${storeName}:`, e)
    return []
  }
}

/**
 * 删除云端记录
 */
export const deleteCloudRecord = async (storeName, recordId, coupleId) => {
  if (!isSupabaseConfigured()) return
  
  const supabase = getSupabase()
  const tableName = STORE_TABLE_MAP[storeName]
  if (!tableName) return

  try {
    await supabase
      .from(tableName)
      .delete()
      .eq('record_id', recordId)
      .eq('couple_id', coupleId)
  } catch (e) {
    console.error(`[Sync] 删除云端记录失败:`, e)
  }
}

/**
 * 全量同步（双向合并）
 */
export const fullSync = async (coupleId, localDb) => {
  if (!isSupabaseConfigured()) return { uploaded: 0, downloaded: 0 }
  
  isSyncing = true
  let uploaded = 0
  let downloaded = 0

  try {
    for (const [storeName, tableName] of Object.entries(STORE_TABLE_MAP)) {
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
      const cloudMap = new Map(cloudRecords.map(r => [r.record_id, r]))

      // 上传本地有但云端没有/本地更新的
      for (const [id, local] of localMap) {
        const cloud = cloudMap.get(id)
        if (!cloud) {
          await uploadRecord(storeName, local)
          uploaded++
        } else if (local.updatedAt && cloud.updated_at && 
                   new Date(local.updatedAt).getTime() > new Date(cloud.updated_at).getTime()) {
          await uploadRecord(storeName, local)
          uploaded++
        }
      }

      // 下载云端有但本地没有/云端更新的
      for (const [id, cloud] of cloudMap) {
        const local = localMap.get(id)
        if (!local) {
          if (localDb[storeName]) {
            await localDb[storeName].setItem(id, _cloudToLocal(cloud))
          }
          downloaded++
        } else if (cloud.updated_at && local.updatedAt &&
                   new Date(cloud.updated_at).getTime() > new Date(local.updatedAt).getTime()) {
          if (localDb[storeName]) {
            await localDb[storeName].setItem(id, _cloudToLocal(cloud))
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

function _cloudToLocal(cloudObj) {
  try {
    if (cloudObj.data) {
      // JSONB 列可能返回对象或字符串，兼容两种情况
      if (typeof cloudObj.data === 'string') {
        return JSON.parse(cloudObj.data)
      }
      return cloudObj.data
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
