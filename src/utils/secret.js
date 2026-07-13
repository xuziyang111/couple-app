// 6位密钥生成与校验
// 去除易混淆字符: 0/O/1/I/L
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateSecret() {
  let secret = ''
  for (let i = 0; i < 6; i++) {
    secret += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return secret
}

export function validateSecret(secret) {
  if (!secret || secret.length !== 6) return false
  const regex = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/
  return regex.test(secret.toUpperCase())
}

export function hashSecret(secret) {
  // 简单hash用于本地存储校验
  let hash = 0
  const str = secret.toUpperCase()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}
