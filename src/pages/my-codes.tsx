import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import axios from 'axios';

interface HistoryRecord {
  id: string;
  prizeName: string;
  prizeValue: number;
  code: string | null;
  timestamp: string;
  verified: boolean;
}

export default function MyCodes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/lottery/history');
        setRecords(res.data.records || []);
      } catch (e: any) {
        setError(e?.response?.data?.error || '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ProtectedRoute>
      <Head>
        <title>我的兑换码 · 抽奖记录</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <nav className="bg-white/80 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="h-14 flex items-center justify-between">
              <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900 flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                返回控制台
              </button>
              <h1 className="text-lg font-semibold">我的兑换码 / 抽奖记录</h1>
              <div />
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold">
                总计 <span className="text-indigo-600">{records.length}</span> 次抽奖记录
              </h2>
              <div className="text-sm text-gray-500">最新在前</div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-gray-500">加载中...</div>
            ) : error ? (
              <div className="py-16 text-center text-red-500">{error}</div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center text-gray-500">暂无记录</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">时间</th>
                      <th className="px-4 py-3 text-left font-medium">奖品</th>
                      <th className="px-4 py-3 text-left font-medium">价值</th>
                      <th className="px-4 py-3 text-left font-medium">兑换码</th>
                      <th className="px-4 py-3 text-left font-medium">验证状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {records.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{new Date(r.timestamp).toLocaleString('zh-CN')}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{r.prizeName}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{r.prizeValue > 0 ? `${r.prizeValue}次` : '-'}</td>
                        <td className="px-4 py-3">
                          {r.code ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono">{r.code}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {r.verified ? '✓ 已验证' : '未验证'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}