# 数据持久化说明

## 当前实现

当前的幸运大转盘系统使用本地JSON文件存储数据：

- `data/lottery-attempts.json` - 用户抽奖次数记录
- `data/redemption-codes.json` - 兑换码库存和发放记录

## 生产环境部署注意事项

⚠️ **重要提醒**: Vercel的serverless环境是无状态的，本地文件系统在每次部署后会重置。

### 推荐的生产解决方案：

1. **使用Vercel KV (Redis)**
   ```bash
   npm install @vercel/kv
   ```
   
2. **使用外部数据库**
   - MongoDB Atlas
   - PostgreSQL (PlanetScale, Supabase)
   - Firebase Firestore

3. **使用Vercel的Postgres**
   ```bash
   npm install @vercel/postgres
   ```

### 迁移步骤：

1. 选择数据存储方案
2. 修改API路由中的数据读写逻辑
3. 创建数据表/集合结构
4. 迁移现有数据

### 数据结构参考：

```sql
-- 用户抽奖记录表
CREATE TABLE lottery_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  attempt_date DATE NOT NULL,
  attempts_count INTEGER DEFAULT 0,
  UNIQUE(user_id, attempt_date)
);

-- 兑换码表
CREATE TABLE redemption_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  value INTEGER NOT NULL,
  prize_name VARCHAR(100) NOT NULL,
  status ENUM('available', 'distributed', 'used') DEFAULT 'available',
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  distributed_at TIMESTAMP,
  used_at TIMESTAMP
);
```

当前实现适用于开发和测试环境。