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

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

    const { codes: inputCodes, value } = req.body;

    if (!inputCodes || !Array.isArray(inputCodes) || inputCodes.length === 0) {
      res.status(400).json({ error: 'Invalid codes array' });
      return;
    }

    if (!value || ![10, 20, 30, 40].includes(parseInt(value))) {
      res.status(400).json({ error: 'Invalid value' });
      return;
    }

    const valueKey = value.toString();
    const codes = loadCodes();

    // Initialize array if it doesn't exist
    if (!codes.available[valueKey]) {
      codes.available[valueKey] = [];
    }

    // Filter out empty codes and duplicates
    const validCodes = inputCodes
      .map(code => code.trim())
      .filter(code => code.length > 0)
      .filter(code => !codes.available[valueKey].includes(code));

    // Add new codes
    codes.available[valueKey].push(...validCodes);

    // Save to file
    saveCodes(codes);

    res.status(200).json({
      imported: validCodes.length,
      total: codes.available[valueKey].length
    });

  } catch (error) {
    console.error('Error importing codes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}