import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();

  const db = client.db('lottery');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// 用户抽奖次数管理
export async function getUserTodayAttempts(userId: string): Promise<number> {
  const { db } = await connectToDatabase();
  const today = new Date().toISOString().split('T')[0];

  const record = await db.collection('lottery_attempts').findOne({
    userId,
    date: today
  });

  return record?.attempts || 0;
}

export async function incrementUserAttempts(userId: string): Promise<number> {
  const { db } = await connectToDatabase();
  const today = new Date().toISOString().split('T')[0];

  const result = await db.collection('lottery_attempts').findOneAndUpdate(
    { userId, date: today },
    { 
      $inc: { attempts: 1 },
      $setOnInsert: { createdAt: new Date() },
      $set: { updatedAt: new Date() }
    },
    { upsert: true, returnDocument: 'after' }
  );

  return result.value.attempts;
}

// 兑换码管理
export async function getAvailableCode(value: number): Promise<string | null> {
  const { db } = await connectToDatabase();

  const result = await db.collection('redemption_codes').findOneAndUpdate(
    { status: 'available', value },
    { 
      $set: { 
        status: 'distributed', 
        distributedAt: new Date() 
      }
    },
    { sort: { createdAt: 1 } }
  );

  return result.value?.code || null;
}

export async function distributeCodeToUser(
  code: string, 
  userId: string, 
  value: number, 
  prizeName: string
): Promise<void> {
  const { db } = await connectToDatabase();

  // 更新兑换码归属
  await db.collection('redemption_codes').updateOne(
    { code },
    { $set: { userId } }
  );

  // 记录抽奖历史
  await db.collection('lottery_history').insertOne({
    userId,
    prizeId: value === 40 ? 1 : value === 30 ? 2 : value === 20 ? 3 : 4,
    prizeName,
    prizeValue: value,
    redemptionCode: code,
    createdAt: new Date()
  });
}

export async function getUserCodes(userId: string) {
  const { db } = await connectToDatabase();

  const codes = await db.collection('redemption_codes')
    .find({ userId })
    .sort({ distributedAt: -1 })
    .toArray();

  return codes.map(code => ({
    id: code._id.toString(),
    code: code.code,
    value: code.value,
    prizeName: code.prizeName,
    createdAt: code.distributedAt,
    used: code.status === 'used'
  }));
}

export async function getCodeStatistics() {
  const { db } = await connectToDatabase();

  const pipeline = [
    {
      $group: {
        _id: { value: '$value', status: '$status' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await db.collection('redemption_codes').aggregate(pipeline).toArray();

  const stats = {
    available: {} as Record<string, number>,
    distributed: 0,
    total: 0
  };

  results.forEach(result => {
    const valueKey = result._id.value.toString();
    if (result._id.status === 'available') {
      stats.available[valueKey] = result.count;
    } else if (result._id.status === 'distributed') {
      stats.distributed += result.count;
    }
    stats.total += result.count;
  });

  return stats;
}

export async function importCodes(codes: string[], value: number): Promise<number> {
  const { db } = await connectToDatabase();

  const prizeName = value === 40 ? '一等奖' : value === 30 ? '二等奖' : value === 20 ? '三等奖' : '四等奖';
  
  const documents = codes.map(code => ({
    code,
    value,
    prizeName,
    status: 'available',
    createdAt: new Date()
  }));

  try {
    const result = await db.collection('redemption_codes').insertMany(documents, { ordered: false });
    return result.insertedCount;
  } catch (error: any) {
    // 处理重复键错误，返回实际插入的数量
    if (error.code === 11000) {
      return error.result?.nInserted || 0;
    }
    throw error;
  }
}

// 初始化示例数据
export async function initializeSampleData() {
  const { db } = await connectToDatabase();

  const sampleCodes = [
    { code: 'DEMO10A123456789', value: 10, prizeName: '四等奖' },
    { code: 'DEMO10B123456789', value: 10, prizeName: '四等奖' },
    { code: 'DEMO10C123456789', value: 10, prizeName: '四等奖' },
    { code: 'DEMO20A123456789', value: 20, prizeName: '三等奖' },
    { code: 'DEMO20B123456789', value: 20, prizeName: '三等奖' },
    { code: 'DEMO30A123456789', value: 30, prizeName: '二等奖' },
    { code: 'DEMO40A123456789', value: 40, prizeName: '一等奖' },
  ];

  const documents = sampleCodes.map(item => ({
    ...item,
    status: 'available',
    createdAt: new Date()
  }));

  try {
    await db.collection('redemption_codes').insertMany(documents, { ordered: false });
    console.log('Sample data initialized');
  } catch (error: any) {
    if (error.code !== 11000) { // Ignore duplicate key errors
      console.error('Error initializing sample data:', error);
    }
  }
}