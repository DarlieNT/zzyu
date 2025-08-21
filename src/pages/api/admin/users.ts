import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const userDataString = cookies.user_data;
  if (!userDataString) return res.status(401).json({ error: 'Not authenticated' });
  const userData = JSON.parse(userDataString);
  if (!userData.isAdmin) return res.status(403).json({ error: 'Admin access required' });

  try {
    let users: any[] = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
    }
    res.status(200).json({ users });
  } catch (e) {
    console.error('Admin users list error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
}
