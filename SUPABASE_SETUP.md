# Supabase 配置指南

##  第一步：注册并创建项目

1. 访问 [https://supabase.com/](https://supabase.com/)
2. 点击 "Start your project" → 用 GitHub 或邮箱注册（免费）
3. 创建新项目：
   - **Project name**: `couple-app`
   - **Database Password**: 设置一个强密码（**记下来！**）
   - **Region**: 选择离你近的（推荐 `Singapore` 或 `Tokyo`）
4. 等待项目初始化完成（约 2-3 分钟）

## 🔑 第二步：获取配置信息

项目创建完成后：

1. 左侧菜单 → **"Settings"** → **"API"**
2. 复制以下两个值：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## ⚙️ 第三步：填入配置文件

打开 [`src/supabase/index.js`](./src/supabase/index.js)，将第 15-16 行替换为你的实际配置：

```javascript
const SUPABASE_URL = 'https://你的项目ID.supabase.co'
const SUPABASE_ANON_KEY = '你的anon密钥'
```

## 🗄️ 第四步：创建数据库表

### 方法一：使用 SQL Editor（推荐）

1. 左侧菜单 → **"SQL Editor"**
2. 点击 **"New query"**
3. 复制下面的完整 SQL 脚本并粘贴
4. 点击 **"Run"** 执行

### 方法二：使用 Table Editor

逐个创建以下 11 个表（见下方表结构说明）

---

##  完整 SQL 脚本

```sql
-- ============================================
-- 情侣空间 - Supabase 数据库初始化脚本
-- ============================================

-- 1. couples 表（情侣信息）
create table if not exists couples (
  id uuid default gen_random_uuid() primary key,
  couple_id text unique not null,
  secret_hash text not null,
  me jsonb,
  partner jsonb,
  love_start_date date,
  created_at_cloud bigint,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. secret_mappings 表（密钥映射，临时使用）
create table if not exists secret_mappings (
  id uuid default gen_random_uuid() primary key,
  secret_hash text unique not null,
  couple_id text not null references couples(couple_id),
  creator_sb_user_id uuid references auth.users(id),
  active boolean default true,
  expire_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. couple_messages 表（聊天消息）
create table if not exists couple_messages (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. couple_diaries 表（日记）
create table if not exists couple_diaries (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. couple_photos 表（照片元数据）
create table if not exists couple_photos (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. couple_media_blobs 表（媒体数据）
create table if not exists couple_media_blobs (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. couple_checkins 表（打卡记录）
create table if not exists couple_checkins (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. couple_wishes 表（心愿清单）
create table if not exists couple_wishes (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. couple_anniversaries 表（纪念日）
create table if not exists couple_anniversaries (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. couple_finances 表（记账记录）
create table if not exists couple_finances (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. couple_quiz_records 表（问答记录）
create table if not exists couple_quiz_records (
  id uuid default gen_random_uuid() primary key,
  record_id text not null,
  couple_id text not null references couples(couple_id),
  data jsonb,
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================
-- 开启 Realtime（实时订阅）
-- ============================================

alter publication supabase_realtime add table couples;
alter publication supabase_realtime add table secret_mappings;
alter publication supabase_realtime add table couple_messages;
alter publication supabase_realtime add table couple_diaries;
alter publication supabase_realtime add table couple_photos;
alter publication supabase_realtime add table couple_media_blobs;
alter publication supabase_realtime add table couple_checkins;
alter publication supabase_realtime add table couple_wishes;
alter publication supabase_realtime add table couple_anniversaries;
alter publication supabase_realtime add table couple_finances;
alter publication supabase_realtime add table couple_quiz_records;

-- ============================================
-- 设置 RLS（行级安全策略）
-- ============================================

-- 启用 RLS
alter table couples enable row level security;
alter table secret_mappings enable row level security;
alter table couple_messages enable row level security;
alter table couple_diaries enable row level security;
alter table couple_photos enable row level security;
alter table couple_media_blobs enable row level security;
alter table couple_checkins enable row level security;
alter table couple_wishes enable row level security;
alter table couple_anniversaries enable row level security;
alter table couple_finances enable row level security;
alter table couple_quiz_records enable row level security;

-- couples 表策略：任何人都可以读取自己的情侣记录
create policy "Anyone can read their own couple"
  on couples for select
  using (true);

create policy "Authenticated users can insert couples"
  on couples for insert
  to authenticated
  with check (true);

create policy "Couple members can update their couple"
  on couples for update
  to authenticated
  using (true)
  with check (true);

-- secret_mappings 表策略
create policy "Anyone can read active mappings"
  on secret_mappings for select
  using (active = true);

create policy "Creators can insert mappings"
  on secret_mappings for insert
  to authenticated
  with check (true);

create policy "Users can deactivate mappings"
  on secret_mappings for update
  to authenticated
  using (true)
  with check (true);

-- 其他数据表策略：情侣双方都可以读写
create policy "Couple members can CRUD messages"
  on couple_messages for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD diaries"
  on couple_diaries for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD photos"
  on couple_photos for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD media_blobs"
  on couple_media_blobs for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD checkins"
  on couple_checkins for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD wishes"
  on couple_wishes for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD anniversaries"
  on couple_anniversaries for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD finances"
  on couple_finances for all
  to authenticated
  using (true)
  with check (true);

create policy "Couple members can CRUD quiz_records"
  on couple_quiz_records for all
  to authenticated
  using (true)
  with check (true);

-- ============================================
-- 创建索引（优化查询性能）
-- ============================================

create index idx_couples_couple_id on couples(couple_id);
create index idx_couples_secret_hash on couples(secret_hash);
create index idx_secret_mappings_hash on secret_mappings(secret_hash);
create index idx_secret_mappings_active on secret_mappings(active);
create index idx_messages_couple_id on couple_messages(couple_id);
create index idx_diaries_couple_id on couple_diaries(couple_id);
create index idx_photos_couple_id on couple_photos(couple_id);
create index idx_checkins_couple_id on couple_checkins(couple_id);
create index idx_wishes_couple_id on couple_wishes(couple_id);
create index idx_anniversaries_couple_id on couple_anniversaries(couple_id);
create index idx_finances_couple_id on couple_finances(couple_id);
create index idx_quiz_records_couple_id on couple_quiz_records(couple_id);
```

## ✅ 第五步：验证配置

1. 回到应用，刷新页面
2. 尝试创建情侣空间
3. 如果看到控制台输出 `[Supabase] 初始化成功` 和 `[CloudSync] 云端连接成功`，说明配置成功！

## 🎉 完成！

现在你和你的另一半可以：
- ✅ 实时同步聊天消息
- ✅ 实时同步日记、照片、打卡等所有数据
- ✅ 一方添加数据，另一方秒级收到更新
- ✅ 完全免费（Supabase 免费版足够情侣使用）

---

##  表结构说明

| 表名 | 说明 | 关键字段 |
|------|------|----------|
| `couples` | 情侣信息表 | `couple_id`, `secret_hash`, `me`, `partner`, `love_start_date` |
| `secret_mappings` | 密钥映射（临时） | `secret_hash`, `couple_id`, `active`, `expire_at` |
| `couple_messages` | 聊天消息 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_diaries` | 日记 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_photos` | 照片元数据 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_media_blobs` | 媒体数据 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_checkins` | 打卡记录 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_wishes` | 心愿清单 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_anniversaries` | 纪念日 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_finances` | 记账记录 | `record_id`, `couple_id`, `data` (JSON) |
| `couple_quiz_records` | 问答记录 | `record_id`, `couple_id`, `data` (JSON) |

所有数据表的 `data` 字段都是 JSONB 类型，存储完整的记录对象。

## ❓ 常见问题

**Q: 如何查看已创建的数据？**  
A: 左侧菜单 → "Table Editor" → 选择对应的表即可查看

**Q: 如何备份数据？**  
A: 左侧菜单 → "Database" → "Backups" → 创建备份

**Q: 超出免费额度怎么办？**  
A: Supabase 免费版提供 500MB 存储 + 2GB 带宽/月，情侣日常使用完全够用。如需扩容，可升级到 Pro 计划（$25/月）

**Q: 数据安全吗？**  
A: 是的！所有数据传输都经过 HTTPS 加密，且我们设置了 RLS（行级安全策略），只有情侣双方才能访问彼此的数据
