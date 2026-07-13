import { ref } from 'vue'
import { exportAllData, db } from '../db'
import { encrypt, decrypt } from '../utils/crypto'
import { mergeRecords } from '../utils/merge'

export function useExportImport() {
  const exporting = ref(false)
  const importing = ref(false)
  const progress = ref(0)

  // 导出数据包
  const exportData = async (password) => {
    exporting.value = true
    progress.value = 0
    try {
      // 收集所有IndexedDB数据
      const dbData = await exportAllData()
      progress.value = 30
      
      // 收集localStorage数据
      const lsData = {}
      const keys = ['couple_info', 'app_settings', 'last_sync_time', 'checkin_streak']
      keys.forEach(key => {
        const val = uni.getStorageSync(key)
        if (val) lsData[key] = val
      })
      progress.value = 50
      
      // 组装数据包
      const dataPackage = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          localStorage: lsData,
          ...dbData
        }
      }
      progress.value = 70
      
      // 加密
      const encrypted = encrypt(dataPackage, password)
      progress.value = 90
      
      // 生成文件
      const fileContent = JSON.stringify(encrypted)
      
      // #ifdef H5
      const blob = new Blob([fileContent], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `couple_backup_${Date.now()}.couple`
      a.click()
      URL.revokeObjectURL(url)
      // #endif
      
      // #ifdef APP-PLUS
      const fileName = `_doc/couple_backup_${Date.now()}.couple`
      plus.io.resolveLocalFileSystemURL('_doc/', (entry) => {
        entry.getFile(fileName, { create: true }, (fileEntry) => {
          fileEntry.createWriter((writer) => {
            writer.write(fileContent)
            uni.showToast({ title: '导出成功', icon: 'success' })
          })
        })
      })
      // #endif
      
      progress.value = 100
      uni.setStorageSync('last_sync_time', new Date().toISOString())
      return true
    } catch (e) {
      console.error('导出失败:', e)
      uni.showToast({ title: '导出失败', icon: 'none' })
      return false
    } finally {
      exporting.value = false
    }
  }

  // 导入数据包
  const importData = async (filePath, password) => {
    importing.value = true
    progress.value = 0
    try {
      // 读取文件
      let fileContent = ''
      // #ifdef H5
      const response = await fetch(filePath)
      fileContent = await response.text()
      // #endif
      
      // #ifdef APP-PLUS
      fileContent = await new Promise((resolve, reject) => {
        plus.io.resolveLocalFileSystemURL(filePath, (entry) => {
          entry.file((file) => {
            const reader = new plus.io.FileReader()
            reader.onloadend = (e) => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsText(file)
          })
        }, reject)
      })
      // #endif
      
      progress.value = 30
      
      // 解密
      const encrypted = JSON.parse(fileContent)
      const dataPackage = decrypt(encrypted.ciphertext, password, encrypted.iv)
      progress.value = 60
      
      // 合并数据
      for (const [storeName, importRecords] of Object.entries(dataPackage.data)) {
        if (storeName === 'localStorage') continue
        if (!db[storeName]) continue
        
        const localRecords = []
        await db[storeName].iterate((value) => {
          localRecords.push(value)
        })
        
        const merged = mergeRecords(localRecords, importRecords)
        await db[storeName].clear()
        for (const record of merged) {
          await db[storeName].setItem(record.id, record)
        }
      }
      
      // 合并localStorage
      for (const [key, value] of Object.entries(dataPackage.data.localStorage || {})) {
        if (!uni.getStorageSync(key)) {
          uni.setStorageSync(key, value)
        }
      }
      
      progress.value = 100
      uni.setStorageSync('last_sync_time', new Date().toISOString())
      uni.showToast({ title: '导入成功', icon: 'success' })
      return true
    } catch (e) {
      console.error('导入失败:', e)
      uni.showToast({ title: '导入失败，请检查密码', icon: 'none' })
      return false
    } finally {
      importing.value = false
    }
  }

  return {
    exporting,
    importing,
    progress,
    exportData,
    importData
  }
}
