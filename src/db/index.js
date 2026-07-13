import localforage from 'localforage'

// 创建各个数据store实例
const createStores = () => {
  const config = {
    driver: localforage.INDEXEDDB,
    name: 'couple_app_db',
    version: 1
  }

  return {
    messages: localforage.createInstance({ ...config, storeName: 'messages' }),
    diaries: localforage.createInstance({ ...config, storeName: 'diaries' }),
    photos: localforage.createInstance({ ...config, storeName: 'photos' }),
    mediaBlobs: localforage.createInstance({ ...config, storeName: 'media_blobs' }),
    checkins: localforage.createInstance({ ...config, storeName: 'checkins' }),
    wishes: localforage.createInstance({ ...config, storeName: 'wishes' }),
    anniversaries: localforage.createInstance({ ...config, storeName: 'anniversaries' }),
    finances: localforage.createInstance({ ...config, storeName: 'finances' }),
    quizRecords: localforage.createInstance({ ...config, storeName: 'quiz_records' })
  }
}

const stores = createStores()

export const db = {
  messages: stores.messages,
  diaries: stores.diaries,
  photos: stores.photos,
  mediaBlobs: stores.mediaBlobs,
  checkins: stores.checkins,
  wishes: stores.wishes,
  anniversaries: stores.anniversaries,
  finances: stores.finances,
  quizRecords: stores.quizRecords
}

// 通用CRUD方法
export const createRecord = async (storeName, data) => {
  return await db[storeName].setItem(data.id, data)
}

export const getRecord = async (storeName, id) => {
  return await db[storeName].getItem(id)
}

export const updateRecord = async (storeName, id, data) => {
  return await db[storeName].setItem(id, data)
}

export const deleteRecord = async (storeName, id) => {
  return await db[storeName].removeItem(id)
}

export const getAllRecords = async (storeName) => {
  const records = []
  await db[storeName].iterate((value) => {
    records.push(value)
    return undefined
  })
  return records
}

export const clearStore = async (storeName) => {
  return await db[storeName].clear()
}

// 导出全部数据
export const exportAllData = async () => {
  const data = {}
  for (const [name, store] of Object.entries(db)) {
    data[name] = await getAllRecords(name)
  }
  return data
}

// 清空所有数据
export const clearAllData = async () => {
  for (const store of Object.values(db)) {
    await store.clear()
  }
}

export default db
