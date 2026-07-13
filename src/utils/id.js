// 唯一ID生成
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function generateCoupleId() {
  return 'C' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6).toUpperCase()
}

export function generateUserId() {
  return 'U' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8).toUpperCase()
}
