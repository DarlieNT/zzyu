import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || '');
    const userDataString = cookies.user_data;
    const accessToken = cookies.access_token;
    
    if (!userDataString || !accessToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userData = JSON.parse(userDataString);
    // Ban check
    try {
      const DATA_DIR = path.join(process.cwd(), 'data');
      const BANNED_USERS_FILE = path.join(DATA_DIR, 'banned-users.json');
      if (fs.existsSync(BANNED_USERS_FILE)) {
        const banned = JSON.parse(fs.readFileSync(BANNED_USERS_FILE, 'utf8'));
        const bannedUsers: Array<{ userId: string }>= banned?.users || [];
        if (bannedUsers.find(u => u.userId === userData.sub)) {
          return res.status(403).json({ error: 'User banned', message: '账号已被封禁' });
        }
      }
    } catch (e) {
      console.error('Ban check failed:', e);
    }
    
    res.status(200).json({
      user: {
        sub: userData.sub,
        username: userData.username,
        email: userData.email,
        groups: userData.groups || [],
        isAdmin: userData.isAdmin || false,
  name: userData.name,
  picture: userData.picture,
  displayName: userData.displayName,
  avatarUrl: userData.avatarUrl,
      }
    });
  } catch (error) {
    console.error('User data parsing error:', error);
    res.status(401).json({ error: 'Invalid user data' });
  }
}