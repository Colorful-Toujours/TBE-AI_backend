import { Injectable } from '@nestjs/common';
import { IsIn, IsOptional } from 'class-validator';
import { toBillRecord, toMaterialRecord } from '../common/mappers/entity.mapper';
import { PrismaClient } from '@prisma/client';

export class DashboardRangeQueryDto {
  @IsOptional()
  @IsIn(['12m', '6m', '3m'])
  range?: '12m' | '6m' | '3m' = '12m';
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaClient) {}

  async summary() {
    const [bills, payments, materials] = await Promise.all([
      this.prisma.bill.findMany(),
      this.prisma.payment.findMany(),
      this.prisma.material.findMany(),
    ]);

    const totalBills = bills.length;
    const totalFlow = bills
      .map(toBillRecord)
      .reduce((sum, bill) => sum + bill.received, 0);
    const transactionCount = payments.length;
    const categoryCount = new Set(
      materials.map((item) => toMaterialRecord(item).category),
    ).size;
    const pendingCount = payments.filter(
      (item) => item.status === 'pending',
    ).length;

    return {
      totalBills,
      totalFlow,
      transactionCount,
      categoryCount,
      pendingCount,
      attachmentCount: 0,
      trends: {
        totalBills: { value: '+12.5%', direction: 'up' as const },
        totalFlow: { value: '+8.2%', direction: 'up' as const },
      },
    };
  }

  trends(_query: DashboardRangeQueryDto) {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
    return {
      points: months.map((month, index) => ({
        month,
        bills: 30 + index * 4,
        amount: 40 + index * 6,
      })),
    };
  }

  async categories(_query: DashboardRangeQueryDto) {
    const materials = (await this.prisma.material.findMany()).map(
      toMaterialRecord,
    );
    const map = new Map<string, { amount: number; count: number }>();
    for (const material of materials) {
      const current = map.get(material.category) ?? { amount: 0, count: 0 };
      current.amount += material.unitPrice * 10;
      current.count += 1;
      map.set(material.category, current);
    }

    return {
      items: [...map.entries()].map(([category, stats]) => ({
        category,
        ...stats,
      })),
    };
  }
}
