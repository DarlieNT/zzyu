import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const VERIFICATION_FILE = path.join(DATA_DIR, 'lottery-verification.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = cookie.parse(req.headers.cookie || '');
  const userDataString = cookies.user_data;
  if (!userDataString) return res.status(401).json({ error: 'Not authenticated' });
  const userData = JSON.parse(userDataString);
  if (!userData.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  try {
    let results: any[] = [];
    if (fs.existsSync(VERIFICATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERIFICATION_FILE, 'utf8')) || { results: [] };
      results = data.results || [];
    }
    // newest first
    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.status(200).json({ results });
  } catch (e) {
    console.error('Admin lottery records error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
