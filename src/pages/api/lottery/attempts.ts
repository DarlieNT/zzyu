import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

interface UserAttempts {
  [userId: string]: {
    date: string;
    attempts: number;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ATTEMPTS_FILE = path.join(DATA_DIR, 'lottery-attempts.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadAttempts(): UserAttempts {
  try {
    if (fs.existsSync(ATTEMPTS_FILE)) {
      const data = fs.readFileSync(ATTEMPTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading attempts:', error);
  }
  return {};
}

function saveAttempts(attempts: UserAttempts): void {
  try {
    fs.writeFileSync(ATTEMPTS_FILE, JSON.stringify(attempts, null, 2));
  } catch (error) {
    console.error('Error saving attempts:', error);
  }
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
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
    const userId = userData.sub;
    const today = getTodayString();

    const attempts = loadAttempts();
    const userAttempts = attempts[userId];

    let attemptsLeft = 5;
    if (userAttempts && userAttempts.date === today) {
      attemptsLeft = Math.max(0, 5 - userAttempts.attempts);
    }

    res.status(200).json({ attemptsLeft });
  } catch (error) {
    console.error('Error checking attempts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}