import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import axios from 'axios';

interface CodeStats {
  available: { [value: string]: number };
  distributed: number;
  total: number;
}

interface CodesList {
  available: { [value: string]: string[] };
  distributed: Array<{
    id: string;
    code: string;
    value: number;
    prizeName: string;
    userId: string;
    createdAt: string;
    used: boolean;
  }>;
}

export default function AdminCodes() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [selectedValue, setSelectedValue] = useState('10');
  const [list, setList] = useState<CodesList | null>(null);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchStats();
  fetchList();
    }
  }, [user, router]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/codes/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('获取统计信息失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchList = async () => {
    setListLoading(true);
    try {
      const response = await axios.get('/api/admin/codes/list');
      const data = response.data || {};
      setList({
        available: data.available || {},
        distributed: Array.isArray(data.distributed) ? data.distributed : [],
      });
    } catch (error) {
      console.error('Failed to fetch codes list:', error);
      toast.error('获取兑换码列表失败');
    } finally {
      setListLoading(false);
    }
  };

  const importCodes = async () => {
    if (!codeInput.trim()) {
      toast.error('请输入兑换码');
      return;
    }

    const codes = codeInput
      .split('\n')
      .map(code => code.trim())
      .filter(code => code.length > 0);

    if (codes.length === 0) {
      toast.error('请输入有效的兑换码');
      return;
    }

    setImporting(true);
    try {
      const response = await axios.post('/api/admin/codes/import', {
        codes,
        value: parseInt(selectedValue)
      });

      toast.success(`成功导入 ${response.data.imported} 个兑换码`);
      setCodeInput('');
      fetchStats();
  fetchList();
    } catch (error: any) {
      console.error('Import failed:', error);
      toast.error(error.response?.data?.error || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const addSingleCode = async () => {
    const value = parseInt(selectedValue);
    const code = codeInput.trim();
    if (!code) return toast.error('请输入兑换码');
    try {
      await axios.post('/api/admin/codes/add', { value, code });
      toast.success('添加成功');
      setCodeInput('');
      fetchStats();
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '添加失败');
    }
  };

  const deleteAvailableCode = async (value: number, code: string) => {
    if (!confirm(`确认删除 ${value}次 的兑换码 ${code} 吗？`)) return;
    try {
      await axios.post('/api/admin/codes/delete', { scope: 'available', value, code });
      toast.success('已删除');
      fetchStats();
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '删除失败');
    }
  };

  const deleteDistributedRecord = async (id: string) => {
    if (!confirm('确认删除该发放记录吗？此操作不可恢复')) return;
    try {
      await axios.post('/api/admin/codes/delete', { scope: 'distributed', id });
      toast.success('已删除');
      fetchStats();
      fetchList();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || '删除失败');
    }
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

  if (!user?.isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">访问被拒绝</h1>
            <p className="text-gray-600 mb-6">您没有权限访问此页面</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              返回控制台
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Head>
        <title>兑换码管理 - ZZYU投喂站</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回控制台
                </button>
              </div>
              <div className="flex items-center">
                <span className="mr-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">管理员</span>
                <h1 className="text-xl font-semibold text-gray-900">兑换码管理</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎫 兑换码管理</h2>
            <p className="text-gray-600">管理幸运大转盘的兑换码库存</p>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">总兑换码</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Object.values(stats.available).reduce((sum, count) => sum + count, 0)}
                </div>
                <div className="text-sm text-gray-600">可用兑换码</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.distributed}</div>
                <div className="text-sm text-gray-600">已发放</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round((stats.distributed / stats.total) * 100) || 0}%
                </div>
                <div className="text-sm text-gray-600">发放率</div>
              </div>
            </div>
          )}

          {/* Available Codes by Value */}
          {stats && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">各面额兑换码库存</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['10', '20', '30', '40'].map(value => (
                  <div key={value} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.available[value] || 0}
                    </div>
                    <div className="text-sm text-gray-600">{value}次 兑换码</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Codes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">导入新兑换码</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                兑换码面额
              </label>
              <select
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="10">10次 (四等奖)</option>
                <option value="20">20次 (三等奖)</option>
                <option value="30">30次 (二等奖)</option>
                <option value="40">40次 (一等奖)</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                兑换码列表 (每行一个)
              </label>
              <textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="请输入兑换码，每行一个：&#10;CODE1234567890&#10;CODE0987654321&#10;..."
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                当前输入了 {codeInput.split('\n').filter(line => line.trim().length > 0).length} 个兑换码
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={importCodes}
                disabled={importing || !codeInput.trim()}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? '导入中...' : '导入兑换码'}
              </button>
              <button
                onClick={addSingleCode}
                disabled={!codeInput.trim()}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                快速添加单个
              </button>
            </div>
          </div>

          {/* List & Manage Codes */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">兑换码列表与发放记录</h3>
            {listLoading ? (
              <div className="text-gray-500">加载中...</div>
            ) : !list ? (
              <div className="text-gray-500">暂无数据</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">可用兑换码</h4>
                  {Object.entries(list.available || {}).length === 0 && <div className="text-sm text-gray-500">暂无</div>}
                  {Object.entries(list.available || {}).map(([value, arr]) => (
                    <div key={value} className="mb-4">
                      <div className="text-sm text-gray-700 mb-1">{value}次（{arr.length}）</div>
                      <ul className="max-h-60 overflow-auto border rounded divide-y">
                        {arr.map(code => (
                          <li key={code} className="flex items-center justify-between px-3 py-2 text-sm">
                            <span className="font-mono">{code}</span>
                            <button onClick={() => deleteAvailableCode(parseInt(value), code)} className="text-red-600 hover:underline">删除</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">已发放记录</h4>
                  {(list.distributed || []).length === 0 && <div className="text-sm text-gray-500">暂无</div>}
                  <ul className="max-h-96 overflow-auto border rounded divide-y">
                    {(list.distributed || []).map(item => (
                      <li key={item.id} className="px-3 py-2 text-sm grid grid-cols-5 gap-2 items-center">
                        <div className="col-span-2 font-mono">{item.code}</div>
                        <div>{item.prizeName}·{item.value}次</div>
                        <div className="text-gray-500">{new Date(item.createdAt).toLocaleString('zh-CN')}</div>
                        <button onClick={() => deleteDistributedRecord(item.id)} className="text-red-600 hover:underline text-right">删除</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}