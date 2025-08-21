# Vercel Postgres 配置方案

## 1. 安装依赖

```bash
npm install @vercel/postgres
```

## 2. Vercel控制台配置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Storage" 选项卡
4. 点击 "Create Database"
5. 选择 "Postgres"
6. 创建数据库并记录连接信息

## 3. 环境变量配置

在 `.env.local` 中添加：

```env
# Vercel Postgres
POSTGRES_URL="your_postgres_url"
POSTGRES_PRISMA_URL="your_postgres_prisma_url"
POSTGRES_URL_NON_POOLING="your_postgres_url_non_pooling"
POSTGRES_USER="your_postgres_user"
POSTGRES_HOST="your_postgres_host"
POSTGRES_PASSWORD="your_postgres_password"
POSTGRES_DATABASE="your_postgres_database"
```

## 4. 数据库表结构

```sql
-- 用户抽奖记录表
CREATE TABLE lottery_attempts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    attempt_date DATE NOT NULL,
    attempts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, attempt_date)
);

-- 兑换码表
CREATE TABLE redemption_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    value INTEGER NOT NULL,
    prize_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- available, distributed, used
    user_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    distributed_at TIMESTAMP,
    used_at TIMESTAMP,
    INDEX idx_status_value (status, value),
    INDEX idx_user_id (user_id)
);

-- 抽奖历史表
CREATE TABLE lottery_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    prize_id INTEGER NOT NULL,
    prize_name VARCHAR(100) NOT NULL,
    prize_value INTEGER NOT NULL,
    redemption_code_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (redemption_code_id) REFERENCES redemption_codes(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

## 5. 初始化脚本

创建 `scripts/init-db.sql`：

```sql
-- 插入示例兑换码
INSERT INTO redemption_codes (code, value, prize_name) VALUES
('DEMO10A123456789', 10, '四等奖'),
('DEMO10B123456789', 10, '四等奖'),
('DEMO10C123456789', 10, '四等奖'),
('DEMO20A123456789', 20, '三等奖'),
('DEMO20B123456789', 20, '三等奖'),
('DEMO30A123456789', 30, '二等奖'),
('DEMO40A123456789', 40, '一等奖');
```