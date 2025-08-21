import { sql } from '@vercel/postgres';
import type { NextApiRequest, NextApiResponse } from 'next';

// 数据库工具函数
export async function getUserTodayAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await sql`
    SELECT attempts_count 
    FROM lottery_attempts 
    WHERE user_id = ${userId} AND attempt_date = ${today}
  `;
  
  return result.rows[0]?.attempts_count || 0;
}

export async function incrementUserAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await sql`
    INSERT INTO lottery_attempts (user_id, attempt_date, attempts_count)
    VALUES (${userId}, ${today}, 1)
    ON CONFLICT (user_id, attempt_date)
    DO UPDATE SET 
      attempts_count = lottery_attempts.attempts_count + 1,
      updated_at = NOW()
    RETURNING attempts_count
  `;
  
  return result.rows[0].attempts_count;
}

export async function getAvailableCode(value: number): Promise<string | null> {
  const result = await sql`
    UPDATE redemption_codes 
    SET status = 'distributed', distributed_at = NOW()
    WHERE id = (
      SELECT id FROM redemption_codes 
      WHERE status = 'available' AND value = ${value}
      ORDER BY created_at ASC 
      LIMIT 1
    )
    RETURNING code
  `;
  
  return result.rows[0]?.code || null;
}

export async function distributeCodeToUser(
  code: string, 
  userId: string, 
  value: number, 
  prizeName: string
): Promise<void> {
  await sql`
    UPDATE redemption_codes 
    SET user_id = ${userId}
    WHERE code = ${code}
  `;
  
  // 记录抽奖历史
  await sql`
    INSERT INTO lottery_history (user_id, prize_id, prize_name, prize_value, redemption_code_id)
    VALUES (
      ${userId}, 
      ${value === 40 ? 1 : value === 30 ? 2 : value === 20 ? 3 : 4}, 
      ${prizeName}, 
      ${value},
      (SELECT id FROM redemption_codes WHERE code = ${code})
    )
  `;
}

export async function getUserCodes(userId: string) {
  const result = await sql`
    SELECT code, value, prize_name, distributed_at, status
    FROM redemption_codes 
    WHERE user_id = ${userId}
    ORDER BY distributed_at DESC
  `;
  
  return result.rows.map(row => ({
    id: row.code,
    code: row.code,
    value: row.value,
    prizeName: row.prize_name,
    createdAt: row.distributed_at,
    used: row.status === 'used'
  }));
}

export async function getCodeStatistics() {
  const result = await sql`
    SELECT 
      value,
      status,
      COUNT(*) as count
    FROM redemption_codes 
    GROUP BY value, status
    ORDER BY value, status
  `;
  
  const stats = {
    available: {} as Record<string, number>,
    distributed: 0,
    total: 0
  };
  
  result.rows.forEach(row => {
    const valueKey = row.value.toString();
    if (row.status === 'available') {
      stats.available[valueKey] = row.count;
    } else if (row.status === 'distributed') {
      stats.distributed += row.count;
    }
    stats.total += row.count;
  });
  
  return stats;
}

export async function importCodes(codes: string[], value: number): Promise<number> {
  let imported = 0;
  
  for (const code of codes) {
    try {
      await sql`
        INSERT INTO redemption_codes (code, value, prize_name)
        VALUES (
          ${code}, 
          ${value}, 
          ${value === 40 ? '一等奖' : value === 30 ? '二等奖' : value === 20 ? '三等奖' : '四等奖'}
        )
      `;
      imported++;
    } catch (error) {
      // 忽略重复的兑换码
      console.warn(`Code ${code} already exists`);
    }
  }
  
  return imported;
}