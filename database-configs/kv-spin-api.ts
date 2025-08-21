// 使用 Vercel KV 的抽奖API示例
import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import { getUserAttempts, incrementUserAttempts, useRedemptionCode, saveUserCode } from '@/lib/kv-utils';

const prizes = [
  { id: 1, name: '一等奖', value: 40, probability: 0.05 },
  { id: 2, name: '二等奖', value: 30, probability: 0.1 },
  { id: 3, name: '三等奖', value: 20, probability: 0.15 },
  { id: 4, name: '四等奖', value: 10, probability: 0.2 },
  { id: 0, name: '谢谢惠顾', value: 0, probability: 0.5 },
];

function selectPrize() {
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      return prize;
    }
  }
  return prizes[prizes.length - 1];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const userDataString = cookies.user_data;
    
    if (!userDataString) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userData = JSON.parse(userDataString);
    const userId = userData.sub;

    // 检查今日抽奖次数
    const currentAttempts = await getUserAttempts(userId);
    if (currentAttempts >= 5) {
      res.status(400).json({ error: '今日抽奖次数已用完' });
      return;
    }

    // 增加抽奖次数
    const newAttempts = await incrementUserAttempts(userId);
    
    // 选择奖品
    const prize = selectPrize();
    let code = null;

    // 如果中奖，分配兑换码
    if (prize.value > 0) {
      code = await useRedemptionCode(prize.value.toString());
      
      if (!code) {
        // 如果没有可用兑换码，生成新的
        code = `AUTO${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      }

      // 保存用户兑换码记录
      const redemptionCode = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
        code,
        value: prize.value,
        prizeName: prize.name,
        userId,
        createdAt: new Date().toISOString(),
        used: false
      };

      await saveUserCode(userId, redemptionCode);
    }

    const attemptsLeft = 5 - newAttempts;

    res.status(200).json({
      prize,
      code,
      attemptsLeft
    });

  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}