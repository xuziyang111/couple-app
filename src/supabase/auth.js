/**
 * Supabase 认证模块
 * 
 * 处理匿名登录、用户注册、情侣关联
 * 
 * 数据模型：
 * - auth.users: 匿名用户，存储 email/nickname/avatar/userId/coupleId
 * - couples: 情侣表，存储 coupleId/me/partner/loveStartDate/secretHash
 * - secret_mappings: 密钥映射表（临时），用于配对流程
 */
import { getSupabase, isSupabaseConfigured } from './index'

// 当前用户
let currentUser = null

/**
 * 匿名登录 / 恢复登录
 */
export const login = async () => {
  if (!isSupabaseConfigured()) return null
  
  const supabase = getSupabase()
  if (!supabase) return null

  // 尝试从本地恢复 session
  const savedSession = uni.getStorageSync('sb_session')
  if (savedSession) {
    try {
      const { data: { user }, error } = await supabase.auth.setSession(savedSession)
      if (!error && user) {
        currentUser = user
        console.log('[Auth] 恢复登录成功:', user.id)
        return user
      }
    } catch (e) {
      console.warn('[Auth] session 过期，重新登录')
      uni.removeStorageSync('sb_session')
    }
  }

  // 创建匿名用户
  // 尝试使用 signInAnonymously（推荐方式）
  let { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        isAnonymous: true,
        nickname: '',
        avatar: '',
        userId: ''
      }
    }
  })

  // 如果不支持 signInAnonymously，降级到 signUp 方式
  if (error?.message?.includes('signInAnonymously')) {
    console.log('[Auth] signInAnonymously 不支持，使用 signUp 方式')
    const randomEmail = `anon_${Date.now()}@temp.supabase.co`
    const randomPassword = Math.random().toString(36).slice(2, 16)
    
    const result = await supabase.auth.signUp({
      email: randomEmail,
      password: randomPassword,
      options: {
        data: {
          isAnonymous: true,
          nickname: '',
          avatar: '',
          userId: ''
        },
        emailRedirectTo: undefined
      }
    })
    data = result.data
    error = result.error
  }

  if (error) {
    console.error('[Auth] 匿名登录失败:', error)
    throw error
  }

  currentUser = data.user
  
  // 保存 session
  const { data: sessionData } = await supabase.auth.getSession()
  if (sessionData?.session) {
    uni.setStorageSync('sb_session', sessionData.session)
  }

  console.log('[Auth] 匿名登录成功:', currentUser.id)
  return currentUser
}

/**
 * 获取当前用户
 */
export const getCurrentUser = () => {
  return currentUser
}

/**
 * 更新用户资料
 */
export const updateProfile = async (data) => {
  if (!currentUser) throw new Error('未登录')
  
  const supabase = getSupabase()
  if (!supabase) return null

  const updates = {}
  if (data.nickname) updates.nickname = data.nickname
  if (data.avatar) updates.avatar = data.avatar
  if (data.userId) updates.userId = data.userId

  const { error } = await supabase.auth.updateUser({
    data: updates
  })

  if (error) throw error
  
  // 更新本地用户对象
  currentUser.user_metadata = { ...currentUser.user_metadata, ...updates }
  return currentUser
}

/**
 * 创建情侣空间（创建方）
 */
export const createCoupleSpace = async ({ coupleId, secretHash, me, loveStartDate }) => {
  if (!isSupabaseConfigured()) {
    console.warn('[Auth] Supabase 未配置，无法创建云端空间')
    return null
  }

  const supabase = getSupabase()
  if (!supabase) return null

  const user = getCurrentUser()
  if (!user) throw new Error('未登录')

  // 创建 Couple 记录
  const { data: couple, error } = await supabase.from('couples').insert({
    couple_id: coupleId,
    secret_hash: secretHash,
    me: {
      user_id: me.userId,
      nickname: me.nickname,
      avatar: me.avatar || '',
      sb_user_id: user.id
    },
    partner: null,
    love_start_date: loveStartDate,
    created_at_cloud: Date.now()
  }).select().single()

  if (error) {
    console.error('[Auth] 创建情侣空间失败:', error)
    throw error
  }

  // 创建密钥映射
  console.log('[Auth] 正在创建密钥映射:', { secretHash, coupleId })
  const { data: mappingData, error: mapError } = await supabase.from('secret_mappings').insert({
    secret_hash: secretHash,
    couple_id: coupleId,
    creator_sb_user_id: user.id,
    active: true,
    expire_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }).select()

  if (mapError) {
    console.error('[Auth] 创建密钥映射失败:', mapError)
    throw mapError
  }
  
  console.log('[Auth] 密钥映射创建成功:', mappingData)

  // 更新用户的 coupleId
  await updateProfile({ coupleId })

  console.log('[Auth] 情侣空间已创建:', coupleId)
  return couple
}

