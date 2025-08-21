import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { useRouter } from 'next/router';

interface RecordItem {
  id: string;
  userId: string;
  prizeName: string;
  prizeValue: number;
  code: string | null;
  timestamp: string;
  verified: boolean;
}

export default function AdminRecords() {
  const { user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!user.isAdmin) {
      router.push('/dashboard');
      return;
    }
    (async () => {
      try {
        const res = await axios.get('/api/admin/lottery-records');
        setRecords(res.data.results || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, router]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return records;
    return records.filter(r =>
      r.userId.toLowerCase().includes(s) ||
      (r.code || '').toLowerCase().includes(s) ||
      r.prizeName.toLowerCase().includes(s)
    );
  }, [records, q]);

  return (
    <ProtectedRoute>
      <Head>
        <title>全站抽奖记录 - 管理员</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">全站抽奖记录</h1>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="搜索：用户ID/兑换码/奖品"
              className="border rounded px-3 py-2 text-sm"
            />
          </div>
          {loading ? (
            <div>加载中...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">时间</th>
                    <th className="px-3 py-2 text-left">用户ID</th>
                    <th className="px-3 py-2 text-left">奖品</th>
                    <th className="px-3 py-2 text-left">价值</th>
                    <th className="px-3 py-2 text-left">兑换码</th>
                    <th className="px-3 py-2 text-left">验证</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map(r => (
                    <tr key={r.id}>
                      <td className="px-3 py-2">{new Date(r.timestamp).toLocaleString('zh-CN')}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.userId}</td>
                      <td className="px-3 py-2">{r.prizeName}</td>
                      <td className="px-3 py-2">{r.prizeValue > 0 ? `${r.prizeValue}次` : '-'}</td>
                      <td className="px-3 py-2 font-mono">{r.code || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${r.verified ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{r.verified ? '已验证' : '未验证'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
