import type { NextApiRequest, NextApiResponse } from 'next';

// 后端统一返回奖品顺序（与抽奖逻辑一致），前端用此顺序渲染与计算角度
// 注意：颜色仅用于前端展示
const prizes = [
  { id: 1, name: '一等奖', value: 40, probability: 0.05, color: '#ff6b6b' },
  { id: 2, name: '二等奖', value: 30, probability: 0.1,  color: '#4ecdc4' },
  { id: 3, name: '三等奖', value: 20, probability: 0.15, color: '#45b7d1' },
  { id: 4, name: '四等奖', value: 10, probability: 0.2,  color: '#96ceb4' },
  { id: 0, name: '谢谢惠顾', value: 0,  probability: 0.5,  color: '#feca57' },
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.status(200).json({ prizes });
}
