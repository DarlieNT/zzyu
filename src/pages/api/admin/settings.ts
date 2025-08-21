import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

interface LotterySettings {
  probabilities: { [prizeId: string]: number };
  dailyAttempts: number;
  prizes: Array<{
    id: number;
    name: string;
    value: number;
  }>;
}

interface SystemSettings {
  lottery: LotterySettings;
  version: string;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'system-settings.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadSettings(): SystemSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  
  // Default settings
  return {
    lottery: {
      probabilities: {
        '1': 0.05,
        '2': 0.1,
        '3': 0.15,
        '4': 0.2,
        '0': 0.5
      },
      dailyAttempts: 5,
      prizes: [
        { id: 1, name: '一等奖', value: 40 },
        { id: 2, name: '二等奖', value: 30 },
        { id: 3, name: '三等奖', value: 20 },
        { id: 4, name: '四等奖', value: 10 }
      ]
    },
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  };
}

function saveSettings(settings: SystemSettings): void {
  try {
    settings.lastUpdated = new Date().toISOString();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
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
      const settings = loadSettings();
      res.status(200).json(settings);
      return;
    }

    if (req.method === 'POST') {
      const { lottery } = req.body;

      if (!lottery) {
        res.status(400).json({ error: 'Missing lottery settings' });
        return;
      }

      // Validate probabilities
      if (lottery.probabilities) {
        const totalProbability = Object.values(lottery.probabilities).reduce((sum: number, p: any) => sum + p, 0);
        if (Math.abs(totalProbability - 1) > 0.01) {
          res.status(400).json({ error: '概率总和必须为100%' });
          return;
        }
      }

      // Validate daily attempts
      if (lottery.dailyAttempts && (lottery.dailyAttempts < 1 || lottery.dailyAttempts > 20)) {
        res.status(400).json({ error: '每日抽奖次数必须在1-20之间' });
        return;
      }

      const currentSettings = loadSettings();
      const newSettings: SystemSettings = {
        ...currentSettings,
        lottery: {
          ...currentSettings.lottery,
          ...lottery
        }
      };

      saveSettings(newSettings);
      res.status(200).json({ success: true, settings: newSettings });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}