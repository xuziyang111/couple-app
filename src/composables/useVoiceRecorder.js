import { ref } from 'vue'

export function useVoiceRecorder() {
  const isRecording = ref(false)
  const recorderManager = ref(null)
  const currentRecordPath = ref('')
  const duration = ref(0)
  let timer = null

  const initRecorder = () => {
    if (recorderManager.value) return
    recorderManager.value = uni.getRecorderManager()
    
    recorderManager.value.onStart(() => {
      isRecording.value = true
      duration.value = 0
      timer = setInterval(() => {
        duration.value++
      }, 1000)
    })
    
    recorderManager.value.onStop((res) => {
      isRecording.value = false
      clearInterval(timer)
      currentRecordPath.value = res.tempFilePath
    })
    
    recorderManager.value.onError((err) => {
      isRecording.value = false
      clearInterval(timer)
      console.error('录音错误:', err)
    })
  }

  const startRecord = () => {
    initRecorder()
    recorderManager.value.start({
      duration: 60000, // 最长60秒
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 48000,
      format: 'mp3'
    })
  }

  const stopRecord = () => {
    if (recorderManager.value && isRecording.value) {
      recorderManager.value.stop()
    }
  }

  const cancelRecord = () => {
    if (recorderManager.value && isRecording.value) {
      recorderManager.value.stop()
      currentRecordPath.value = ''
    }
  }

  const playVoice = (filePath) => {
    const innerAudioContext = uni.createInnerAudioContext()
    innerAudioContext.src = filePath
    innerAudioContext.play()
    return innerAudioContext
  }

  return {
    isRecording,
    currentRecordPath,
    duration,
    startRecord,
    stopRecord,
    cancelRecord,
    playVoice
  }
}
