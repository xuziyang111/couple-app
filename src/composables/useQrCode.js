import { ref } from 'vue'

export function useQrCode() {
  const qrCodeUrl = ref('')

  const generateQrCode = (text) => {
    // 使用 uqrcodejs 生成二维码
    // #ifdef H5
    return new Promise((resolve, reject) => {
      try {
        import('uqrcodejs').then((module) => {
          const uqrcode = module.default || module
          const canvas = document.createElement('canvas')
          canvas.width = 300
          canvas.height = 300
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            console.error('[QRCode] 无法获取 canvas context')
            reject(new Error('Canvas context not available'))
            return
          }
          
          try {
            const qr = new uqrcode({
              text,
              width: 300,
              height: 300,
              colorDark: '#FF6B81',
              colorLight: '#FFFFFF',
              correctLevel: uqrcode.CorrectLevel?.H || 3
            })
            
            // 尝试不同的 draw 方法
            if (typeof qr.draw === 'function') {
              qr.draw(canvas, () => {
                qrCodeUrl.value = canvas.toDataURL()
                resolve(qrCodeUrl.value)
              })
            } else if (typeof qr.make === 'function') {
              qr.make()
              qrCodeUrl.value = canvas.toDataURL()
              resolve(qrCodeUrl.value)
            } else {
              // 如果都不支持，使用简单的占位符
              console.warn('[QRCode] uQRCode API 不兼容，使用占位符')
              qrCodeUrl.value = ''
              resolve('')
            }
          } catch (drawError) {
            console.error('[QRCode] 绘制失败:', drawError)
            // 即使二维码生成失败，也返回空字符串继续流程
            qrCodeUrl.value = ''
            resolve('')
          }
        }).catch(e => {
          console.error('[QRCode] 模块加载失败:', e)
          qrCodeUrl.value = ''
          resolve('')
        })
      } catch (e) {
        console.error('[QRCode] 生成失败:', e)
        qrCodeUrl.value = ''
        resolve('') // 不阻塞主流程
      }
    })
    // #endif
    
    // #ifdef APP-PLUS
    return Promise.resolve('')
    // #endif
  }

  return {
    qrCodeUrl,
    generateQrCode
  }
}
