import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import axios from 'axios';

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'oauth' | 'admin'>('oauth');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const handleOAuthLogin = () => {
    setIsLoading(true);
    try {
      login();
    } catch (error) {
      toast.error('登录失败，请重试');
      setIsLoading(false);
    }
  };

  const onAdminLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/auth/admin-login', {
        username: data.username,
        password: data.password,
      });

      if (response.data.success) {
        toast.success('管理员登录成功');
        // 强制刷新页面以确保AuthContext重新加载用户数据
        window.location.href = '/dashboard';
      } else {
        toast.error('用户名或密码错误');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      if (error.response?.status === 401) {
        toast.error('用户名或密码错误');
      } else {
        toast.error('登录失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-effect rounded-2xl p-8 space-y-6">
      {/* Login Mode Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setLoginMode('oauth')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            loginMode === 'oauth'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          NodeLoc 登录
        </button>
        <button
          type="button"
          onClick={() => setLoginMode('admin')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            loginMode === 'admin'
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          管理员登录
        </button>
      </div>

      {loginMode === 'oauth' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            使用您的 NodeLoc 账号登录
          </p>
          <button
            type="button"
            onClick={handleOAuthLogin}
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在跳转...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                使用 NodeLoc 账号登录
              </>
            )}
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onAdminLogin)}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              管理员用户名
            </label>
            <input
              {...register('username', {
                required: '请输入用户名',
                minLength: {
                  value: 3,
                  message: '用户名至少需要3个字符',
                },
              })}
              type="text"
              autoComplete="username"
              className={`input-field ${errors.username ? 'border-red-500' : ''}`}
              placeholder="输入管理员用户名"
              disabled={isLoading}
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <input
              {...register('password', {
                required: '请输入密码',
                minLength: {
                  value: 6,
                  message: '密码至少需要6个字符',
                },
              })}
              type="password"
              autoComplete="current-password"
              className={`input-field ${errors.password ? 'border-red-500' : ''}`}
              placeholder="输入管理员密码"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                正在登录...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                管理员登录
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}