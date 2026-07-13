# 🚀 Supabase 快速配置指南（3分钟完成）

##  当前状态

你的情侣APP已经集成 **Supabase**，但目前处于**纯本地模式**（数据不同步）。  
要开启**实时同步功能**，只需完成以下 3 个步骤：

---

##  第一步：注册 Supabase（1分钟）

1. 访问 [https://supabase.com/](https://supabase.com/)
2. 点击 **"Start your project"** → 用 GitHub 或邮箱注册（免费）
3. 创建新项目：
   - **Project name**: `couple-app`
   - **Database Password**: 设置一个强密码（**记下来！**）
   - **Region**: 选择 `Singapore` 或 `Tokyo`（离中国近）
4. 等待 2-3 分钟初始化完成

---

## 🔑 第二步：获取配置信息（30秒）

项目创建完成后：

1. 左侧菜单 → **"Settings"** → **"API"**
2. 复制这两个值：
   - ✅ **Project URL**: `https://xxxxx.supabase.co`
   - ✅ **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## ⚙️ 第三步：填入配置文件（30秒）

打开 [`src/supabase/index.js`](./src/supabase/index.js)，修改第 15-16 行：

```javascript
// 替换为你的实际配置
const SUPABASE_URL = 'https://你的项目ID.supabase.co'
const SUPABASE_ANON_KEY = '你的anon密钥'
```

保存文件后，刷新浏览器页面即可！

---

## ️ 第四步：创建数据库表（2分钟）

### 方法一：一键执行 SQL（推荐）

1. 左侧菜单 → **"SQL Editor"**
2. 点击 **"New query"**
3. 复制 [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) 中的完整 SQL 脚本
4. 粘贴并点击 **"Run"** 执行

### 方法二：手动创建表

参考 [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) 中的表结构说明

---

## ✅ 验证成功

刷新应用后，查看浏览器控制台：

- ✅ 看到 `[Supabase] 初始化成功`
- ✅ 看到 `[CloudSync] 云端连接成功`
- ✅ 创建/加入情侣空间时不再提示"实时同步功能未开启"

---

## 🎉 完成！

现在你和另一半可以：
- 💬 聊天消息实时同步
- 📸 照片、日记、打卡等所有数据秒级更新
- 👫 一方添加数据，另一方立即收到通知
- 💰 **完全免费**（Supabase 免费版足够情侣使用）

---

## ❓ 遇到问题？

查看详细配置指南：[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

常见问题：
- **Q: 超出免费额度怎么办？**  
  A: 免费版提供 500MB 存储 + 2GB 带宽/月，日常使用完全够用
  
- **Q: 数据安全吗？**  
  A: 是的！所有数据传输都经过 HTTPS 加密，且设置了 RLS 行级安全策略

- **Q: 如何备份数据？**  
  A: 左侧菜单 → "Database" → "Backups" → 创建备份

---

## 🔄 从 LeanCloud 迁移

如果你之前使用的是 LeanCloud（国内版已停止新用户注册），代码已自动切换到 Supabase。  
旧的 LeanCloud 代码保留在 `src/cloud-backup/` 目录作为参考，可以删除。
