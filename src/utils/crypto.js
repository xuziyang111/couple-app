import CryptoJS from 'crypto-js'

// AES加密
export function encrypt(data, password) {
  const key = CryptoJS.enc.Utf8.parse(password.padEnd(32, '0').slice(0, 32))
  const iv = CryptoJS.lib.WordArray.random(16)
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(data),
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  )
  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64)
  }
}

// AES解密
export function decrypt(encryptedData, password, ivStr) {
  const key = CryptoJS.enc.Utf8.parse(password.padEnd(32, '0').slice(0, 32))
  const iv = CryptoJS.enc.Base64.parse(ivStr)
  const ciphertext = CryptoJS.enc.Base64.parse(encryptedData)
  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext },
    key,
    { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
  )
  return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8))
}

// 生成随机密码盐
export function generateSalt() {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex)
}
