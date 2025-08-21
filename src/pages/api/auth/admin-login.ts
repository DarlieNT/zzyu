import type { NextApiRequest, NextApiResponse } from 'next';
import cookie from 'cookie';

interface AdminCredentials {
  username: string;
  password: string;
}

// 管理员账号配置 (实际项目中应该存储在数据库中)
const ADMIN_ACCOUNTS: AdminCredentials[] = [
  {
    username: 'zzyu',
    password: 'Maybe638299@'
  }
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  // 验证管理员凭据
  const adminAccount = ADMIN_ACCOUNTS.find(
    admin => admin.username === username && admin.password === password
  );

  if (!adminAccount) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // 创建管理员用户数据
  const adminUserData = {
    sub: `admin_${username}`,
    username: username,
    email: `${username}@zzyu.admin`,
    groups: ['administrators', 'staff'],
  isAdmin: true,
  name: username,
  picture: undefined,
  displayName: username,
  avatarUrl: undefined,
  };

  // 生成模拟的访问令牌 (实际项目中应该使用JWT)
  const adminAccessToken = `admin_token_${Date.now()}_${Math.random().toString(36)}`;

  // 设置安全cookies
  res.setHeader('Set-Cookie', [
    cookie.serialize('access_token', adminAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    }),
    cookie.serialize('user_data', JSON.stringify(adminUserData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    }),
    cookie.serialize('login_type', 'admin', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    }),
  ]);

  res.status(200).json({
    success: true,
    user: adminUserData,
    message: 'Admin login successful'
  });
}