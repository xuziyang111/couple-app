<template>
  <view class="bind-page">
    <!-- 顶部装饰 -->
    <view class="bind-header">
      <text class="header-title">开启我们的故事</text>
      <text class="header-sub">创建或加入情侣空间</text>
      <view class="hearts-decoration">
        <text class="float-heart" v-for="i in 5" :key="i" :style="{ animationDelay: i * 0.3 + 's', left: i * 15 + '%' }">💕</text>
      </view>
    </view>

    <!-- 初始选择 -->
    <view v-if="step === 'init'" class="bind-content animate-fade-in">
      <view class="option-card" @click="goToSetup">
        <text class="option-icon">💝</text>
        <text class="option-title">创建情侣空间</text>
        <text class="option-desc">生成专属密钥，邀请TA加入</text>
      </view>
      <view class="option-card" @click="showJoin = true">
        <text class="option-icon">💌</text>
        <text class="option-title">加入情侣空间</text>
        <text class="option-desc">输入密钥或扫描二维码</text>
      </view>
    </view>

    <!-- 创建空间 - 先填写信息 -->
    <view v-if="step === 'setup'" class="bind-content animate-slide-up">
      <view class="form-section card">
        <text class="form-title">设置你的信息</text>
        <view class="form-item">
          <text class="form-label">你的昵称</text>
          <input class="form-input" v-model="myNickname" placeholder="输入昵称" />
        </view>
        <view class="form-item">
          <text class="form-label">恋爱开始日</text>
          <picker mode="date" @change="onDateChange">
            <view class="form-input date-picker">
              {{ loveStartDate || '选择日期' }}
            </view>
          </picker>
        </view>
        <GradientButton text="💝 创建情侣空间" @click="handleCreate" :disabled="!canCreate" class="mt-lg" />
      </view>
    </view>

    <!-- 创建成功 - 展示密钥并等待对方 -->
    <view v-if="step === 'create'" class="bind-content animate-slide-up">
      <view class="secret-display card">
        <text class="secret-label">你的专属密钥</text>
        <text class="secret-code">{{ secret }}</text>
        <text class="secret-tip">把这个密钥告诉TA，等待TA加入</text>
        <view class="qr-wrapper" v-if="qrCodeUrl">
          <image :src="qrCodeUrl" class="qr-image" mode="aspectFit" />
        </view>
      </view>
      <view class="waiting-card card" v-if="waitingPartner">
        <view class="waiting-spinner"></view>
        <text class="waiting-text">等待TA加入中...</text>
        <text class="waiting-sub">TA输入密钥后会自动配对</text>
      </view>
      <view class="waiting-card card" v-else-if="isConfigured()">
        <text class="waiting-text">📡 云端空间已创建</text>
        <text class="waiting-sub">等待TA输入密钥加入</text>
      </view>
    </view>

    <!-- 加入空间 -->
    <view v-if="showJoin" class="bind-content animate-slide-up">
      <view class="form-section card">
        <text class="form-title">输入密钥</text>
        <view class="secret-input-wrapper">
          <input class="secret-input" v-model="inputSecret" placeholder="输入6位密钥" maxlength="6" />
        </view>
        <view class="form-item mt-base">
          <text class="form-label">你的昵称</text>
          <input class="form-input" v-model="myNickname" placeholder="输入昵称" />
        </view>
        <view class="form-item">
          <text class="form-label">恋爱开始日</text>
          <picker mode="date" @change="onDateChange">
            <view class="form-input date-picker">
              {{ loveStartDate || '选择日期' }}
            </view>
          </picker>
        </view>
        <GradientButton text="加入空间" @click="handleJoin" :disabled="!canJoin" class="mt-lg" />
      </view>
    </view>

    <!-- 配对成功 -->
    <view v-if="step === 'done'" class="bind-content animate-bounce-in">
      <view class="success-card card">
        <text class="success-icon">🎉</text>
        <text class="success-title">配对成功！</text>
        <text class="success-desc">你们的情侣空间已创建</text>
        <GradientButton text="进入我们的世界" @click="goHome" class="mt-lg" />
      </view>
    </view>

    <!-- 错误提示 -->
    <view v-if="error" class="error-toast">
      <text>{{ error }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { usePairing } from '../../composables/usePairing'
import { useQrCode } from '../../composables/useQrCode'
import { useCloudSync } from '../../composables/useCloudSync'
import { isSupabaseConfigured } from '../../supabase/index'
import GradientButton from '../../components/common/GradientButton.vue'

const { step, secret, error, createSpace, joinSpace, completePairing, reset } = usePairing()
const { qrCodeUrl, generateQrCode } = useQrCode()
const { activateCoupleSync, cloudAuth, isConfigured } = useCloudSync()

const showJoin = ref(false)
const myNickname = ref('')
const loveStartDate = ref('')
const inputSecret = ref('')
const cloudLoading = ref(false)
const waitingPartner = ref(false)
let pollTimer = null

const canCreate = computed(() => myNickname.value.trim().length > 0 && loveStartDate.value)
const canJoin = computed(() => inputSecret.value.length === 6 && myNickname.value.trim().length > 0 && loveStartDate.value)

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

// 进入创建表单页
const goToSetup = () => {
  step.value = 'setup'
}

/**
 * 创建方流程：
 * 1. 本地保存配对信息
 * 2. 云端创建空间
 * 3. 激活实时监听
 * 4. 轮询等待对方加入
 */
const handleCreate = async () => {
  console.log('========== [Bind] handleCreate 开始执行 ==========')
  console.log('[Bind] step:', step.value)
  console.log('[Bind] myNickname:', myNickname.value)
  console.log('[Bind] loveStartDate:', loveStartDate.value)
  
  // 1. 生成密钥，进入密钥展示页
  createSpace() // step → 'create', secret 已生成
  console.log('[Bind] createSpace() 后 step:', step.value, ', secret:', secret.value)

  // 2. 保存本地配对信息（不调用 completePairing，因为它会把 step 设为 'done'）
  console.log('[Bind] 开始保存本地配对信息...')
  const { useCoupleStore } = await import('../../stores/couple')
  const { generateCoupleId, generateUserId } = await import('../../utils/id')
  const { hashSecret } = await import('../../utils/secret')
  const coupleStore = useCoupleStore()

  const coupleId = generateCoupleId()
  const userId = generateUserId()

  coupleStore.setCoupleInfo({
    coupleId,
    pairSecretHash: hashSecret(secret.value),
    loveStartDate: loveStartDate.value,
    me: {
      nickname: myNickname.value,
      avatar: '',
      userId,
      role: 'creator'
    },
    partner: {
      nickname: '',
      avatar: '',
      userId: '',
      role: 'joiner'
    }
  })

  // 确保 step 停留在 'create'（展示密钥）
  step.value = 'create'
  console.log('[Bind] 本地配对信息已保存, coupleId:', coupleStore.coupleId)

  try {
    console.log('[Bind] 开始生成二维码...')
    await generateQrCode(secret.value)
    console.log('[Bind] 二维码生成完成')
  } catch (e) {
    console.log('QR code generation skipped')
  }

  // 3. 如果配置了 LeanCloud，创建云端空间
  console.log('[Bind] isConfigured():', isConfigured())
  if (isConfigured()) {
    cloudLoading.value = true
    console.log('[Bind] 开始创建云端空间...')
    try {
      const cloudCouple = await cloudAuth.createCoupleSpace({
        coupleId: coupleStore.coupleId,
        secretHash: hashSecret(secret.value),
        me: {
          userId: coupleStore.myInfo.userId,
          nickname: myNickname.value,
          avatar: ''
        },
        loveStartDate: loveStartDate.value
      })
      console.log('[Bind] 云端空间已创建，等待对方加入...')
      console.log('[Bind] cloudCouple:', cloudCouple)

      // 4. 激活实时同步（监听 Couple 记录变化）
      await activateCoupleSync(coupleStore.coupleId)

      // 5. 开始轮询等待对方加入
      waitingPartner.value = true
      startPollingPartner(coupleStore.coupleId)
    } catch (e) {
      console.warn('[Bind] 云端创建失败，继续使用本地模式:', e)
    }
    cloudLoading.value = false
  }
}

/**
 * 轮询检查对方是否已加入
 * 每3秒查一次云端 Couple 记录，看 partner 是否已填充
 */
const startPollingPartner = (coupleId) => {
  if (pollTimer) clearInterval(pollTimer)
  
  pollTimer = setInterval(async () => {
    try {
      const coupleData = await cloudAuth.getCoupleCloudData(coupleId)
      if (coupleData && coupleData.partner) {
        // 对方已加入！
        clearInterval(pollTimer)
        pollTimer = null
        waitingPartner.value = false
        
        // 更新本地 store 的 partner 信息
        const { useCoupleStore } = await import('../../stores/couple')
        const coupleStore = useCoupleStore()
        coupleStore.updatePartnerInfo({
          nickname: coupleData.partner.nickname,
          avatar: coupleData.partner.avatar || '',
          userId: coupleData.partner.userId
        })
        
        console.log('[Bind] 对方已加入！配对完成')
        uni.showToast({ title: 'TA已加入！', icon: 'success' })
        
        // 延迟跳转
        setTimeout(() => {
          step.value = 'done'
        }, 1000)
      }
    } catch (e) {
      console.warn('[Bind] 轮询出错:', e)
    }
  }, 3000)
}

/**
 * 加入方流程：
 * 1. 先加入云端空间（获取创建方信息 + coupleId）
 * 2. 用云端返回的创建方信息完成本地配对
 * 3. 激活实时同步
 * 
 * 关键：云端加入必须成功，否则不允许完成配对
 */
const handleJoin = async () => {
  // 验证密钥格式
  const localValid = joinSpace(inputSecret.value)
  if (!localValid) return

  cloudLoading.value = true

  // 必须成功加入云端空间才能继续
  let cloudCouple = null
  let creatorInfo = null
  let cloudCoupleId = null

  try {
    const { hashSecret } = await import('../../utils/secret')
    
    // 加入云端空间
    cloudCouple = await cloudAuth.joinCoupleSpace({
      secretHash: hashSecret(inputSecret.value),
      me: {
        userId: '',
        nickname: myNickname.value,
        avatar: ''
      }
    })
    
    if (!cloudCouple) {
      // LeanCloud 未配置时的友好提示
      if (!isConfigured()) {
        throw new Error('实时同步功能未开启')
      }
      throw new Error('云端空间不存在或已被占用')
    }
    
    // 提取创建方信息
    console.log('[Bind] cloudCouple 数据结构:', cloudCouple)
    const meData = cloudCouple.me || cloudCouple.get?.('me')
    if (meData) {
      creatorInfo = {
        nickname: meData.nickname,
        avatar: meData.avatar || '',
        userId: meData.userId
      }
    }
    
    // 获取云端的 coupleId（Supabase 使用 snake_case）
    cloudCoupleId = cloudCouple.couple_id || cloudCouple.get?.('coupleId') || cloudCouple.coupleId
    
    // 获取创建方的 loveStartDate（Supabase 返回 snake_case）
    const cloudLoveDate = cloudCouple.love_start_date || cloudCouple.get?.('love_start_date') || cloudCouple.loveStartDate || cloudCouple.get?.('loveStartDate')
    if (cloudLoveDate && !loveStartDate.value) {
      loveStartDate.value = cloudLoveDate
    }
    
    console.log('[Bind] 已加入云端空间 ✓', { creatorInfo, cloudCoupleId })
  } catch (e) {
    console.error('[Bind] 云端加入失败:', e)
    cloudLoading.value = false
    
    // 根据错误类型显示不同提示
    let errorMsg = e.message || '密钥无效或已过期'
    if (errorMsg === '实时同步功能未开启') {
      errorMsg = '实时同步功能未开启\n（配置 LeanCloud 后可使用）'
    }
    
    uni.showToast({ title: errorMsg, icon: 'none' })
    // 重置 step 回到加入表单
    step.value = 'init'
    showJoin.value = true
    return // 不允许继续
  }

  // 云端加入成功，才能完成本地配对
  const success = await completePairingWithCreator({
    nickname: myNickname.value,
    loveStartDate: loveStartDate.value
  }, creatorInfo, cloudCoupleId)

  cloudLoading.value = false

  if (success) {
    // 激活实时同步
    try {
      const { useCoupleStore } = await import('../../stores/couple')
      const coupleStore = useCoupleStore()
      await activateCoupleSync(coupleStore.coupleId)
      console.log('[Bind] 实时同步已激活 ✓')
    } catch (e) {
      console.warn('[Bind] 激活同步失败:', e)
    }
    uni.showToast({ title: '配对成功！', icon: 'success' })
  }
}

/**
 * 完成配对（必须从云端获取创建方信息）
 */
const completePairingWithCreator = async (myInfo, creatorInfo, cloudCoupleId) => {
  const { useCoupleStore } = await import('../../stores/couple')
  const { generateUserId } = await import('../../utils/id')
  const { hashSecret } = await import('../../utils/secret')
  const coupleStore = useCoupleStore()

  // 必须使用云端的 coupleId，保证双方一致
  const coupleId = cloudCoupleId
  if (!coupleId) {
    console.error('[Bind] 缺少 coupleId，无法完成配对')
    return false
  }

  const userId = generateUserId()

  const pairingData = {
    coupleId,
    pairSecretHash: hashSecret(inputSecret.value || secret.value),
    loveStartDate: myInfo.loveStartDate || new Date().toISOString().split('T')[0],
    me: {
      nickname: myInfo.nickname,
      avatar: myInfo.avatar || '',
      userId,
      role: 'joiner'
    },
    partner: creatorInfo ? {
      nickname: creatorInfo.nickname,
      avatar: creatorInfo.avatar || '',
      userId: creatorInfo.userId,
      role: 'creator'
    } : {
      nickname: '',
      avatar: '',
      userId: '',
      role: 'creator'
    }
  }

  coupleStore.setCoupleInfo(pairingData)
  step.value = 'done'
  return true
}

const onDateChange = (e) => {
  loveStartDate.value = e.detail.value
}

const goHome = () => {
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<style lang="scss" scoped>
.bind-page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: 0 40rpx;
  padding-top: calc(120rpx + constant(safe-area-inset-top));
  padding-top: calc(120rpx + env(safe-area-inset-top));
  padding-bottom: calc(40rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.bind-header {
  text-align: center;
  margin-bottom: 60rpx;
  position: relative;
  
  .header-title {
    font-size: 48rpx;
    font-weight: bold;
    color: var(--color-text);
    display: block;
  }
  
  .header-sub {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin-top: 10rpx;
    display: block;
  }
  
  .hearts-decoration {
    position: absolute;
    top: -40rpx;
    left: 0;
    right: 0;
    height: 100rpx;
    pointer-events: none;
    
    .float-heart {
      position: absolute;
      font-size: 30rpx;
      animation: floatHeart 3s ease-out infinite;
    }
  }
}

.bind-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.option-card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 40rpx;
  text-align: center;
  
  .option-icon {
    font-size: 80rpx;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .option-title {
    font-size: var(--font-size-lg);
    font-weight: bold;
    color: var(--color-text);
    display: block;
    margin-bottom: 10rpx;
  }
  
  .option-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: block;
  }
}

.card {
  background: var(--color-card);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  padding: 30rpx;
}

.secret-display {
  text-align: center;
  
  .secret-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: 16rpx;
  }
  
  .secret-code {
    font-size: 64rpx;
    font-weight: bold;
    color: var(--color-primary);
    letter-spacing: 12rpx;
    display: block;
    margin: 20rpx 0;
  }
  
  .secret-tip {
    font-size: var(--font-size-sm);
    color: var(--color-text-light);
    display: block;
  }
  
  .qr-wrapper {
    margin-top: 30rpx;
    display: flex;
    justify-content: center;
    
    .qr-image {
      width: 300rpx;
      height: 300rpx;
    }
  }
}

.form-section {
  .form-title {
    font-size: var(--font-size-lg);
    font-weight: bold;
    color: var(--color-text);
    display: block;
    margin-bottom: 24rpx;
  }
}

.form-item {
  margin-bottom: 20rpx;
  
  .form-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    display: block;
    margin-bottom: 8rpx;
  }
  
  .form-input {
    background: var(--color-bg);
    border-radius: var(--radius-input);
    padding: 20rpx 24rpx;
    font-size: var(--font-size-base);
    color: var(--color-text);
  }
  
  .date-picker {
    color: var(--color-text-light);
  }
}

