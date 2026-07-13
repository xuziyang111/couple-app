/**
 * Supabase Realtime 实时订阅模块
 * 
 * 监听云端数据变化，实时推送到本地
 */
import { getSupabase, isSupabaseConfigured } from './index'
import { getCurrentUser } from './auth'

// 当前活跃的订阅
let subscriptions = []
let isWatching = false

// Supabase table 名称列表
const WATCH_TABLES = [
  'couple_messages',
  'couple_diaries',
  'couple_photos',
  'couple_checkins',
  'couple_wishes',
  'couple_anniversaries',
  'couple_finances',
  'couple_quiz_records'
]

// table → store 映射
const TABLE_STORE_MAP = {
  couple_messages: 'messages',
  couple_diaries: 'diaries',
  couple_photos: 'photos',
  couple_media_blobs: 'mediaBlobs',
  couple_checkins: 'checkins',
  couple_wishes: 'wishes',
  couple_anniversaries: 'anniversaries',
  couple_finances: 'finances',
  couple_quiz_records: 'quizRecords'
}

/**
 * 开始监听情侣数据变化
 */
export const startWatching = async (coupleId, callbacks = {}) => {
  if (!isSupabaseConfigured()) {
    console.warn('[Realtime] Supabase 未配置，无法启动实时监听')
    return
  }

  const supabase = getSupabase()
  const user = getCurrentUser()
  if (!user) {
    console.warn('[Realtime] 未登录，无法启动实时监听')
    return
  }

  // 先停止之前的监听
  stopWatching()

  try {
    for (const tableName of WATCH_TABLES) {
      try {
        const channel = supabase
          .channel(`couple_${coupleId}_${tableName}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: tableName,
              filter: `couple_id=eq.${coupleId}`
            },
            (payload) => {
              const storeName = TABLE_STORE_MAP[tableName]
              
              if (payload.eventType === 'DELETE') {
                const recordId = payload.old.record_id
                if (recordId && callbacks.onDelete) {
                  callbacks.onDelete(storeName, recordId)
                }
              } else {
                const record = _parseRecord(payload.new)
                if (record && callbacks.onData) {
                  callbacks.onData(storeName, record, payload.eventType.toLowerCase())
                }
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log(`[Realtime] 已订阅: ${tableName}`)
              if (callbacks.onStatusChange) callbacks.onStatusChange('connected')
            } else if (status === 'CHANNEL_ERROR') {
              console.error(`[Realtime] 订阅失败: ${tableName}`)
              if (callbacks.onError) callbacks.onError(new Error(`Channel error: ${tableName}`))
            }
          })

        subscriptions.push({ channel, tableName })
      } catch (e) {
        console.warn(`[Realtime] 订阅 ${tableName} 失败:`, e)
      }
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
  let supabase
  try { supabase = getSupabase() } catch(e) { /* ignore */ }
  for (const sub of subscriptions) {
    try {
      if (supabase) supabase.removeChannel(sub.channel)
    } catch (e) {
      // ignore
    }
  }
  subscriptions = []
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
 * 手动触发一次数据拉取（用于降级）
 */
export const pullOnce = async (coupleId, callbacks = {}) => {
  if (!isSupabaseConfigured()) return
  
  const supabase = getSupabase()
  
  for (const tableName of WATCH_TABLES) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('couple_id', coupleId)
        .order('updated_at', { ascending: false })
        .limit(100)

      if (error) throw error
      
      const storeName = TABLE_STORE_MAP[tableName]
      for (const obj of (data || [])) {
        const record = _parseRecord(obj)
        if (record && callbacks.onData) {
          callbacks.onData(storeName, record, 'pull')
        }
      }
    } catch (e) {
      console.warn(`[Realtime] 拉取 ${tableName} 失败:`, e)
    }
  }
}

// ========== 内部辅助 ==========

function _parseRecord(row) {
  try {
    if (row.data) {
      return JSON.parse(row.data)
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
