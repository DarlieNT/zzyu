# Vercel KV (Redis) 配置方案

## 1. 安装依赖

```bash
npm install @vercel/kv
```

## 2. Vercel控制台配置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Storage" 选项卡
4. 点击 "Create Database"
5. 选择 "KV" (Redis)
6. 创建数据库并记录连接信息

## 3. 环境变量配置

在 `.env.local` 中添加：

```env
# Vercel KV
KV_REST_API_URL="your_kv_rest_api_url"
KV_REST_API_TOKEN="your_kv_rest_api_token"
```

## 4. 数据结构设计

### 用户抽奖次数
```
Key: lottery:attempts:{userId}:{date}
Value: attempts_count (number)
TTL: 24小时后自动删除
```

### 兑换码库存
```
Key: codes:available:{value} 
Value: Array of codes
```

### 已发放兑换码
```
Key: codes:distributed:{userId}
Value: Array of distributed codes
```

## 5. API实现示例