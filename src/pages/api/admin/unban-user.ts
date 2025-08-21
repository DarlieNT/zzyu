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
  if (req.method !== 'POST') {
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

    const { userId } = req.body;

    if (!userId) {
      res.status(400).json({ error: '用户ID不能为空' });
      return;
    }

    const bannedData = loadBannedUsers();
    
    // Remove user from banned list
    const initialLength = bannedData.users.length;
    bannedData.users = bannedData.users.filter(user => user.userId !== userId);
    
    if (bannedData.users.length === initialLength) {
      res.status(404).json({ error: '用户未被封禁' });
      return;
    }

    saveBannedUsers(bannedData);

    res.status(200).json({ success: true, message: '用户已解封' });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}