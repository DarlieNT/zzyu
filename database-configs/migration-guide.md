# 数据库迁移指南

## 迁移步骤

### 1. 选择数据库方案并安装依赖

```bash
# Vercel KV
npm install @vercel/kv

# Vercel Postgres  
npm install @vercel/postgres

# MongoDB Atlas
npm install mongodb

# Supabase
npm install @supabase/supabase-js
```

### 2. 配置环境变量

根据选择的方案，在 `.env.local` 中添加相应的数据库连接信息。

### 3. 替换API路由文件

#### 方案A: 替换现有API文件

```bash
# 备份现有文件
cp src/pages/api/lottery/attempts.ts src/pages/api/lottery/attempts.ts.backup
cp src/pages/api/lottery/spin.ts src/pages/api/lottery/spin.ts.backup
cp src/pages/api/lottery/my-codes.ts src/pages/api/lottery/my-codes.ts.backup

# 使用新的数据库实现替换
# (根据选择的方案复制相应的工具函数和API文件)
```

#### 方案B: 渐进式迁移

创建新的API路由并逐步迁移：

```bash
# 创建新的API路由
mkdir src/pages/api/lottery/v2
# 在v2目录下实现新的数据库逻辑
# 前端逐步切换到新的API端点
```

### 4. 数据迁移脚本

以下是从JSON文件迁移到各种数据库的脚本示例：