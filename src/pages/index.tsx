import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LoginForm from '@/components/LoginForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Handle OAuth error messages from URL parameters
  useEffect(() => {
    const { error } = router.query;
    if (error) {
      switch (error) {
        case 'banned':
          toast.error('账号已被封禁，如有疑问请联系管理员');
          break;
        case 'auth_failed':
          toast.error('登录失败，请重试');
          break;
        case 'no_code':
          toast.error('授权码缺失，请重新登录');
          break;
        case 'token_exchange_failed':
          toast.error('令牌交换失败，请重试');
          break;
        case 'config_missing':
          toast.error('OAuth配置缺失，请联系管理员');
          break;
        default:
          toast.error('登录过程中发生错误');
      }
      // Clean URL
      router.replace('/', undefined, { shallow: true });
    }
  }, [router.query.error, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ZZYU投喂站 - 用户登录</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              欢迎使用ZZYU投喂站
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              使用 NodeLoc 账号或管理员账号登录
            </p>
          </div>
          
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-gray-500">
                  安全登录保障
                </span>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-gray-500 text-xs">OAuth2</div>
                <div className="text-gray-700 font-medium text-sm">认证</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">SSL</div>
                <div className="text-gray-700 font-medium text-sm">加密</div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-xs">隐私</div>
                <div className="text-gray-700 font-medium text-sm">保护</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}