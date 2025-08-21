import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import axios from 'axios';

// 奖品类型定义（保持与后端一致）。probability 在转盘渲染中未直接使用。
interface Prize {
  id: number;
  name: string;
  value: number;
  color: string;
  probability?: number;
}

// 默认奖品顺序（作为后备）；实际会在页面加载时通过 API 拉取以保持一致
let PRIZE_ORDER: Prize[] = [
  { id: 1, name: '一等奖', value: 40, color: '#ff6b6b', probability: 0.05 },
  { id: 2, name: '二等奖', value: 30, color: '#4ecdc4', probability: 0.1 },
  { id: 3, name: '三等奖', value: 20, color: '#45b7d1', probability: 0.15 },
  { id: 4, name: '四等奖', value: 10, color: '#96ceb4', probability: 0.2 },
  { id: 0, name: '谢谢惠顾', value: 0, color: '#feca57', probability: 0.5 },
];

export default function Lottery() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserAttempts();
    }
  }, [user]);

  // 同步服务端奖品顺序
  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const res = await axios.get('/api/lottery/prizes');
        if (Array.isArray(res.data?.prizes) && res.data.prizes.length > 0) {
          PRIZE_ORDER = res.data.prizes;
        }
      } catch (e) {
        console.error('加载奖品顺序失败，使用默认顺序', e);
      }
    };
    fetchPrizes();
  }, []);

  const fetchUserAttempts = async () => {
    try {
      const response = await axios.get('/api/lottery/attempts');
      setAttemptsLeft(response.data.attemptsLeft);
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const spinWheel = async () => {
    if (isSpinning || attemptsLeft <= 0) return;

    setIsSpinning(true);
    
    try {
      const response = await axios.post('/api/lottery/spin');
      const { prize, code, attemptsLeft: newAttempts } = response.data;
      
      // 使用与渲染完全一致的顺序，确保显示与发放一致
      const prizeIndex = PRIZE_ORDER.findIndex(p => p.id === prize.id);
      
      if (prizeIndex === -1) {
        console.error('奖品匹配失败:', prize);
        toast.error('奖品匹配失败，请联系管理员');
        setIsSpinning(false);
        return;
      }

      const segmentAngle = 360 / PRIZE_ORDER.length;
      // 目标角度（从12点钟方向起，顺时针），取扇区中心
      const targetAngle = prizeIndex * segmentAngle + (segmentAngle / 2);

      // 计算基于当前旋转的校正量，确保每次都精准指向目标
      setRotation((prev) => {
        // 当前角度归一化到 [0, 360)
        const current = ((prev % 360) + 360) % 360;
        // 期望指向的绝对角度（轮盘顺时针转 R 后，targetAngle + R 应该 ≡ 0）
        // 等价于 R ≡ (360 - targetAngle)
        const desired = (360 - targetAngle) % 360;
        // 需要补的差值（0..360）
        const delta = (desired - current + 360) % 360;
        // 额外多转的整圈数（8~12 圈）
        const extraSpins = 360 * (8 + Math.floor(Math.random() * 5));
        return prev + extraSpins + delta;
      });
      setAttemptsLeft(newAttempts);

      // 记录抽奖结果用于调试
      console.log('抽奖结果:', {
        prizeId: prize.id,
        prizeName: prize.name,
        prizeIndex,
        targetAngle
      });

      // Show result after animation
      setTimeout(() => {
        if (prize.value > 0) {
          toast.success(`🎉 恭喜获得${prize.name}！兑换码：${code}`, {
            duration: 5000,
            style: {
              background: '#10B981',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }
          });
        } else {
          toast.error('😔 谢谢惠顾，再接再厉！', {
            duration: 3000,
            style: {
              background: '#EF4444',
              color: 'white',
              fontSize: '16px'
            }
          });
        }
        setIsSpinning(false);
      }, 5000);

    } catch (error: any) {
      console.error('Spin failed:', error);
      toast.error(error.response?.data?.error || '抽奖失败，请重试');
      setIsSpinning(false);
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

  return (
    <ProtectedRoute>
      <Head>
        <title>幸运大转盘 - ZZYU投喂站</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
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
                <h1 className="text-xl font-semibold text-gray-900">幸运大转盘</h1>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎰 幸运大转盘</h2>
            <p className="text-gray-600 mb-2">每日5次抽奖机会，试试您的运气！</p>
            <div className="text-lg font-semibold text-primary-600 mb-4">
              剩余次数：{attemptsLeft}/5
            </div>
            {/* 抽奖记录入口已移除，历史将展示在“我的兑换码”页面 */}
          </div>

          {/* Lottery Wheel */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Wheel Container */}
              <div className="relative w-96 h-96">
                <svg
                  width="384"
                  height="384"
                  className="absolute inset-0"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 5s cubic-bezier(0.23, 1, 0.32, 1)' : 'none'
                  }}
                >
                    {PRIZE_ORDER.map((prize, index) => {
                    // 从12点钟方向开始，顺时针绘制，与服务端顺序一致
                      const angle = (360 / PRIZE_ORDER.length) * index;
                      const nextAngle = (360 / PRIZE_ORDER.length) * (index + 1);
                    const startX = 192 + 170 * Math.cos(((angle - 90) * Math.PI) / 180);
                    const startY = 192 + 170 * Math.sin(((angle - 90) * Math.PI) / 180);
                    const endX = 192 + 170 * Math.cos(((nextAngle - 90) * Math.PI) / 180);
                    const endY = 192 + 170 * Math.sin(((nextAngle - 90) * Math.PI) / 180);

                    return (
                      <g key={prize.id}>
                        <path
                          d={`M 192 192 L ${startX} ${startY} A 170 170 0 0 1 ${endX} ${endY} Z`}
                          fill={prize.color}
                          stroke="#fff"
                          strokeWidth="3"
                        />
                        <text
                          x={192 + 120 * Math.cos(((angle + nextAngle) / 2 - 90) * Math.PI / 180)}
                          y={192 + 120 * Math.sin(((angle + nextAngle) / 2 - 90) * Math.PI / 180)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="16"
                          fontWeight="bold"
                        >
                          {prize.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Center Circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg border-4 border-gray-300 flex items-center justify-center">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
              </div>

              {/* Pointer - Fixed direction and size */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-1 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-red-500 shadow-lg drop-shadow-md"></div>
              </div>
            </div>
          </div>

          {/* Spin Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={spinWheel}
              disabled={isSpinning || attemptsLeft <= 0}
              className="px-12 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xl font-bold rounded-full shadow-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {isSpinning ? '转盘中...' : attemptsLeft > 0 ? '开始抽奖' : '今日次数已用完'}
            </button>
          </div>

          {/* Prize Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">奖品说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {PRIZE_ORDER.map((prize) => (
                <div key={prize.id} className="text-center p-4 rounded-lg" style={{ backgroundColor: prize.color + '20' }}>
                  <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: prize.color }}></div>
                  <h4 className="font-semibold text-gray-900">{prize.name}</h4>
                  <p className="text-sm text-gray-600">
                    {prize.value > 0 ? `${prize.value}次兑换码` : '再接再厉'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}