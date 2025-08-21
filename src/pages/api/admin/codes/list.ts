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
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading codes:', error);
  }
  return { available: {}, distributed: [] };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = cookie.parse(req.headers.cookie || '');
  const userDataString = cookies.user_data;
  if (!userDataString) return res.status(401).json({ error: 'Not authenticated' });
  const userData = JSON.parse(userDataString);
  if (!userData.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const codes = loadCodes();
  res.status(200).json(codes);
}
