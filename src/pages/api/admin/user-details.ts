import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CODES_FILE = path.join(DATA_DIR, 'redemption-codes.json');
const VERIFICATION_FILE = path.join(DATA_DIR, 'lottery-verification.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const cookies = cookie.parse(req.headers.cookie || '');
  const userDataString = cookies.user_data;
  if (!userDataString) return res.status(401).json({ error: 'Not authenticated' });
  const userData = JSON.parse(userDataString);
  if (!userData.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  const userId = req.query.userId as string;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  try {
    let profile: any = null;
    if (fs.existsSync(USERS_FILE)) {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
      profile = users.find((u: any) => u.sub === userId) || null;
    }

    let codes: any[] = [];
    if (fs.existsSync(CODES_FILE)) {
      const data = JSON.parse(fs.readFileSync(CODES_FILE, 'utf8')) || { distributed: [] };
      codes = (data.distributed || []).filter((c: any) => c.userId === userId);
    }

    let history: any[] = [];
    if (fs.existsSync(VERIFICATION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERIFICATION_FILE, 'utf8')) || { results: [] };
      history = (data.results || []).filter((r: any) => r.userId === userId);
    }

    res.status(200).json({ profile, codes, history });
  } catch (e) {
    console.error('Admin user details error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
