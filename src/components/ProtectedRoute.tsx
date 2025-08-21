import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import LoadingSpinner from '@/components/LoadingSpinner';
import axios from 'axios';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // 定时校验被封禁状态：若被封禁（403），则登出并跳回首页
  useEffect(() => {
    if (loading || !user) return;
    let timer: NodeJS.Timeout | null = null;
    const check = async () => {
      try {
        await axios.get('/api/auth/user');
      } catch (e: any) {
        const status = e?.response?.status;
        if (status === 403) {
          await logout();
          router.push('/');
        }
      }
    };
    // 立即检查一次，然后每60s检查一次
    check();
    timer = setInterval(check, 60000);
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, user, logout, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}