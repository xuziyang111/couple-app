import { ref } from 'vue'
import { useCoupleStore } from '../stores/couple'
import { generateSecret, validateSecret, hashSecret } from '../utils/secret'
import { generateCoupleId, generateUserId } from '../utils/id'

export function usePairing() {
  const step = ref('init') // init | create | join | setup | done
  const secret = ref('')
  const loading = ref(false)
  const error = ref('')

  // 创建情侣空间
  const createSpace = () => {
    const newSecret = generateSecret()
    secret.value = newSecret
    step.value = 'create'
    return newSecret
  }

  // 加入情侣空间
  const joinSpace = (inputSecret) => {
    if (!validateSecret(inputSecret)) {
      error.value = '密钥格式不正确，请输入6位字母数字组合'
      return false
    }
    secret.value = inputSecret.toUpperCase()
    step.value = 'join'
    return true
  }

  // 完成配对
  const completePairing = (myInfo, isCreator) => {
    loading.value = true
    try {
      const coupleStore = useCoupleStore()
      const coupleId = generateCoupleId()
      const userId = generateUserId()
      
      const pairingData = {
        coupleId,
        pairSecretHash: hashSecret(secret.value),
        loveStartDate: myInfo.loveStartDate || new Date().toISOString().split('T')[0],
        me: {
          nickname: myInfo.nickname,
          avatar: myInfo.avatar || '',
          userId
        },
        partner: {
          nickname: '',
          avatar: '',
          userId: ''
        }
      }

      if (isCreator) {
        // 创建方：保存自己的信息，等待对方加入
        pairingData.me = { ...pairingData.me, role: 'creator' }
        uni.setStorageSync('pending_pair', JSON.stringify(pairingData))
      } else {
        // 加入方：读取创建方信息
        const pending = uni.getStorageSync('pending_pair')
        if (pending) {
          const creatorData = JSON.parse(pending)
          pairingData.partner = creatorData.me
          pairingData.me.role = 'joiner'
          pairingData.coupleId = creatorData.coupleId
          uni.removeStorageSync('pending_pair')
        }
      }

      coupleStore.setCoupleInfo(pairingData)
      step.value = 'done'
      return true
    } catch (e) {
      error.value = '配对失败，请重试'
      return false
    } finally {
      loading.value = false
    }
  }

  // 重置
  const reset = () => {
    step.value = 'init'
    secret.value = ''
    error.value = ''
    loading.value = false
  }

  return {
    step,
    secret,
    loading,
    error,
    createSpace,
    joinSpace,
    completePairing,
    reset
  }
}
