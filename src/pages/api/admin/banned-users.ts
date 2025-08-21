import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

interface BannedUser {
  userId: string;
  username?: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
}

interface BannedUsersData {
  users: BannedUser[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const BANNED_USERS_FILE = path.join(DATA_DIR, 'banned-users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadBannedUsers(): BannedUsersData {
  try {
    if (fs.existsSync(BANNED_USERS_FILE)) {
      const data = fs.readFileSync(BANNED_USERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading banned users:', error);
  }
  return { users: [] };
}

function saveBannedUsers(data: BannedUsersData): void {
  try {
    fs.writeFileSync(BANNED_USERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving banned users:', error);
    throw error;
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
    if (!userData.isAdmin) {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    if (req.method === 'GET') {
      const bannedData = loadBannedUsers();
      res.status(200).json(bannedData);
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Banned users API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}