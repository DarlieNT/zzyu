import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const CODES_FILE = path.join(DATA_DIR, 'redemption-codes.json');

function loadCodes(): CodesData {
  try {
    if (fs.existsSync(CODES_FILE)) {
      const data = fs.readFileSync(CODES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading codes:', error);
  }
  return { available: {}, distributed: [] };
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

    const codes = loadCodes();
    const userCodes = codes.distributed
      .filter(code => code.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({ codes: userCodes });
  } catch (error) {
    console.error('Error fetching user codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}