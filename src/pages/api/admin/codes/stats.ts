import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

interface CodesData {
  available: { [value: string]: string[] };
  distributed: Array<{
    id: string;
    code: string;
    value: number;
    prizeName: string;
    userId: string;
    createdAt: string;
    used: boolean;
  }>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CODES_FILE = path.join(DATA_DIR, 'redemption-codes.json');

function loadCodes(): CodesData {
  try {
    if (fs.existsSync(CODES_FILE)) {
      const data = fs.readFileSync(CODES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      const available = parsed && typeof parsed.available === 'object' && !Array.isArray(parsed.available)
        ? parsed.available
        : {};
      const distributed = Array.isArray(parsed?.distributed) ? parsed.distributed : [];
      return { available, distributed };
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
    if (!userData.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const codes = loadCodes();
    
    // Calculate statistics
    const availableCount: { [value: string]: number } = {};
    Object.keys(codes.available || {}).forEach(value => {
      const arr = (codes.available as any)[value];
      availableCount[value] = Array.isArray(arr) ? arr.length : 0;
    });

    const distributedCount = codes.distributed.length;
  const totalAvailable = Object.values(codes.available || {}).reduce((sum, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    const totalCount = totalAvailable + distributedCount;

    res.status(200).json({
      available: availableCount,
      distributed: distributedCount,
      total: totalCount
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}