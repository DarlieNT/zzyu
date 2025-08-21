import { kv } from '@vercel/kv';
import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';

interface RedemptionCode {
  id: string;
  code: string;
  value: number;
  prizeName: string;
  userId: string;
  createdAt: string;
  used: boolean;
}

// 获取用户今日抽奖次数
export async function getUserAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const key = `lottery:attempts:${userId}:${today}`;
  const attempts = await kv.get<number>(key);
  return attempts || 0;
}

// 增加用户抽奖次数
export async function incrementUserAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const key = `lottery:attempts:${userId}:${today}`;
  const newAttempts = await kv.incr(key);
  
  // 设置24小时过期
  if (newAttempts === 1) {
    await kv.expire(key, 86400); // 24 hours in seconds
  }
  
  return newAttempts;
}

// 获取可用兑换码
export async function getAvailableCodes(value: string): Promise<string[]> {
  const key = `codes:available:${value}`;
  const codes = await kv.get<string[]>(key);
  return codes || [];
}

// 使用兑换码
export async function useRedemptionCode(value: string): Promise<string | null> {
  const key = `codes:available:${value}`;
  return await kv.lpop<string>(key);
}

// 添加兑换码到库存
export async function addCodesToStock(value: string, codes: string[]): Promise<void> {
  const key = `codes:available:${value}`;
  await kv.lpush(key, ...codes);
}

// 保存用户兑换码
export async function saveUserCode(userId: string, codeData: RedemptionCode): Promise<void> {
  const key = `codes:distributed:${userId}`;
  const existingCodes = await kv.get<RedemptionCode[]>(key) || [];
  existingCodes.unshift(codeData);
  await kv.set(key, existingCodes);
}

// 获取用户兑换码
export async function getUserCodes(userId: string): Promise<RedemptionCode[]> {
  const key = `codes:distributed:${userId}`;
  return await kv.get<RedemptionCode[]>(key) || [];
}

// 获取统计信息
export async function getCodeStats() {
  const values = ['10', '20', '30', '40'];
  const available: { [key: string]: number } = {};
  let totalDistributed = 0;

  for (const value of values) {
    const codes = await getAvailableCodes(value);
    available[value] = codes.length;
  }

  // 获取所有用户的兑换码数量 (这里简化处理)
  const keys = await kv.keys('codes:distributed:*');
  for (const key of keys) {
    const userCodes = await kv.get<RedemptionCode[]>(key) || [];
    totalDistributed += userCodes.length;
  }

  const totalAvailable = Object.values(available).reduce((sum, count) => sum + count, 0);
  
  return {
    available,
    distributed: totalDistributed,
    total: totalAvailable + totalDistributed
  };
}