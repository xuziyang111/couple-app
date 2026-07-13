/**
 * Supabase 初始化模块
 * 
 * 使用前需要在 Supabase 控制台创建项目，并填入以下配置：
 * https://supabase.com/dashboard
 * 
 * 需要开启的服务：
 * 1. Database - PostgreSQL 数据库
 * 2. Authentication - 匿名登录
 * 3. Realtime - 实时订阅
 */
import { createClient } from '@supabase/supabase-js'

// ============ 请填入你的 Supabase 配置 ============
const SUPABASE_URL = 'https://ggkncfyyyyheisatfjsz.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdna25jZnl5eXloZWlzYXRmanN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NDg3NzksImV4cCI6MjA5OTMyNDc3OX0.BdQr61xfkc0PQsG31b99zHPGGV32qR3mvYvttdd97WI'
// ====================================================

let supabase = null
let initialized = false

/**
 * 获取 Supabase 客户端实例
 */
export const getSupabase = () => {
  if (!initialized) {
    initSupabase()
  }
  return supabase
}

/**
 * 初始化 Supabase
 */
export const initSupabase = () => {
  if (initialized) return supabase
  
  if (SUPABASE_URL === 'https://YOUR_PROJECT.supabase.co') {
    console.warn('[Supabase] 请先配置 SUPABASE_URL / SUPABASE_ANON_KEY')
    return null
  }

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })

  initialized = true
  console.log('[Supabase] 初始化成功')
  return supabase
}

/**
 * 检查是否已配置 Supabase
 */
export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'https://YOUR_PROJECT.supabase.co'
}

/**
 * 检查网络连接状态
 */
export const checkNetwork = async () => {
  if (!isSupabaseConfigured()) return false
  
  try {
    const client = getSupabase()
    const { data, error } = await client.from('_health_check').select('*').limit(1)
    return !error
  } catch (e) {
    return false
  }
}

export default { 
  getSupabase, 
  initSupabase, 
  isSupabaseConfigured, 
  checkNetwork 
}