/**
 * 加入情侣空间（加入方）
 */
export const joinCoupleSpace = async ({ secretHash, me }) => {
  if (!isSupabaseConfigured()) {
    console.warn('[Auth] Supabase 未配置，无法加入云端空间')
    return null
  }

  const supabase = getSupabase()
  if (!supabase) return null

  const user = getCurrentUser()
  if (!user) throw new Error('未登录')

  // 通过密钥查找映射
  console.log('[Auth] 正在查询密钥:', secretHash)
  const { data: mapping, error: mapError } = await supabase
    .from('secret_mappings')
    .select('*')
    .eq('secret_hash', secretHash)
    .eq('active', true)
    .maybeSingle()
  
  if (mapError) {
    console.error('[Auth] 查询密钥映射失败:', mapError)
    throw mapError
  }
  
  console.log('[Auth] 查询结果:', mapping)
  
  if (!mapping) {
    throw new Error('密钥无效或已过期')
  }

  const coupleId = mapping.couple_id

  // 查找 Couple 记录
  const { data: couple, error: coupleError } = await supabase
    .from('couples')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle()
  
  if (coupleError) throw coupleError
  
  if (!couple) {
    throw new Error('情侣空间不存在')
  }

  if (couple.partner) {
    throw new Error('该空间已有伴侣')
  }

  // 填充 partner 信息
  const { error: updateError } = await supabase
    .from('couples')
    .update({
      partner: {
        user_id: me.userId,
        nickname: me.nickname,
        avatar: me.avatar || '',
        sb_user_id: user.id
      }
    })
    .eq('couple_id', coupleId)

  if (updateError) throw updateError

  // 标记映射为已使用
  await supabase
    .from('secret_mappings')
    .update({ active: false })
    .eq('id', mapping.id)

  // 更新双方用户的 coupleId
  await updateProfile({ coupleId })

  console.log('[Auth] 已加入情侣空间:', coupleId)
  return couple
}

/**
 * 获取情侣云端数据
 */
export const getCoupleCloudData = async (coupleId) => {
  if (!isSupabaseConfigured()) return null
  
  const supabase = getSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('couples')
    .select('*')
    .eq('couple_id', coupleId)
    .maybeSingle()

  if (error) {
    console.error('[Auth] 获取情侣数据失败:', error)
    return null
  }

  if (!data) return null

  return {
    id: data.id,
    coupleId: data.couple_id,
    me: data.me,
    partner: data.partner,
    loveStartDate: data.love_start_date,
    secretHash: data.secret_hash
  }
}

/**
 * 解绑 - 清除云端情侣数据
 */
export const unbindCloud = async (coupleId) => {
  if (!isSupabaseConfigured()) return
  
  const supabase = getSupabase()
  if (!supabase) return

  const user = getCurrentUser()
  if (!user) return

  // 清除 Couple 记录
  await supabase.from('couples').delete().eq('couple_id', coupleId)

  // 清除映射
  await supabase.from('secret_mappings').delete().eq('couple_id', coupleId)

  // 清除用户 coupleId
  await updateProfile({ coupleId: null })

  console.log('[Auth] 云端情侣数据已清除')
}

/**
 * 登出
 */
export const logout = async () => {
  const supabase = getSupabase()
  if (supabase) {
    await supabase.auth.signOut()
  }
  currentUser = null
  uni.removeStorageSync('sb_session')
}

export default {
  login,
  getCurrentUser,
  updateProfile,
  createCoupleSpace,
  joinCoupleSpace,
  getCoupleCloudData,
  unbindCloud,
  logout
}
