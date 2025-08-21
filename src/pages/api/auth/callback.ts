import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import cookie from 'cookie';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { code, state, error } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    res.redirect('/?error=auth_failed');
    return;
  }

  if (!code) {
    res.redirect('/?error=no_code');
    return;
  }

  try {
    // Exchange authorization code for access token
    const tokenUrl = 'https://conn.nodeloc.cc/oauth2/token';
    const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
    const clientSecret = process.env.OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing OAuth configuration');
      res.redirect('/?error=config_missing');
      return;
    }

    const tokenResponse = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        },
      }
    );

    const { access_token, refresh_token, expires_in, id_token } = tokenResponse.data;

    // Parse user info from ID token
    let userData;
    if (id_token) {
      // Decode JWT ID Token (basic parsing without verification for demo)
      const base64Url = id_token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64').toString('ascii').split('').map((c) => 
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      userData = JSON.parse(jsonPayload);
    } else {
      // Fallback to userinfo endpoint
      const userInfoUrl = 'https://conn.nodeloc.cc/oauth2/userinfo';
      const userResponse = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      userData = userResponse.data;
    }

    // 拒绝被封禁用户
    try {
      const DATA_DIR = path.join(process.cwd(), 'data');
      const BANNED_USERS_FILE = path.join(DATA_DIR, 'banned-users.json');
      if (fs.existsSync(BANNED_USERS_FILE)) {
        const banned = JSON.parse(fs.readFileSync(BANNED_USERS_FILE, 'utf8'));
        const bannedUsers: Array<{ userId: string }>= banned?.users || [];
        if (bannedUsers.find(u => u.userId === userData.sub)) {
          return res.redirect('/?error=banned');
        }
      }
    } catch (e) {
      console.error('Ban check failed:', e);
    }

    // Upsert user profile for admin listing
    try {
      const DATA_DIR = path.join(process.cwd(), 'data');
      const USERS_FILE = path.join(DATA_DIR, 'users.json');
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
      let users: any[] = [];
      if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
      }
      const idx = users.findIndex((u: any) => u.sub === userData.sub);
      const record = {
        sub: userData.sub,
        username: userData.username || userData.preferred_username || (userData.email ? userData.email.split('@')[0] : undefined),
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        displayName: userData.name || userData.preferred_username || userData.username || (userData.email ? userData.email.split('@')[0] : '用户'),
        avatarUrl: userData.picture,
        lastLogin: new Date().toISOString(),
      };
      if (idx >= 0) {
        users[idx] = { ...users[idx], ...record };
      } else {
        users.push(record);
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (e) {
      console.error('Persist users.json failed:', e);
    }

    // Set secure HTTP-only cookies
  res.setHeader('Set-Cookie', [
      cookie.serialize('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in || 3600,
        path: '/',
      }),
      cookie.serialize('refresh_token', refresh_token || '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      }),
      cookie.serialize('user_data', JSON.stringify({
        sub: userData.sub,
        username: userData.username || userData.preferred_username || userData.name || (userData.email ? userData.email.split('@')[0] : undefined),
        email: userData.email,
        groups: userData.groups || [],
        name: userData.name,
        picture: userData.picture,
        displayName: userData.name || userData.preferred_username || userData.username || (userData.email ? userData.email.split('@')[0] : '用户'),
        avatarUrl: userData.picture,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in || 3600,
        path: '/',
      }),
    ]);

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange error:', error);
    res.redirect('/?error=token_exchange_failed');
  }
}