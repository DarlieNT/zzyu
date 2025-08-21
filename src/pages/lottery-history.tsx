import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import axios from 'axios';

interface LotteryResult {
  id: string;
  userId: string;
  prizeId: number;
  prizeName: string;
  prizeValue: number;
  code: string | null;
  timestamp: string;
  verified: boolean;
}

export default function LotteryHistory() {
  const { user } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<LotteryResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLotteryHistory();
    }
  }, [user]);

  const fetchLotteryHistory = async () => {
    try {
      const response = await axios.get('/api/lottery/history');
      setResults(response.data.records || []);
    } catch (error) {
      console.error('Failed to fetch lottery history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>抽奖记录 - ZZYU投喂站</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/lottery')}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回抽奖
                </button>
              </div>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">抽奖记录</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">📋 我的抽奖记录</h2>
            <p className="text-gray-600">查看您的所有抽奖历史和验证信息</p>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无抽奖记录</h3>
              <p className="text-gray-600 mb-6">您还没有进行过抽奖，快去试试运气吧！</p>
              <button
                onClick={() => router.push('/lottery')}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                立即抽奖
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  总计 {results.length} 次抽奖记录
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        奖品
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        价值
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        兑换码
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        验证状态
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(result.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              result.prizeValue > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {result.prizeName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.prizeValue > 0 ? `${result.prizeValue}次` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                          {result.code ? (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {result.code}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            result.verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.verified ? '✓ 已验证' : '✗ 未验证'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 统计信息 */}
          {results.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {results.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">总抽奖次数</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {results.filter(r => r.prizeValue > 0).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">中奖次数</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {results.reduce((sum, r) => sum + r.prizeValue, 0)}
                </div>
                <div className="text-sm text-gray-600 mt-1">累计获得次数</div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {results.filter(r => r.verified).length}
                </div>
                <div className="text-sm text-gray-600 mt-1">验证通过</div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}