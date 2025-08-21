import { put, head, list } from '@vercel/blob';

interface UserAttempts {
  [userId: string]: {
    date: string;
    attempts: number;
  };
}

interface RedemptionCode {
  id: string;
  code: string;
  value: number;
  prizeName: string;
  userId: string;
  createdAt: string;
  used: boolean;
}

interface CodesData {
  available: { [value: string]: string[] };
  distributed: RedemptionCode[];
}

interface LotterySettings {
  probabilities: { [prizeId: string]: number };
  dailyAttempts: number;
  prizes: Array<{
    id: number;
    name: string;
    value: number;
  }>;
}

interface BannedUsers {
  bannedUsers: string[];
  banReasons: { [userId: string]: string };
}

// Blob存储工具函数
async function getBlobData<T>(filename: string, defaultData: T): Promise<T> {
  try {
    const blobs = await list({ prefix: filename });
    if (blobs.blobs.length === 0) {
      return defaultData;
    }

    const response = await fetch(blobs.blobs[0].url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return defaultData;
  }
}

async function setBlobData<T>(filename: string, data: T): Promise<void> {
  try {
    const blob = await put(filename, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });
    console.log(`Successfully saved ${filename}:`, blob.url);
  } catch (error) {
    console.error(`Error saving ${filename}:`, error);
    throw error;
  }
}

// 用户抽奖次数管理
export async function getUserTodayAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const attempts = await getBlobData<UserAttempts>('lottery-attempts.json', {});
  
  const userAttempts = attempts[userId];
  if (userAttempts && userAttempts.date === today) {
    return userAttempts.attempts;
  }
  return 0;
}

export async function incrementUserAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const attempts = await getBlobData<UserAttempts>('lottery-attempts.json', {});
  
  const currentAttempts = attempts[userId]?.date === today ? attempts[userId].attempts : 0;
  const newAttempts = currentAttempts + 1;
  
  attempts[userId] = {
    date: today,
    attempts: newAttempts
  };
  
  await setBlobData('lottery-attempts.json', attempts);
  return newAttempts;
}

// 兑换码管理
export async function getAvailableCodes(value: string): Promise<string[]> {
  const codes = await getBlobData<CodesData>('redemption-codes.json', { available: {}, distributed: [] });
  return codes.available[value] || [];
}

export async function useRedemptionCode(value: string): Promise<string | null> {
  const codes = await getBlobData<CodesData>('redemption-codes.json', { available: {}, distributed: [] });
  
  if (!codes.available[value] || codes.available[value].length === 0) {
    return null;
  }
  
  const code = codes.available[value].shift()!;
  await setBlobData('redemption-codes.json', codes);
  return code;
}

export async function addCodesToStock(value: string, newCodes: string[]): Promise<void> {
  const codes = await getBlobData<CodesData>('redemption-codes.json', { available: {}, distributed: [] });
  
  if (!codes.available[value]) {
    codes.available[value] = [];
  }
  
  // 去重并添加新兑换码
  const existingCodes = new Set(codes.available[value]);
  const uniqueNewCodes = newCodes.filter(code => !existingCodes.has(code));
  codes.available[value].push(...uniqueNewCodes);
  
  await setBlobData('redemption-codes.json', codes);
}

export async function saveUserCode(userId: string, codeData: RedemptionCode): Promise<void> {
  const codes = await getBlobData<CodesData>('redemption-codes.json', { available: {}, distributed: [] });
  codes.distributed.unshift(codeData);
  await setBlobData('redemption-codes.json', codes);
}

export async function getUserCodes(userId: string): Promise<RedemptionCode[]> {
  const codes = await getBlobData<CodesData>('redemption-codes.json', { available: {}, distributed: [] });
  return codes.distributed
    .filter(code => code.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// 抽奖设置管理
export async function getLotterySettings(): Promise<LotterySettings> {
  return await getBlobData<LotterySettings>('lottery-settings.json', {
    probabilities: {
      '1': 0.05,
      '2': 0.1,
      '3': 0.15,
      '4': 0.2,
      '0': 0.5
    },
    dailyAttempts: 5,
    prizes: [
      { id: 1, name: '一等奖', value: 40 },
      { id: 2, name: '二等奖', value: 30 },
      { id: 3, name: '三等奖', value: 20 },
      { id: 4, name: '四等奖', value: 10 },
      { id: 0, name: '谢谢惠顾', value: 0 }
    ]
  });
}

export async function updateLotterySettings(settings: LotterySettings): Promise<void> {
  await setBlobData('lottery-settings.json', settings);
}

// 用户封禁管理
export async function getBannedUsers(): Promise<BannedUsers> {
  return await getBlobData<BannedUsers>('banned-users.json', {
    bannedUsers: [],
    banReasons: {}
  });
}

export async function banUser(userId: string, reason: string): Promise<void> {
  const bannedData = await getBannedUsers();
  
  if (!bannedData.bannedUsers.includes(userId)) {
    bannedData.bannedUsers.push(userId);
  }
  bannedData.banReasons[userId] = reason;
  
  await setBlobData('banned-users.json', bannedData);
}

export async function unbanUser(userId: string): Promise<void> {
  const bannedData = await getBannedUsers();
  
  bannedData.bannedUsers = bannedData.bannedUsers.filter(id => id !== userId);
  delete bannedData.banReasons[userId];
  
  await setBlobData('banned-users.json', bannedData);
}

export async function isUserBanned(userId: string): Promise<boolean> {
  const bannedData = await getBannedUsers();
  return bannedData.bannedUsers.includes(userId);
}

// 统计信息
export async function getCodeStatistics() {
  const codes = await getBlobData<CodesData>('redemption-codes.json', { available: {}, distributed: [] });
  
  const available: { [key: string]: number } = {};
  Object.keys(codes.available).forEach(value => {
    available[value] = codes.available[value].length;
  });

  const distributedCount = codes.distributed.length;
  const totalAvailable = Object.values(codes.available).reduce((sum, arr) => sum + arr.length, 0);
  const totalCount = totalAvailable + distributedCount;

  return {
    available,
    distributed: distributedCount,
    total: totalCount
  };
}

// 初始化示例数据
export async function initializeBlobData(): Promise<void> {
  // 初始化兑换码数据
  const defaultCodes: CodesData = {
    available: {
      '10': ['DEMO10A123456789', 'DEMO10B123456789', 'DEMO10C123456789'],
      '20': ['DEMO20A123456789', 'DEMO20B123456789'],
      '30': ['DEMO30A123456789'],
      '40': ['DEMO40A123456789']
    },
    distributed: []
  };
  
  await setBlobData('redemption-codes.json', defaultCodes);
  
  // 初始化抽奖设置
  const defaultSettings: LotterySettings = {
    probabilities: {
      '1': 0.05,
      '2': 0.1,
      '3': 0.15,
      '4': 0.2,
      '0': 0.5
    },
    dailyAttempts: 5,
    prizes: [
      { id: 1, name: '一等奖', value: 40 },
      { id: 2, name: '二等奖', value: 30 },
      { id: 3, name: '三等奖', value: 20 },
      { id: 4, name: '四等奖', value: 10 },
      { id: 0, name: '谢谢惠顾', value: 0 }
    ]
  };
  
  await setBlobData('lottery-settings.json', defaultSettings);
  
  // 初始化封禁用户数据
  const defaultBannedUsers: BannedUsers = {
    bannedUsers: [],
    banReasons: {}
  };
  
  await setBlobData('banned-users.json', defaultBannedUsers);
  
  console.log('Blob storage initialized with default data');
}