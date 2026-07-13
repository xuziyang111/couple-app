/**
 * LeanCloud 认证模块
 * 
 * 处理匿名登录、用户注册、情侣关联
 * 
 * 数据模型：
 * - _User: 匿名用户，存储 nickname/avatar/userId/coupleId
 * - Couple: 情侣表，存储 coupleId/me/partner/loveStartDate/secretHash
 * - SecretMapping: 密钥映射表（临时），用于配对流程
 */
import { getAV, isLeanCloudConfigured } from './index'

// 当前用户
let currentUser = null

/**
 * 匿名登录 / 恢复登录
 * 如果本地有保存的 sessionToken，尝试恢复登录状态
 * 否则创建新的匿名用户
 */
export const login = async () => {
  const AV = getAV()
  if (!AV) return null

  // 尝试从本地恢复 session
  const savedToken = uni.getStorageSync('lc_session_token')
  if (savedToken) {
    try {
      const user = await AV.User.become(savedToken)
      currentUser = user
      console.log('[Auth] 恢复登录成功:', user.id)
      return user
    } catch (e) {
      console.warn('[Auth] session 过期，重新登录')
      uni.removeStorageSync('lc_session_token')
    }
  }

  // 创建匿名用户
  const user = new AV.User()
  const username = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  user.setUsername(username)
  user.setPassword(Math.random().toString(36).slice(2, 16))
  user.set('isAnonymous', true)
  
  await user.signUp()
  currentUser = user
  
  // 保存 session token
  uni.setStorageSync('lc_session_token', user.getSessionToken())
  console.log('[Auth] 匿名登录成功:', user.id)
  return user
}

/**
 * 获取当前用户
 */
export const getCurrentUser = () => {
  if (!currentUser) {
    const AV = getAV()
    if (AV) {
      currentUser = AV.User.current()
    }
  }
  return currentUser
}

/**
 * 更新当前用户的资料
 */
export const updateProfile = async (data) => {
  const user = getCurrentUser()
  if (!user) throw new Error('未登录')
  
  if (data.nickname) user.set('nickname', data.nickname)
  if (data.avatar) user.set('avatar', data.avatar)
  if (data.userId) user.set('userId', data.userId)
  
  await user.save()
  return user
}

/**
 * 创建情侣空间（创建方）
 * 1. 在云端创建 Couple 记录
 * 2. 创建 SecretMapping 用于对方查找
 * 3. 更新用户的 coupleId
 */
export const createCoupleSpace = async ({ coupleId, secretHash, me, loveStartDate }) => {
  // 检查 LeanCloud 是否已配置
  if (!isLeanCloudConfigured()) {
    console.warn('[Auth] LeanCloud 未配置，无法创建云端空间')
    return null
  }

  const AV = getAV()
  const user = getCurrentUser()
  if (!user) throw new Error('未登录')

  // 创建 Couple 记录
  const Couple = AV.Object.extend('Couple')
  const couple = new Couple()
  couple.set('coupleId', coupleId)
  couple.set('secretHash', secretHash)
  couple.set('me', {
    userId: me.userId,
    nickname: me.nickname,
    avatar: me.avatar || '',
    lcUserId: user.id
  })
  couple.set('partner', null) // 等待对方加入
  couple.set('loveStartDate', loveStartDate)
  couple.set('createdAt_cloud', Date.now())
  await couple.save()

  // 创建密钥映射（供对方通过密钥查找）
  const Mapping = AV.Object.extend('SecretMapping')
  const mapping = new Mapping()
  mapping.set('secretHash', secretHash)
  mapping.set('coupleId', coupleId)
  mapping.set('creatorLcUserId', user.id)
  mapping.set('active', true)
  mapping.set('expireAt', new Date(Date.now() + 24 * 3600 * 1000)) // 24小时过期
  await mapping.save()

  // 更新用户的 coupleId
  user.set('coupleId', coupleId)
  await user.save()

  console.log('[Auth] 情侣空间已创建:', coupleId)
  return couple
}

