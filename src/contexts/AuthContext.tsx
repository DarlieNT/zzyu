import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

interface User {
  sub: string;
  username: string;
  email?: string;
  groups?: string[];
  isAdmin?: boolean;
  // 可选的展示字段
  name?: string; // 来自 OIDC 的 name
  picture?: string; // 来自 OIDC 的 picture
  displayName?: string; // 前端规范化后的昵称
  avatarUrl?: string; // 前端规范化后的头像 URL
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const normalizeUser = (raw: any): User => {
    if (!raw) return raw;
    const emailPart = typeof raw.email === 'string' ? raw.email.split('@')[0] : undefined;
    const displayName = raw.displayName || raw.username || raw.name || raw.preferred_username || emailPart || '用户';
    const avatarUrl = raw.avatarUrl || raw.picture || undefined;
    return {
      sub: raw.sub,
      username: raw.username || raw.preferred_username || emailPart || raw.sub,
      email: raw.email,
      groups: raw.groups || [],
      isAdmin: !!raw.isAdmin,
      name: raw.name,
      picture: raw.picture,
      displayName,
      avatarUrl,
    } as User;
  };

  const checkAuth = async () => {
    try {
      // First check if user data exists in cookies
      const userDataCookie = Cookies.get('user_data');
      if (userDataCookie) {
        try {
          const userData = JSON.parse(userDataCookie);
          setUser(normalizeUser(userData));
        } catch (error) {
          console.error('Failed to parse user data from cookie:', error);
        }
      }

      // Then verify with server
      const response = await axios.get('/api/auth/user');
      
      if (response.data.user) {
        setUser(normalizeUser(response.data.user));
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      
      // Clear invalid tokens
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user_data');
      setUser(null);
      
      // Show error message if it's not a simple 401
      if (error.response?.status !== 401) {
        toast.error('认证检查失败，请重新登录');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = () => {
    const clientId = process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI;
    const authUrl = 'https://conn.nodeloc.cc/oauth2/auth';
    
    if (!clientId || !redirectUri) {
      toast.error('OAuth配置缺失');
      return;
    }
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile',
      state: Math.random().toString(36).substring(2, 15), // 生成至少8个字符的随机字符串
    });

    window.location.href = `${authUrl}?${params.toString()}`;
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      Cookies.remove('access_token');
      Cookies.remove('refresh_token');
      Cookies.remove('user_data');
      Cookies.remove('login_type');
      setUser(null);
      toast.success('已成功退出登录');
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('退出登录失败');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};