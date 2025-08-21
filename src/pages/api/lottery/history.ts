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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    const verificationData = loadVerificationData();
    
    // Filter results for the current user
    const userResults = verificationData.results
      .filter(result => result.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first

    res.status(200).json({
      records: userResults
    });

  } catch (error) {
    console.error('Error fetching lottery history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}