.secret-input-wrapper {
  display: flex;
  justify-content: center;
  
  .secret-input {
    background: var(--color-bg);
    border-radius: var(--radius-input);
    padding: 24rpx;
    font-size: 48rpx;
    font-weight: bold;
    color: var(--color-primary);
    text-align: center;
    letter-spacing: 16rpx;
    width: 100%;
  }
}

.success-card {
  text-align: center;
  padding: 60rpx 40rpx;
  
  .success-icon {
    font-size: 120rpx;
    display: block;
    margin-bottom: 20rpx;
  }
  
  .success-title {
    font-size: var(--font-size-xl);
    font-weight: bold;
    color: var(--color-text);
    display: block;
    margin-bottom: 10rpx;
  }
  
  .success-desc {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    display: block;
  }
}

.error-toast {
  position: fixed;
  bottom: 100rpx;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-error);
  color: #fff;
  padding: 16rpx 32rpx;
  border-radius: var(--radius-button);
  font-size: var(--font-size-sm);
}

.waiting-card {
  text-align: center;
  padding: 30rpx;
}

.waiting-spinner {
  width: 40rpx;
  height: 40rpx;
  border: 4rpx solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16rpx;
}

.waiting-text {
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--color-primary);
  display: block;
  margin-bottom: 8rpx;
}

.waiting-sub {
  font-size: var(--font-size-sm);
  color: var(--color-text-light);
  display: block;
}
</style>
