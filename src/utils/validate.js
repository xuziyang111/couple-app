// 数据校验工具
export function validateNickname(name) {
  if (!name || name.trim().length === 0) return '昵称不能为空'
  if (name.length > 20) return '昵称不能超过20个字符'
  return ''
}

export function validateDate(date) {
  if (!date) return '请选择日期'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '日期格式不正确'
  return ''
}

export function validateAmount(amount) {
  if (amount === '' || amount === null) return '请输入金额'
  const num = parseFloat(amount)
  if (isNaN(num)) return '金额必须是数字'
  if (num <= 0) return '金额必须大于0'
  return ''
}
