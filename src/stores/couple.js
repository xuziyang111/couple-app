import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCoupleStore = defineStore('couple', () => {
  // 情侣信息
  const coupleInfo = ref(null)
  // 绑定状态
  const isPaired = ref(false)
  // 自己的信息
  const myInfo = ref({
    nickname: '',
    avatar: '',
    userId: ''
  })
  // 对方的信息
  const partnerInfo = ref({
    nickname: '',
    avatar: '',
    userId: ''
  })
  // 恋爱开始日期
  const loveStartDate = ref('')
  // 配对密钥hash
  const pairSecretHash = ref('')
  // 情侣ID
  const coupleId = ref('')

  // 计算属性
  const isBound = computed(() => isPaired.value && coupleInfo.value !== null)
  const bothNames = computed(() => {
    return `${myInfo.value.nickname} & ${partnerInfo.value.nickname}`
  })

  // 设置情侣信息
  const setCoupleInfo = (info) => {
    coupleInfo.value = info
    isPaired.value = true
    myInfo.value = info.me || myInfo.value
    partnerInfo.value = info.partner || partnerInfo.value
    loveStartDate.value = info.loveStartDate || ''
    pairSecretHash.value = info.pairSecretHash || ''
    coupleId.value = info.coupleId || ''
  }

  // 更新我的信息
  const updateMyInfo = (info) => {
    myInfo.value = { ...myInfo.value, ...info }
    if (coupleInfo.value) {
      coupleInfo.value.me = myInfo.value
    }
  }

  // 更新对方信息
  const updatePartnerInfo = (info) => {
    partnerInfo.value = { ...partnerInfo.value, ...info }
    if (coupleInfo.value) {
      coupleInfo.value.partner = partnerInfo.value
    }
  }

  // 解绑
  const unbind = () => {
    coupleInfo.value = null
    isPaired.value = false
    myInfo.value = { nickname: '', avatar: '', userId: '' }
    partnerInfo.value = { nickname: '', avatar: '', userId: '' }
    loveStartDate.value = ''
    pairSecretHash.value = ''
    coupleId.value = ''
    uni.removeStorageSync('couple_info')
  }

  return {
    coupleInfo,
    isPaired,
    myInfo,
    partnerInfo,
    loveStartDate,
    pairSecretHash,
    coupleId,
    isBound,
    bothNames,
    setCoupleInfo,
    updateMyInfo,
    updatePartnerInfo,
    unbind
  }
}, {
  unistorage: {
    paths: ['coupleInfo', 'isPaired', 'myInfo', 'partnerInfo', 'loveStartDate', 'pairSecretHash', 'coupleId']
  }
})
