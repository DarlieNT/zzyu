import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 使用服务角色密钥，绕过RLS限制
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 用户抽奖次数管理
export async function getUserTodayAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lottery_attempts')
    .select('attempts_count')
    .eq('user_id', userId)
    .eq('attempt_date', today)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error getting user attempts:', error);
    return 0;
  }

  return data?.attempts_count || 0;
}

export async function incrementUserAttempts(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('lottery_attempts')
    .upsert(
      {
        user_id: userId,
        attempt_date: today,
        attempts_count: 1,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id,attempt_date',
        ignoreDuplicates: false
      }
    )
    .select('attempts_count')
    .single();

  if (error) {
    // 如果是冲突，需要手动增加计数
    const { data: existing } = await supabase
      .from('lottery_attempts')
      .select('attempts_count')
      .eq('user_id', userId)
      .eq('attempt_date', today)
      .single();

    if (existing) {
      const newCount = existing.attempts_count + 1;
      const { data: updated } = await supabase
        .from('lottery_attempts')
        .update({
          attempts_count: newCount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('attempt_date', today)
        .select('attempts_count')
        .single();

      return updated?.attempts_count || newCount;
    }
  }

  return data?.attempts_count || 1;
}

// 兑换码管理
export async function getAvailableCode(value: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('redemption_codes')
    .select('id, code')
    .eq('status', 'available')
    .eq('value', value)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  // 更新状态为已分发
  const { error: updateError } = await supabase
    .from('redemption_codes')
    .update({
      status: 'distributed',
      distributed_at: new Date().toISOString()
    })
    .eq('id', data.id);

  if (updateError) {
    console.error('Error updating code status:', updateError);
    return null;
  }

  return data.code;
}

export async function distributeCodeToUser(
  code: string,
  userId: string,
  value: number,
  prizeName: string
): Promise<void> {
  // 更新兑换码归属
  const { error: updateError } = await supabase
    .from('redemption_codes')
    .update({ user_id: userId })
    .eq('code', code);

  if (updateError) {
    console.error('Error updating code ownership:', updateError);
    return;
  }

  // 获取兑换码ID
  const { data: codeData } = await supabase
    .from('redemption_codes')
    .select('id')
    .eq('code', code)
    .single();

  // 记录抽奖历史
  const { error: historyError } = await supabase
    .from('lottery_history')
    .insert({
      user_id: userId,
      prize_id: value === 40 ? 1 : value === 30 ? 2 : value === 20 ? 3 : 4,
      prize_name: prizeName,
      prize_value: value,
      redemption_code_id: codeData?.id
    });

  if (historyError) {
    console.error('Error inserting lottery history:', historyError);
  }
}

export async function getUserCodes(userId: string) {
  const { data, error } = await supabase
    .from('redemption_codes')
    .select('id, code, value, prize_name, distributed_at, status')
    .eq('user_id', userId)
    .order('distributed_at', { ascending: false });

  if (error) {
    console.error('Error getting user codes:', error);
    return [];
  }

  return data.map(code => ({
    id: code.id,
    code: code.code,
    value: code.value,
    prizeName: code.prize_name,
    createdAt: code.distributed_at,
    used: code.status === 'used'
  }));
}

export async function getCodeStatistics() {
  const { data, error } = await supabase
    .from('redemption_codes')
    .select('value, status')
    .order('value');

  if (error) {
    console.error('Error getting code statistics:', error);
    return {
      available: {},
      distributed: 0,
      total: 0
    };
  }

  const stats = {
    available: {} as Record<string, number>,
    distributed: 0,
    total: 0
  };

  data.forEach(item => {
    const valueKey = item.value.toString();
    if (item.status === 'available') {
      stats.available[valueKey] = (stats.available[valueKey] || 0) + 1;
    } else if (item.status === 'distributed') {
      stats.distributed++;
    }
    stats.total++;
  });

  return stats;
}

export async function importCodes(codes: string[], value: number): Promise<number> {
  const prizeName = value === 40 ? '一等奖' : value === 30 ? '二等奖' : value === 20 ? '三等奖' : '四等奖';

  const documents = codes.map(code => ({
    code,
    value,
    prize_name: prizeName,
    status: 'available'
  }));

  const { data, error } = await supabase
    .from('redemption_codes')
    .insert(documents)
    .select('id');

  if (error) {
    console.error('Error importing codes:', error);
    return 0;
  }

  return data?.length || 0;
}

// 客户端Supabase实例 (用于前端)
export function createClientSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}