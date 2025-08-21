# MongoDB Atlas 配置方案

## 1. 安装依赖

```bash
npm install mongodb
# 或者使用 Mongoose
npm install mongoose
```

## 2. MongoDB Atlas 设置

1. 访问 [MongoDB Atlas](https://cloud.mongodb.com)
2. 创建免费集群
3. 设置数据库用户和密码
4. 配置网络访问 (允许所有IP: 0.0.0.0/0)
5. 获取连接字符串

## 3. 环境变量配置

在 `.env.local` 中添加：

```env
# MongoDB Atlas
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/lottery?retryWrites=true&w=majority"
```

## 4. 数据结构设计

### 用户抽奖记录集合 (lottery_attempts)
```javascript
{
  _id: ObjectId,
  userId: "user_id_string",
  date: "2024-01-01", // YYYY-MM-DD格式
  attempts: 5,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

### 兑换码集合 (redemption_codes)
```javascript
{
  _id: ObjectId,
  code: "UNIQUE_CODE_123",
  value: 40,
  prizeName: "一等奖",
  status: "available", // available, distributed, used
  userId: "user_id_string", // 分发给的用户ID
  createdAt: ISODate,
  distributedAt: ISODate,
  usedAt: ISODate
}
```

### 抽奖历史集合 (lottery_history)
```javascript
{
  _id: ObjectId,
  userId: "user_id_string",
  prizeId: 1,
  prizeName: "一等奖",
  prizeValue: 40,
  redemptionCode: "UNIQUE_CODE_123",
  createdAt: ISODate
}
```

## 5. 索引优化

```javascript
// 用户抽奖记录索引
db.lottery_attempts.createIndex({ "userId": 1, "date": 1 }, { unique: true })

// 兑换码索引
db.redemption_codes.createIndex({ "code": 1 }, { unique: true })
db.redemption_codes.createIndex({ "status": 1, "value": 1 })
db.redemption_codes.createIndex({ "userId": 1 })

// 抽奖历史索引
db.lottery_history.createIndex({ "userId": 1 })
db.lottery_history.createIndex({ "createdAt": -1 })
```