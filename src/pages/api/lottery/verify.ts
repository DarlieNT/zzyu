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

interface VerificationData {
  results: LotteryResult[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VERIFICATION_FILE = path.join(DATA_DIR, 'lottery-verification.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadVerificationData(): VerificationData {
  try {
    if (fs.existsSync(VERIFICATION_FILE)) {
      const data = fs.readFileSync(VERIFICATION_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading verification data:', error);
  }
  return { results: [] };
}

function saveVerificationData(data: VerificationData): void {
  try {
    fs.writeFileSync(VERIFICATION_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving verification data:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const userDataString = cookies.user_data;
    
    if (!userDataString) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userData = JSON.parse(userDataString);
    const userId = userData.sub;

    if (req.method === 'POST') {
      // 记录抽奖结果
      const { prizeId, prizeName, prizeValue, code } = req.body;

      const result: LotteryResult = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2)}`,
        userId,
        prizeId,
        prizeName,
        prizeValue,
        code: code || null,
        timestamp: new Date().toISOString(),
        verified: true
      };

      const verificationData = loadVerificationData();
      verificationData.results.push(result);
      saveVerificationData(verificationData);

      res.status(200).json({ 
        success: true, 
        resultId: result.id,
        message: '抽奖结果已记录并验证'
      });

    } else if (req.method === 'GET') {
      // 获取用户的抽奖记录
      const verificationData = loadVerificationData();
      const userResults = verificationData.results
        .filter(result => result.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.status(200).json({ results: userResults });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error in verification API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}