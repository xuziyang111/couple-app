import dayjs from 'dayjs'

// 计算恋爱天数
export function getLoveDays(startDate) {
  if (!startDate) return 0
  const start = dayjs(startDate)
  const now = dayjs()
  return now.diff(start, 'day') + 1
}

// 计算精确时间（天/时/分/秒）
export function getLoveTime(startDate) {
  if (!startDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const start = dayjs(startDate)
  const now = dayjs()
  const diff = now.diff(start, 'second')
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60
  }
}

// 纪念日倒计时
export function getCountdown(date) {
  const target = dayjs(date)
  const now = dayjs()
  const diff = target.diff(now, 'second')
  
  if (diff <= 0) {
    return { passed: true, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  
  return {
    passed: false,
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60
  }
}

// 日期格式化
export function formatDate(date, format = 'YYYY-MM-DD') {
  return dayjs(date).format(format)
}

export function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

export function formatTime(date) {
  return dayjs(date).format('HH:mm')
}

// 获取相对时间描述
export function getRelativeTime(date) {
  const d = dayjs(date)
  const now = dayjs()
  const diffMinutes = now.diff(d, 'minute')
  
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  const diffHours = now.diff(d, 'hour')
  if (diffHours < 24) return `${diffHours}小时前`
  const diffDays = now.diff(d, 'day')
  if (diffDays < 30) return `${diffDays}天前`
  return d.format('MM-DD')
}

// 判断是否今天
export function isToday(date) {
  return dayjs(date).isSame(dayjs(), 'day')
}

// 获取月份字符串
export function getMonthStr(date) {
  return dayjs(date).format('YYYY-MM')
}

// 获取连续打卡天数统计
export function calcStreak(records) {
  if (!records || records.length === 0) return 0
  const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date))
  let streak = 1
  for (let i = 1; i < sorted.length; i++) {
    const prev = dayjs(sorted[i - 1].date)
    const curr = dayjs(sorted[i].date)
    if (prev.diff(curr, 'day') === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}