/**
 * 加入情侣空间（加入方）
 * 1. 通过密钥查找 Couple
 * 2. 填充 partner 信息
 * 3. 更新双方用户记录
 */
export const joinCoupleSpace = async ({ secretHash, me }) => {
  // 检查 LeanCloud 是否已配置
  if (!isLeanCloudConfigured()) {
    console.warn('[Auth] LeanCloud 未配置，无法加入云端空间')
    return null
  }

  const AV = getAV()
  const user = getCurrentUser()
  if (!user) throw new Error('未登录')

  // 通过密钥查找映射
  const query = new AV.Query('SecretMapping')
  query.equalTo('secretHash', secretHash)
  query.equalTo('active', true)
  const mapping = await query.first()
  
  if (!mapping) {
    throw new Error('密钥无效或已过期')
  }

  const coupleId = mapping.get('coupleId')

  // 查找 Couple 记录
  const coupleQuery = new AV.Query('Couple')
  coupleQuery.equalTo('coupleId', coupleId)
  const couple = await coupleQuery.first()
  
  if (!couple) {
    throw new Error('情侣空间不存在')
  }

  if (couple.get('partner')) {
    throw new Error('该空间已有伴侣')
  }

  // 填充 partner 信息
  couple.set('partner', {
    userId: me.userId,
    nickname: me.nickname,
    avatar: me.avatar || '',
    lcUserId: user.id
  })
  await couple.save()

  // 标记映射为已使用
  mapping.set('active', false)
  await mapping.save()

  // 更新双方用户的 coupleId
  user.set('coupleId', coupleId)
  await user.save()

  console.log('[Auth] 已加入情侣空间:', coupleId)
  return couple
}

/**
 * 通过密钥检查空间是否存在
 */
export const checkSecret = async (secretHash) => {
  if (!isLeanCloudConfigured()) return false
  
  const AV = getAV()
  const query = new AV.Query('SecretMapping')
  query.equalTo('secretHash', secretHash)
  query.equalTo('active', true)
  const mapping = await query.first()
  return !!mapping
}

/**
 * 获取情侣云端数据
 */
export const getCoupleCloudData = async (coupleId) => {
  if (!isLeanCloudConfigured()) return null
  
  const AV = getAV()
  const query = new AV.Query('Couple')
  query.equalTo('coupleId', coupleId)
  const couple = await query.first()
  if (!couple) return null
  return {
    id: couple.id,
    coupleId: couple.get('coupleId'),
    me: couple.get('me'),
    partner: couple.get('partner'),
    loveStartDate: couple.get('loveStartDate'),
    secretHash: couple.get('secretHash')
  }
}

/**
 * 解绑 - 清除云端情侣数据
 */
export const unbindCloud = async (coupleId) => {
  if (!isLeanCloudConfigured()) return
  
  const AV = getAV()
  const user = getCurrentUser()
  if (!user) return

  // 清除 Couple 记录
  const query = new AV.Query('Couple')
  query.equalTo('coupleId', coupleId)
  const couple = await query.first()
  if (couple) await couple.destroy()

  // 清除映射
  const mapQuery = new AV.Query('SecretMapping')
  mapQuery.equalTo('coupleId', coupleId)
  const mappings = await mapQuery.find()
  for (const m of mappings) {
    await m.destroy()
  }

  // 清除用户 coupleId
  user.set('coupleId', null)
  await user.save()

  console.log('[Auth] 云端情侣数据已清除')
}

/**
 * 登出
 */
export const logout = async () => {
  const AV = getAV()
  if (AV) {
    await AV.User.logOut()
  }
  currentUser = null
  uni.removeStorageSync('lc_session_token')
}

export default {
  login,
  getCurrentUser,
  updateProfile,
  createCoupleSpace,
  joinCoupleSpace,
  checkSecret,
  getCoupleCloudData,
  unbindCloud,
  logout
}
