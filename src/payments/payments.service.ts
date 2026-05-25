import { Injectable, NotFoundException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { toPaymentRecord } from '../common/mappers/entity.mapper';
import type { PaymentRecord, PaymentStatus } from '../common/storage/entities';
import {
  fuzzyIncludes,
  paginate,
  sortItems,
} from '../common/utils/pagination.util';
import { PrismaService } from '../prisma/prisma.service';

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['pending', 'processing', 'success', 'failed'])
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  billId?: string;
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListPaymentsQueryDto) {
    const payments = (await this.prisma.payment.findMany()).map(
      toPaymentRecord,
    );
    const filtered = sortItems(
      payments.filter((payment) => {
        return (
          (!query.status || payment.status === query.status) &&
          fuzzyIncludes(payment.email, query.email) &&
          (!query.billId || payment.billId === query.billId)
        );
      }),
      query.sortBy,
      query.sortOrder,
    );

    return paginate(filtered, query.page, query.pageSize);
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) throw new NotFoundException('支付记录不存在');
    return toPaymentRecord(payment);
  }

  async exportCsv(query: ListPaymentsQueryDto) {
    const { items } = await this.list({ ...query, page: 1, pageSize: 10_000 });
    const header = 'id,amount,status,email,billId,paidAt,channel';
    const rows = items.map((item: PaymentRecord) =>
      [
        item.id,
        item.amount,
        item.status,
        item.email,
        item.billId ?? '',
        item.paidAt ?? '',
        item.channel ?? '',
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
