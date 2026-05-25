import 'dotenv/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@prisma/client';

function hashPassword(password: string, salt: string): string {
  return createHash('sha256').update(`${password}.${salt}`).digest('hex');
}

function createPasswordFields(password: string) {
  const passwordSalt = randomBytes(16).toString('hex');
  return {
    passwordSalt,
    passwordHash: hashPassword(password, passwordSalt),
  };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for seed');
  }

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.info('Seed skipped: database already has data');
      return;
    }

    const adminPassword = createPasswordFields('demo123');

    await prisma.user.createMany({
      data: [
        {
          id: 'u-001',
          name: '王超',
          phone: '13800001001',
          email: 'wangchao@example.com',
          avatar: null,
          role: 'super_admin',
          status: '启用',
          createdAt: new Date('2024-01-10T00:00:00.000Z'),
          ...adminPassword,
        },
        {
          id: 'u-002',
          name: '李敏',
          phone: '13800001002',
          email: 'limin@example.com',
          role: 'admin',
          status: '启用',
          createdAt: new Date('2024-02-15T00:00:00.000Z'),
          ...createPasswordFields('demo123'),
        },
        {
          id: 'u-003',
          name: '张强',
          phone: '13800001003',
          email: 'zhangqiang@example.com',
          role: 'employee',
          status: '启用',
          createdAt: new Date('2024-03-01T00:00:00.000Z'),
          ...createPasswordFields('demo123'),
        },
        {
          id: 'u-004',
          name: '赵会计',
          phone: '13800001004',
          email: 'finance@example.com',
          role: 'finance',
          status: '启用',
          createdAt: new Date('2024-03-20T00:00:00.000Z'),
          ...createPasswordFields('demo123'),
        },
        {
          id: 'u-005',
          name: '陈业主',
          phone: '13800001005',
          email: 'chen@example.com',
          role: 'user',
          status: '启用',
          createdAt: new Date('2024-04-05T00:00:00.000Z'),
          ...createPasswordFields('demo123'),
        },
        {
          id: 'u-006',
          name: '刘试用',
          phone: '13800001006',
          role: 'employee',
          status: '禁用',
          createdAt: new Date('2024-05-01T00:00:00.000Z'),
        },
      ],
    });

    await prisma.material.createMany({
      data: [
        {
          id: 'mat-001',
          name: '水泥',
          category: '建材',
          unit: '袋',
          unitPrice: 45,
          stock: 500,
        },
        {
          id: 'mat-002',
          name: '瓷砖',
          category: '建材',
          unit: '㎡',
          unitPrice: 38,
          stock: 1200,
        },
        {
          id: 'mat-003',
          name: '防水涂料',
          category: '涂料',
          unit: '桶',
          unitPrice: 168,
          stock: 80,
        },
        {
          id: 'mat-004',
          name: '电线',
          category: '电气',
          unit: '米',
          unitPrice: 3.5,
          stock: 5000,
        },
        {
          id: 'mat-005',
          name: '开关插座',
          category: '电气',
          unit: '个',
          unitPrice: 12,
          stock: 300,
        },
      ],
    });

    await prisma.bill.createMany({
      data: [
        {
          id: 'bill-001',
          date: '2024-03-15',
          user: '张三',
          community: '阳光花园',
          unit: '1单元101',
          receivable: 12580,
          received: 10000,
          materials: [
            {
              id: 'm1',
              materialId: 'mat-001',
              name: '水泥',
              unit: '袋',
              quantity: 10,
              unitPrice: 45,
            },
            {
              id: 'm2',
              materialId: 'mat-002',
              name: '瓷砖',
              unit: '㎡',
              quantity: 120,
              unitPrice: 38,
            },
          ],
        },
        {
          id: 'bill-002',
          date: '2024-03-18',
          user: '李四',
          community: '翠湖名苑',
          unit: '3单元205',
          receivable: 8600,
          received: 8600,
          materials: [
            {
              id: 'm4',
              materialId: 'mat-004',
              name: '电线',
              unit: '米',
              quantity: 200,
              unitPrice: 3.5,
            },
          ],
        },
        {
          id: 'bill-003',
          date: '2024-03-20',
          user: '陈业主',
          community: '阳光花园',
          unit: '2单元302',
          receivable: 3200,
          received: 0,
          materials: [],
        },
      ],
    });

    await prisma.payment.createMany({
      data: [
        {
          id: 'pay-001',
          amount: 10000,
          status: 'success',
          email: 'zhangsan@example.com',
          billId: 'bill-001',
          paidAt: new Date('2024-03-16T10:00:00.000Z'),
          channel: 'wechat',
        },
        {
          id: 'pay-002',
          amount: 8600,
          status: 'success',
          email: 'lisi@example.com',
          billId: 'bill-002',
          paidAt: new Date('2024-03-19T14:30:00.000Z'),
          channel: 'alipay',
        },
        {
          id: 'pay-003',
          amount: 3200,
          status: 'pending',
          email: 'chen@example.com',
          billId: 'bill-003',
          channel: 'bank',
        },
      ],
    });

    console.info('Seed completed: demo users, materials, bills, payments');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
