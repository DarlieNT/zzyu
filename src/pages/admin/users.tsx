import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface Profile { sub: string; username?: string; email?: string; displayName?: string; avatarUrl?: string; lastLogin?: string; }
interface Code { id: string; code: string; value: number; prizeName: string; createdAt: string; used: boolean; }
interface History { id: string; prizeName: string; prizeValue: number; code: string | null; timestamp: string; verified: boolean; }

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [details, setDetails] = useState<{ codes: Code[]; history: History[] } | null>(null);
  const [banLoading, setBanLoading] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) { setLoading(false); return; }
    (async () => {
      try {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data.users || []);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const openDetails = async (u: Profile) => {
    setSelected(u);
    setDetails(null);
    const res = await axios.get('/api/admin/user-details', { params: { userId: u.sub } });
    setDetails({ codes: res.data.codes || [], history: res.data.history || [] });
  };

  const banUser = async (u: Profile) => {
    setBanLoading(true);
    try {
      await axios.post('/api/admin/ban-user', { userId: u.sub, username: u.username || u.displayName, reason: '违规' });
      alert('已封禁');
    } finally {
      setBanLoading(false);
    }
  };

  const unbanUser = async (u: Profile) => {
    setBanLoading(true);
    try {
      await axios.post('/api/admin/unban-user', { userId: u.sub });
      alert('已解封');
    } finally {
      setBanLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <Head>
        <title>用户管理 - 管理员</title>
      </Head>
      <div className="min-h-screen bg-gray-50 p-6">
        <h1 className="text-2xl font-bold mb-4">用户管理</h1>
        {!user?.isAdmin ? (
          <div className="text-red-600">需要管理员权限</div>
        ) : loading ? (
          <div>加载中...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">用户列表</h2>
              <ul className="divide-y">
                {users.map(u => (
                  <li key={u.sub} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.displayName || u.username} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">{(u.displayName || u.username || '?').charAt(0)}</div>
                      )}
                      <div>
                        <div className="font-medium">{u.displayName || u.username || u.sub}</div>
                        <div className="text-xs text-gray-500">{u.email || '-'}</div>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button className="px-2 py-1 text-sm bg-blue-500 text-white rounded" onClick={() => openDetails(u)}>详情</button>
                      <button className="px-2 py-1 text-sm bg-red-500 text-white rounded" onClick={() => banUser(u)} disabled={banLoading}>封禁</button>
                      <button className="px-2 py-1 text-sm bg-green-600 text-white rounded" onClick={() => unbanUser(u)} disabled={banLoading}>解封</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-3">用户详情</h2>
              {!selected ? (
                <div className="text-gray-500">点击左侧任一用户查看详细信息</div>
              ) : !details ? (
                <div>加载详情...</div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {selected.avatarUrl ? (
                      <img src={selected.avatarUrl} alt={selected.displayName || selected.username} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">{(selected.displayName || selected.username || '?').charAt(0)}</div>
                    )}
                    <div>
                      <div className="font-medium">{selected.displayName || selected.username || selected.sub}</div>
                      <div className="text-xs text-gray-500">{selected.email || '-'}</div>
                      <div className="text-xs text-gray-500">ID: {selected.sub}</div>
                      {selected.lastLogin && <div className="text-xs text-gray-500">上次登录：{new Date(selected.lastLogin).toLocaleString('zh-CN')}</div>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">兑换码记录</h3>
                    {details.codes.length === 0 ? (
                      <div className="text-gray-500">暂无兑换码</div>
                    ) : (
                      <ul className="space-y-2 max-h-60 overflow-auto">
                        {details.codes.map(c => (
                          <li key={c.id} className="text-sm flex items-center justify-between border p-2 rounded">
                            <div>
                              <div className="font-mono">{c.code}</div>
                              <div className="text-xs text-gray-500">{c.prizeName} · {c.value}次 · {new Date(c.createdAt).toLocaleString('zh-CN')}</div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${c.used ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'}`}>{c.used ? '已使用' : '未使用'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">抽奖历史</h3>
                    {details.history.length === 0 ? (
                      <div className="text-gray-500">暂无记录</div>
                    ) : (
                      <ul className="space-y-2 max-h-60 overflow-auto">
                        {details.history.map(h => (
                          <li key={h.id} className="text-sm flex items-center justify-between border p-2 rounded">
                            <div>{new Date(h.timestamp).toLocaleString('zh-CN')}</div>
                            <div>{h.prizeName} · {h.prizeValue > 0 ? `${h.prizeValue}次` : '-'}</div>
                            <div className="font-mono">{h.code || '-'}</div>
                            <span className={`text-xs px-2 py-0.5 rounded ${h.verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.verified ? '已验证' : '未验证'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
