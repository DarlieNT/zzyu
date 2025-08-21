import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import axios from 'axios';

interface LotterySettings {
  probabilities: { [prizeId: string]: number };
  dailyAttempts: number;
  prizes: Array<{
    id: number;
    name: string;
    value: number;
  }>;
}

interface BannedUser {
  userId: string;
  username: string;
  reason: string;
  bannedAt: string;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'lottery' | 'users' | 'system'>('lottery');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 抽奖设置
  const [lotterySettings, setLotterySettings] = useState<LotterySettings>({
    probabilities: {
      '1': 0.05,
      '2': 0.1,
      '3': 0.15,
      '4': 0.2,
      '0': 0.5
    },
    dailyAttempts: 5,
    prizes: [
      { id: 1, name: '一等奖', value: 40 },
      { id: 2, name: '二等奖', value: 30 },
      { id: 3, name: '三等奖', value: 20 },
      { id: 4, name: '四等奖', value: 10 }
    ]
  });

  // 用户管理
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [newBanUserId, setNewBanUserId] = useState('');
  const [newBanReason, setNewBanReason] = useState('');

  useEffect(() => {
    if (user) {
      if (!user.isAdmin) {
        router.push('/dashboard');
        return;
      }
      fetchSettings();
      fetchBannedUsers();
    }
  }, [user, router]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings');
      setLotterySettings(response.data.lottery || lotterySettings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBannedUsers = async () => {
    try {
      const response = await axios.get('/api/admin/banned-users');
      setBannedUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch banned users:', error);
    }
  };

  const saveLotterySettings = async () => {
    setSaving(true);
    try {
      await axios.post('/api/admin/settings', {
        lottery: lotterySettings
      });
      toast.success('抽奖设置已保存');
    } catch (error: any) {
      console.error('Save settings failed:', error);
      toast.error(error.response?.data?.error || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const banUser = async () => {
    if (!newBanUserId.trim() || !newBanReason.trim()) {
      toast.error('请填写用户ID和封禁原因');
      return;
    }

    try {
      await axios.post('/api/admin/ban-user', {
        userId: newBanUserId.trim(),
        reason: newBanReason.trim()
      });
      toast.success('用户已封禁');
      setNewBanUserId('');
      setNewBanReason('');
      fetchBannedUsers();
    } catch (error: any) {
      console.error('Ban user failed:', error);
      toast.error(error.response?.data?.error || '封禁失败');
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await axios.post('/api/admin/unban-user', { userId });
      toast.success('用户已解封');
      fetchBannedUsers();
    } catch (error: any) {
      console.error('Unban user failed:', error);
      toast.error(error.response?.data?.error || '解封失败');
    }
  };

  const updateProbability = (prizeId: string, probability: number) => {
    setLotterySettings(prev => ({
      ...prev,
      probabilities: {
        ...prev.probabilities,
        [prizeId]: probability
      }
    }));
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
        <title>系统设置 - ZZYU投喂站</title>
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
                <h1 className="text-xl font-semibold text-gray-900">系统设置</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">⚙️ 系统设置</h2>
            <p className="text-gray-600">管理抽奖系统配置和用户权限</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setActiveTab('lottery')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'lottery'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🎰 抽奖设置
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 用户管理
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'system'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔧 系统信息
            </button>
          </div>

          {/* Lottery Settings Tab */}
          {activeTab === 'lottery' && (
            <div className="space-y-6">
              {/* Prize Probabilities */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">奖项概率设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(lotterySettings.probabilities).map(([prizeId, probability]) => {
                    const prize = lotterySettings.prizes.find(p => p.id.toString() === prizeId) || 
                                 { name: '谢谢惠顾', value: 0 };
                    return (
                      <div key={prizeId} className="border rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {prize.name} ({prize.value > 0 ? `${prize.value}次` : '无奖励'})
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={probability}
                            onChange={(e) => updateProbability(prizeId, parseFloat(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium w-12">
                            {(probability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    总概率：{(Object.values(lotterySettings.probabilities).reduce((sum, p) => sum + p, 0) * 100).toFixed(0)}%
                    {Object.values(lotterySettings.probabilities).reduce((sum, p) => sum + p, 0) !== 1 && 
                      <span className="text-red-600 ml-2">⚠️ 总概率应为100%</span>
                    }
                  </p>
                </div>
              </div>

              {/* Daily Attempts */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">每日抽奖次数</h3>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-gray-700">
                    每用户每日可抽奖次数：
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={lotterySettings.dailyAttempts}
                    onChange={(e) => setLotterySettings(prev => ({
                      ...prev,
                      dailyAttempts: parseInt(e.target.value) || 5
                    }))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-500">次</span>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={saveLotterySettings}
                  disabled={saving}
                  className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : '保存抽奖设置'}
                </button>
              </div>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Ban User */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">封禁用户</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      用户ID
                    </label>
                    <input
                      type="text"
                      value={newBanUserId}
                      onChange={(e) => setNewBanUserId(e.target.value)}
                      placeholder="输入用户ID"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      封禁原因
                    </label>
                    <input
                      type="text"
                      value={newBanReason}
                      onChange={(e) => setNewBanReason(e.target.value)}
                      placeholder="输入封禁原因"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={banUser}
                      className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors"
                    >
                      封禁用户
                    </button>
                  </div>
                </div>
              </div>

              {/* Banned Users List */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">已封禁用户</h3>
                {bannedUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暂无封禁用户</p>
                ) : (
                  <div className="space-y-3">
                    {bannedUsers.map((user) => (
                      <div key={user.userId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{user.username || user.userId}</div>
                          <div className="text-sm text-gray-500">原因：{user.reason}</div>
                          <div className="text-xs text-gray-400">
                            封禁时间：{new Date(user.bannedAt).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <button
                          onClick={() => unbanUser(user.userId)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                        >
                          解封
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* System Info Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">系统信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">应用信息</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">应用名称：</span>
                        <span>ZZYU投喂站</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">版本：</span>
                        <span>1.0.0</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">框架：</span>
                        <span>Next.js 14</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">数据库</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">存储方式：</span>
                        <span>JSON文件</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">位置：</span>
                        <span>data/</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">备份：</span>
                        <span className="text-yellow-600">未配置</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}