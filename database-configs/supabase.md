# Supabase 配置方案

## 1. 安装依赖

```bash
npm install @supabase/supabase-js
```

## 2. Supabase 项目设置

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 记录项目URL和API密钥
4. 在SQL编辑器中创建表结构

## 3. 环境变量配置

在 `.env.local` 中添加：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
```

## 4. 数据库表结构 (SQL)

在Supabase的SQL编辑器中执行：

```sql
-- 启用行级安全策略
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户抽奖记录表
CREATE TABLE lottery_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    attempt_date DATE NOT NULL,
    attempts_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, attempt_date)
);

-- 兑换码表
CREATE TABLE redemption_codes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    value INTEGER NOT NULL,
    prize_name TEXT NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'distributed', 'used')),
    user_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    distributed_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE
);

-- 抽奖历史表
CREATE TABLE lottery_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT NOT NULL,
    prize_id INTEGER NOT NULL,
    prize_name TEXT NOT NULL,
    prize_value INTEGER NOT NULL,
    redemption_code_id UUID REFERENCES redemption_codes(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_lottery_attempts_user_date ON lottery_attempts(user_id, attempt_date);
CREATE INDEX idx_redemption_codes_status_value ON redemption_codes(status, value);
CREATE INDEX idx_redemption_codes_user_id ON redemption_codes(user_id);
CREATE INDEX idx_lottery_history_user_id ON lottery_history(user_id);

-- 插入示例数据
INSERT INTO redemption_codes (code, value, prize_name) VALUES
('DEMO10A123456789', 10, '四等奖'),
('DEMO10B123456789', 10, '四等奖'),
('DEMO10C123456789', 10, '四等奖'),
('DEMO20A123456789', 20, '三等奖'),
('DEMO20B123456789', 20, '三等奖'),
('DEMO30A123456789', 30, '二等奖'),
('DEMO40A123456789', 40, '一等奖');
```

## 5. 行级安全策略 (RLS)

```sql
-- 启用RLS
ALTER TABLE lottery_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_history ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能查看自己的抽奖记录
CREATE POLICY "Users can view own attempts" ON lottery_attempts FOR SELECT USING (true);
CREATE POLICY "Users can insert own attempts" ON lottery_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own attempts" ON lottery_attempts FOR UPDATE USING (true);

-- 策略：用户只能查看分配给自己的兑换码
CREATE POLICY "Users can view own codes" ON redemption_codes FOR SELECT USING (user_id IS NULL OR user_id = auth.jwt() ->> 'sub');

-- 策略：用户只能查看自己的抽奖历史
CREATE POLICY "Users can view own history" ON lottery_history FOR SELECT USING (true);
CREATE POLICY "Users can insert own history" ON lottery_history FOR INSERT WITH CHECK (true);
```