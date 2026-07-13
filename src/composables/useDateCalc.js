import { ref } from 'vue'

export function useDateCalc(loveStartDate) {
  const loveDays = ref(0)
  const loveTime = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  let timer = null

  const calcLoveDays = (startDate) => {
    if (!startDate) return 0
    const start = new Date(startDate).getTime()
    const now = Date.now()
    return Math.floor((now - start) / 86400000) + 1
  }

  const calcLoveTime = (startDate) => {
    if (!startDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    const start = new Date(startDate).getTime()
    const now = Date.now()
    const diff = Math.floor((now - start) / 1000)
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60
    }
  }

  const calcCountdown = (targetDate) => {
    const target = new Date(targetDate).getTime()
    const now = Date.now()
    const diff = target - now
    if (diff <= 0) return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      passed: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    }
  }

  const startTimer = (startDate) => {
    stopTimer()
    loveDays.value = calcLoveDays(startDate)
    loveTime.value = calcLoveTime(startDate)
    timer = setInterval(() => {
      loveDays.value = calcLoveDays(startDate)
      loveTime.value = calcLoveTime(startDate)
    }, 1000)
  }

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  return {
    loveDays,
    loveTime,
    calcLoveDays,
    calcLoveTime,
    calcCountdown,
    startTimer,
    stopTimer
  }
}
