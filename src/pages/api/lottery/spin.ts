import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

interface LotteryResult {
  id: string;
  userId: string;
  prizeId: number;
  prizeName: string;
  prizeValue: number;
  code: string | null;
  timestamp: string;
  verified: boolean;
}

interface Prize {
  id: number;
  name: string;
  value: number;
  probability: number;
}

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

const prizes: Prize[] = [
  { id: 1, name: '一等奖', value: 40, probability: 0.05 },
  { id: 2, name: '二等奖', value: 30, probability: 0.1 },
  { id: 3, name: '三等奖', value: 20, probability: 0.15 },
  { id: 4, name: '四等奖', value: 10, probability: 0.2 },
  { id: 0, name: '谢谢惠顾', value: 0, probability: 0.5 },
];

const DATA_DIR = path.join(process.cwd(), 'data');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'lottery-attempts.json');
const CODES_FILE = path.join(DATA_DIR, 'redemption-codes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAttempts(): UserAttempts {
  try {
    if (fs.existsSync(ATTEMPTS_FILE)) {
      const data = fs.readFileSync(ATTEMPTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading attempts:', error);
  }
  return {};
}

function saveAttempts(attempts: UserAttempts): void {
  try {
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
  } catch (error) {
    console.error('Error saving attempts:', error);
  }
}

function loadCodes(): CodesData {
  try {
    if (fs.existsSync(CODES_FILE)) {
      const data = fs.readFileSync(CODES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // normalize shape to avoid undefined errors
      const available = parsed && typeof parsed.available === 'object' && !Array.isArray(parsed.available)
        ? parsed.available
        : {};
      const distributed = Array.isArray(parsed?.distributed) ? parsed.distributed : [];
      return { available, distributed } as CodesData;
    }
  } catch (error) {
    console.error('Error loading codes:', error);
  }
  return { available: {}, distributed: [] };
}

function saveCodes(codes: CodesData): void {
  try {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
  } catch (error) {
    console.error('Error saving codes:', error);
  }
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function selectPrize(): Prize {
  const random = Math.random();
  let cumulativeProbability = 0;

  for (const prize of prizes) {
    cumulativeProbability += prize.probability;
    if (random <= cumulativeProbability) {
      return prize;
    }
  }

  return prizes[prizes.length - 1]; // Fallback to last prize
}

function generateRandomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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
    const today = getTodayString();

    // Check attempts
    const attempts = loadAttempts();
    const userAttempts = attempts[userId];
    
    let currentAttempts = 0;
    if (userAttempts && userAttempts.date === today) {
      currentAttempts = userAttempts.attempts;
    }

    if (currentAttempts >= 5) {
      res.status(400).json({ error: '今日抽奖次数已用完' });
      return;
    }

    // Update attempts
    attempts[userId] = {
      date: today,
      attempts: currentAttempts + 1
    };
    saveAttempts(attempts);

    // Select prize
    const prize = selectPrize();
    let code = null;

    // If prize has value, assign redemption code
    if (prize.value > 0) {
      const codes = loadCodes();
      // ensure containers exist
      if (!codes.available || typeof codes.available !== 'object') codes.available = {};
      if (!Array.isArray(codes.distributed)) codes.distributed = [];
      const valueKey = prize.value.toString();
      if (!Array.isArray((codes.available as any)[valueKey])) {
        (codes.available as any)[valueKey] = [];
      }

      // Check if we have available codes for this prize
      if ((codes.available as any)[valueKey].length > 0) {
        code = (codes.available as any)[valueKey].shift()!;
      } else {
        // Generate a new code if none available
        code = generateRandomCode();
      }

      // Add to distributed codes
      const redemptionCode: RedemptionCode = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
        code,
        value: prize.value,
        prizeName: prize.name,
        userId,
        createdAt: new Date().toISOString(),
        used: false
      };

      codes.distributed.push(redemptionCode);
      saveCodes(codes);
    }

    const attemptsLeft = 5 - attempts[userId].attempts;

    // 记录抽奖结果到验证文件
    try {
      const verificationData: { results: LotteryResult[] } = {
        results: []
      };
      
      const VERIFICATION_FILE = path.join(DATA_DIR, 'lottery-verification.json');
      
      // 读取现有验证数据
      if (fs.existsSync(VERIFICATION_FILE)) {
        const existingData = fs.readFileSync(VERIFICATION_FILE, 'utf8');
        Object.assign(verificationData, JSON.parse(existingData));
      }
      
      // 添加新的抽奖结果
  const result: LotteryResult = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        prizeId: prize.id,
        prizeName: prize.name,
        prizeValue: prize.value,
        code: code || null,
        timestamp: new Date().toISOString(),
        verified: true
      };
      
      verificationData.results.push(result);
      fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(verificationData, null, 2));
      
    } catch (error) {
      console.error('Error recording verification:', error);
    }

    res.status(200).json({
      prize,
      code,
      attemptsLeft,
      timestamp: new Date().toISOString() // 添加时间戳用于前端验证
    });

  } catch (error) {
    console.error('Error spinning wheel:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}