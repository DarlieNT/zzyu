# Vercel Blob 存储配置方案

## 1. 安装依赖

```bash
npm install @vercel/blob
```

## 2. Vercel控制台配置

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Storage" 选项卡
4. 点击 "Create Database"
5. 选择 "Blob" 
6. 创建存储并记录连接信息

## 3. 环境变量配置

在 `.env.local` 中添加：

```env
# Vercel Blob
BLOB_READ_WRITE_TOKEN="your_blob_read_write_token"
```

## 4. 数据存储策略

使用Blob存储JSON文件来持久化数据：

### 存储结构
```
lottery-attempts.json    # 用户抽奖次数记录
redemption-codes.json    # 兑换码库存和分发记录
lottery-settings.json    # 抽奖设置（概率、封禁用户等）
banned-users.json        # 封禁用户列表
```

## 5. 数据格式

### lottery-attempts.json
```json
{
  "user_123": {
    "date": "2024-01-01",
    "attempts": 3
  }
}
```

### redemption-codes.json
```json
{
  "available": {
    "10": ["CODE1", "CODE2"],
    "20": ["CODE3"],
    "30": ["CODE4"],
    "40": ["CODE5"]
  },
  "distributed": [
    {
      "id": "unique_id",
      "code": "CODE1",
      "value": 10,
      "prizeName": "四等奖",
      "userId": "user_123",
      "createdAt": "2024-01-01T00:00:00Z",
      "used": false
    }
  ]
}
```

### lottery-settings.json
```json
{
  "probabilities": {
    "1": 0.05,
    "2": 0.1, 
    "3": 0.15,
    "4": 0.2,
    "0": 0.5
  },
  "dailyAttempts": 5,
  "prizes": [
    {"id": 1, "name": "一等奖", "value": 40},
    {"id": 2, "name": "二等奖", "value": 30},
    {"id": 3, "name": "三等奖", "value": 20},
    {"id": 4, "name": "四等奖", "value": 10},
    {"id": 0, "name": "谢谢惠顾", "value": 0}
  ]
}
```

### banned-users.json
```json
{
  "bannedUsers": ["user_456", "user_789"],
  "banReasons": {
    "user_456": "违规操作",
    "user_789": "恶意刷奖"
  }
}
```