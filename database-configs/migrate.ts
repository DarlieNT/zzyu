import fs from 'fs';
import path from 'path';

// 通用迁移接口
interface MigrationTarget {
  migrateAttempts(attempts: any): Promise<void>;
  migrateCodes(codes: any): Promise<void>;
}

// 读取现有JSON数据
function loadExistingData() {
  const dataDir = path.join(process.cwd(), 'data');
  
  let attempts = {};
  let codes = { available: {}, distributed: [] };
  
  try {
    if (fs.existsSync(path.join(dataDir, 'lottery-attempts.json'))) {
      attempts = JSON.parse(fs.readFileSync(path.join(dataDir, 'lottery-attempts.json'), 'utf8'));
    }
    
    if (fs.existsSync(path.join(dataDir, 'redemption-codes.json'))) {
      codes = JSON.parse(fs.readFileSync(path.join(dataDir, 'redemption-codes.json'), 'utf8'));
    }
  } catch (error) {
    console.error('Error loading existing data:', error);
  }
  
  return { attempts, codes };
}

// Vercel KV 迁移器
class VercelKVMigration implements MigrationTarget {
  async migrateAttempts(attempts: any) {
    const { kv } = await import('@vercel/kv');
    
    for (const [userId, data] of Object.entries(attempts as any)) {
      const key = `lottery:attempts:${userId}:${data.date}`;
      await kv.set(key, data.attempts);
      await kv.expire(key, 86400); // 24小时过期
    }
    
    console.log('✅ Attempts migrated to Vercel KV');
  }
  
  async migrateCodes(codes: any) {
    const { kv } = await import('@vercel/kv');
    
    // 迁移可用兑换码
    for (const [value, codeList] of Object.entries(codes.available as any)) {
      if (codeList.length > 0) {
        await kv.lpush(`codes:available:${value}`, ...codeList);
      }
    }
    
    // 迁移已分发兑换码
    for (const distributedCode of codes.distributed) {
      const userKey = `codes:distributed:${distributedCode.userId}`;
      const existingCodes = await kv.get(userKey) || [];
      existingCodes.push(distributedCode);
      await kv.set(userKey, existingCodes);
    }
    
    console.log('✅ Codes migrated to Vercel KV');
  }
}

// MongoDB 迁移器
class MongoDBMigration implements MigrationTarget {
  async migrateAttempts(attempts: any) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('lottery');
    
    const documents = Object.entries(attempts as any).map(([userId, data]: [string, any]) => ({
      userId,
      date: data.date,
      attempts: data.attempts,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    if (documents.length > 0) {
      await db.collection('lottery_attempts').insertMany(documents);
    }
    
    await client.close();
    console.log('✅ Attempts migrated to MongoDB');
  }
  
  async migrateCodes(codes: any) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI!);
    await client.connect();
    const db = client.db('lottery');
    
    // 迁移可用兑换码
    const availableCodeDocs = [];
    for (const [value, codeList] of Object.entries(codes.available as any)) {
      const prizeName = value === '40' ? '一等奖' : value === '30' ? '二等奖' : value === '20' ? '三等奖' : '四等奖';
      for (const code of codeList) {
        availableCodeDocs.push({
          code,
          value: parseInt(value),
          prizeName,
          status: 'available',
          createdAt: new Date()
        });
      }
    }
    
    // 迁移已分发兑换码
    const distributedCodeDocs = codes.distributed.map((item: any) => ({
      code: item.code,
      value: item.value,
      prizeName: item.prizeName,
      status: 'distributed',
      userId: item.userId,
      createdAt: new Date(item.createdAt),
      distributedAt: new Date(item.createdAt)
    }));
    
    const allCodes = [...availableCodeDocs, ...distributedCodeDocs];
    if (allCodes.length > 0) {
      await db.collection('redemption_codes').insertMany(allCodes, { ordered: false });
    }
    
    await client.close();
    console.log('✅ Codes migrated to MongoDB');
  }
}

// Supabase 迁移器
class SupabaseMigration implements MigrationTarget {
  async migrateAttempts(attempts: any) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const documents = Object.entries(attempts as any).map(([userId, data]: [string, any]) => ({
      user_id: userId,
      attempt_date: data.date,
      attempts_count: data.attempts
    }));
    
