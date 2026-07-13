import { ref } from 'vue'

export function usePoster() {
  const generating = ref(false)
  const posterUrl = ref('')

  const generatePoster = (diaryData, coupleInfo) => {
    return new Promise((resolve, reject) => {
      generating.value = true
      
      // #ifdef H5
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 750
      canvas.height = 1200
      
      // 背景渐变
      const gradient = ctx.createLinearGradient(0, 0, 0, 1200)
      gradient.addColorStop(0, '#FF6B81')
      gradient.addColorStop(1, '#FF8FA2')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 750, 1200)
      
      // 白色卡片区域
      ctx.fillStyle = '#FFFFFF'
      // 兼容旧版浏览器的圆角矩形绘制
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(40, 200, 670, 800, 20)
        ctx.fill()
      } else {
        // 降级方案：使用普通矩形
        ctx.fillRect(40, 200, 670, 800)
      }
      
      // 标题
      ctx.fillStyle = '#4A3035'
      ctx.font = 'bold 36px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(diaryData.title || '我们的故事', 375, 280)
      
      // 内容
      ctx.fillStyle = '#8B6B72'
      ctx.font = '28px sans-serif'
      ctx.textAlign = 'left'
      const content = diaryData.content || ''
      const lines = wrapText(ctx, content, 590)
      lines.forEach((line, i) => {
        ctx.fillText(line, 80, 340 + i * 40)
      })
      
      // 日期
      ctx.fillStyle = '#C0A0A8'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(diaryData.createdAt || '', 375, 950)
      
      // 情侣信息
      if (coupleInfo) {
        ctx.fillStyle = '#FF6B81'
        ctx.font = 'bold 28px sans-serif'
        ctx.fillText(`${coupleInfo.me?.nickname || ''} & ${coupleInfo.partner?.nickname || ''}`, 375, 1050)
      }
      
      // 底部装饰
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '20px sans-serif'
      ctx.fillText('❤ 我们的小世界 ❤', 375, 1150)
      
      posterUrl.value = canvas.toDataURL('image/png')
      generating.value = false
      resolve(posterUrl.value)
      // #endif
      
      // #ifdef APP-PLUS
      generating.value = false
      resolve('')
      // #endif
    })
  }

  const wrapText = (ctx, text, maxWidth) => {
    const lines = []
    const paragraphs = text.split('\n')
    paragraphs.forEach(para => {
      let line = ''
      for (let i = 0; i < para.length; i++) {
        const testLine = line + para[i]
        const metrics = ctx.measureText(testLine)
        if (metrics.width > maxWidth && line.length > 0) {
          lines.push(line)
          line = para[i]
        } else {
          line = testLine
        }
      }
      lines.push(line)
    })
    return lines.slice(0, 15) // 最多15行
  }

  const savePoster = () => {
    if (!posterUrl.value) return
    // #ifdef H5
    const a = document.createElement('a')
    a.href = posterUrl.value
    a.download = `poster_${Date.now()}.png`
    a.click()
    // #endif
    
    // #ifdef APP-PLUS
    uni.saveImageToPhotosAlbum({
      filePath: posterUrl.value,
      success: () => {
        uni.showToast({ title: '已保存到相册', icon: 'success' })
      }
    })
    // #endif
  }

  return {
    generating,
    posterUrl,
    generatePoster,
    savePoster
  }
}
