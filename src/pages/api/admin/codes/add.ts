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

function saveCodes(codes: CodesData): void {
  try {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
  } catch (error) {
    console.error('Error saving codes:', error);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = cookie.parse(req.headers.cookie || '');
  const userDataString = cookies.user_data;
  if (!userDataString) return res.status(401).json({ error: 'Not authenticated' });
  const userData = JSON.parse(userDataString);
  if (!userData.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const { value, code } = req.body as { value: number; code: string };
  if (!value || ![10,20,30,40].includes(Number(value)) || !code || !code.trim()) {
    return res.status(400).json({ error: 'Invalid value or code' });
  }

  const data = loadCodes();
  const key = String(value);
  if (!data.available[key]) data.available[key] = [];
  if (data.available[key].includes(code)) {
    return res.status(409).json({ error: 'Code already exists' });
  }
  data.available[key].push(code.trim());
  saveCodes(data);
  res.status(200).json({ success: true, total: data.available[key].length });
}