    if (documents.length > 0) {
      const { error } = await supabase
        .from('lottery_attempts')
        .insert(documents);
      
      if (error) {
        console.error('Error migrating attempts to Supabase:', error);
      } else {
        console.log('✅ Attempts migrated to Supabase');
      }
    }
  }
  
  async migrateCodes(codes: any) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // 迁移可用兑换码
    const availableCodeDocs = [];
    for (const [value, codeList] of Object.entries(codes.available as any)) {
      const prizeName = value === '40' ? '一等奖' : value === '30' ? '二等奖' : value === '20' ? '三等奖' : '四等奖';
      for (const code of codeList) {
        availableCodeDocs.push({
          code,
          value: parseInt(value),
          prize_name: prizeName,
          status: 'available'
        });
      }
    }
    
    // 迁移已分发兑换码
    const distributedCodeDocs = codes.distributed.map((item: any) => ({
      code: item.code,
      value: item.value,
      prize_name: item.prizeName,
      status: 'distributed',
      user_id: item.userId,
      distributed_at: item.createdAt
    }));
    
    const allCodes = [...availableCodeDocs, ...distributedCodeDocs];
    if (allCodes.length > 0) {
      const { error } = await supabase
        .from('redemption_codes')
        .insert(allCodes);
      
      if (error) {
        console.error('Error migrating codes to Supabase:', error);
      } else {
        console.log('✅ Codes migrated to Supabase');
      }
    }
  }
}

// Vercel Postgres 迁移器
class VercelPostgresMigration implements MigrationTarget {
  async migrateAttempts(attempts: any) {
    const { sql } = await import('@vercel/postgres');
    
    for (const [userId, data] of Object.entries(attempts as any)) {
      await sql`
        INSERT INTO lottery_attempts (user_id, attempt_date, attempts_count)
        VALUES (${userId}, ${data.date}, ${data.attempts})
        ON CONFLICT (user_id, attempt_date) DO NOTHING
      `;
    }
    
    console.log('✅ Attempts migrated to Vercel Postgres');
  }
  
  async migrateCodes(codes: any) {
    const { sql } = await import('@vercel/postgres');
    
    // 迁移可用兑换码
    for (const [value, codeList] of Object.entries(codes.available as any)) {
      const prizeName = value === '40' ? '一等奖' : value === '30' ? '二等奖' : value === '20' ? '三等奖' : '四等奖';
      for (const code of codeList) {
        try {
          await sql`
            INSERT INTO redemption_codes (code, value, prize_name, status)
            VALUES (${code}, ${parseInt(value)}, ${prizeName}, 'available')
          `;
        } catch (error) {
          console.warn(`Code ${code} already exists, skipping...`);
        }
      }
    }
    
    // 迁移已分发兑换码
    for (const item of codes.distributed) {
      try {
        await sql`
          INSERT INTO redemption_codes (code, value, prize_name, status, user_id, distributed_at)
          VALUES (${item.code}, ${item.value}, ${item.prizeName}, 'distributed', ${item.userId}, ${item.createdAt})
        `;
      } catch (error) {
        console.warn(`Code ${item.code} already exists, skipping...`);
      }
    }
    
    console.log('✅ Codes migrated to Vercel Postgres');
  }
}

// 主迁移函数
export async function migrateToDatabase(target: 'kv' | 'mongodb' | 'supabase' | 'postgres') {
  console.log(`🚀 Starting migration to ${target.toUpperCase()}...`);
  
  const { attempts, codes } = loadExistingData();
  
  let migrator: MigrationTarget;
  
  switch (target) {
    case 'kv':
      migrator = new VercelKVMigration();
      break;
    case 'mongodb':
      migrator = new MongoDBMigration();
      break;
    case 'supabase':
      migrator = new SupabaseMigration();
      break;
    case 'postgres':
      migrator = new VercelPostgresMigration();
      break;
    default:
      throw new Error(`Unsupported migration target: ${target}`);
  }
  
  try {
    await migrator.migrateAttempts(attempts);
    await migrator.migrateCodes(codes);
    console.log(`✅ Migration to ${target.toUpperCase()} completed successfully!`);
  } catch (error) {
    console.error(`❌ Migration to ${target.toUpperCase()} failed:`, error);
  }
}

// 使用示例
if (require.main === module) {
  const target = process.argv[2] as 'kv' | 'mongodb' | 'supabase' | 'postgres';
  
  if (!target || !['kv', 'mongodb', 'supabase', 'postgres'].includes(target)) {
    console.log('Usage: node migrate.js [kv|mongodb|supabase|postgres]');
    process.exit(1);
  }
  
  migrateToDatabase(target).catch(console.error);
}