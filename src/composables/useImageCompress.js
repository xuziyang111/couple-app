import { ref } from 'vue'

export function useImageCompress() {
  const compressing = ref(false)

  const compressImage = (filePath, maxWidth = 1080, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      compressing.value = true
      uni.getImageInfo({
        src: filePath,
        success: (info) => {
          const canvasWidth = Math.min(info.width, maxWidth)
          const canvasHeight = Math.floor(canvasWidth * (info.height / info.width))
          
          // #ifdef H5
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = canvasWidth
          canvas.height = canvasHeight
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight)
            const dataUrl = canvas.toDataURL('image/jpeg', quality)
            compressing.value = false
            resolve(dataUrl)
          }
          img.onerror = (e) => {
            compressing.value = false
            reject(e)
          }
          img.src = filePath
          // #endif
          
          // #ifdef APP-PLUS
          const bitmap = new plus.nativeObj.Bitmap('compressed_' + Date.now())
          bitmap.load(filePath, {
            width: canvasWidth,
            height: canvasHeight
          }, () => {
            const outputPath = `_doc/compressed_${Date.now()}.jpg`
            bitmap.save(outputPath, { quality: quality * 100 }, () => {
              compressing.value = false
              resolve(outputPath)
              bitmap.clear()
            }, (e) => {
              compressing.value = false
              reject(e)
              bitmap.clear()
            })
          }, (e) => {
            compressing.value = false
            reject(e)
          })
          // #endif
        },
        fail: (e) => {
          compressing.value = false
          reject(e)
        }
      })
    })
  }

  const chooseAndCompress = (count = 9, maxWidth = 1080, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          const compressed = []
          for (const path of res.tempFilePaths) {
            try {
              const result = await compressImage(path, maxWidth, quality)
              compressed.push(result)
            } catch (e) {
              compressed.push(path) // fallback to original
            }
          }
          resolve(compressed)
        },
        fail: reject
      })
    })
  }

  return {
    compressing,
    compressImage,
    chooseAndCompress
  }
}
