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

function saveCodes(codes: CodesData) {
  try {
    fs.writeFileSync(CODES_FILE, JSON.stringify(codes, null, 2));
  } catch (e) {
    console.error('Error saving codes:', e);
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = cookie.parse(req.headers.cookie || '');
  const userDataString = cookies.user_data;
  if (!userDataString) return res.status(401).json({ error: 'Not authenticated' });
  const userData = JSON.parse(userDataString);
  if (!userData.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const { scope, value, code, id } = req.body as { scope: 'available'|'distributed'; value?: number; code?: string; id?: string };
  if (!scope || (scope === 'available' && (value === undefined || code === undefined)) || (scope === 'distributed' && !id)) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const data = loadCodes();
  if (scope === 'available') {
    const key = String(value);
    if (!data.available[key]) return res.status(404).json({ error: 'Bucket not found' });
    const before = data.available[key].length;
    data.available[key] = data.available[key].filter(c => c !== code);
    const removed = before !== data.available[key].length;
    if (!removed) return res.status(404).json({ error: 'Code not found' });
    saveCodes(data);
    return res.status(200).json({ success: true });
  } else {
    const before = data.distributed.length;
    data.distributed = data.distributed.filter(item => item.id !== id);
    const removed = before !== data.distributed.length;
    if (!removed) return res.status(404).json({ error: 'Record not found' });
    saveCodes(data);
    return res.status(200).json({ success: true });
  }
}
