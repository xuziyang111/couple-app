// 数据合并去重算法
export function mergeRecords(localData, importData) {
  const merged = {}
  const localMap = new Map(localData.map(r => [r.id, r]))
  const importMap = new Map(importData.map(r => [r.id, r]))
  const allIds = new Set([...localMap.keys(), ...importMap.keys()])

  for (const id of allIds) {
    const local = localMap.get(id)
    const imported = importMap.get(id)
    if (!local) {
      merged[id] = imported
    } else if (!imported) {
      merged[id] = local
    } else {
      const localTime = new Date(local.updatedAt || local.createdAt || 0).getTime()
      const importTime = new Date(imported.updatedAt || imported.createdAt || 0).getTime()
      merged[id] = importTime >= localTime ? imported : local
    }
  }
  return Object.values(merged)
}

// 合并localStorage数据
export function mergeLocalStorage(localLS, importLS) {
  const result = { ...localLS }
  for (const [key, value] of Object.entries(importLS)) {
    if (!result[key]) {
      result[key] = value
    }
  }
  return result
}
