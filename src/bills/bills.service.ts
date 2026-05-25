import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AuditService } from '../common/services/audit.service';
import { toBillRecord } from '../common/mappers/entity.mapper';
import type { BillMaterialRecord, BillRecord } from '../common/storage/entities';
import {
  fuzzyIncludes,
  paginate,
  sortItems,
} from '../common/utils/pagination.util';
import { newId } from '../common/utils/id.util';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateBillDto,
  ListBillsQueryDto,
  UpdateBillDto,
} from './dto/bill.dto';

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListBillsQueryDto, currentUser: JwtPayload) {
    const includeMaterials = query.includeMaterials !== 'false';
    const bills = (await this.prisma.bill.findMany()).map(toBillRecord);

    const filtered = sortItems(
      bills.filter((bill) => {
        if (!this.canAccessBill(bill, currentUser)) return false;
        if (query.dateFrom && bill.date < query.dateFrom) return false;
        if (query.dateTo && bill.date > query.dateTo) return false;
        return (
          fuzzyIncludes(bill.date, query.date) &&
          fuzzyIncludes(bill.user, query.user) &&
          fuzzyIncludes(bill.community, query.community) &&
          fuzzyIncludes(bill.unit, query.unit)
        );
      }),
      query.sortBy,
      query.sortOrder,
    ).map((bill) =>
      includeMaterials ? bill : { ...bill, materials: undefined },
    );

    return paginate(filtered, query.page, query.pageSize);
  }

  async findOne(id: string, currentUser: JwtPayload) {
    const bill = await this.requireBill(id);
    if (!this.canAccessBill(bill, currentUser)) {
      throw new NotFoundException('账单不存在');
    }
    return bill;
  }

  async create(dto: CreateBillDto, operator: JwtPayload) {
    const created = await this.prisma.bill.create({
      data: {
        id: dto.id ?? newId('bill'),
        date: dto.date,
        user: dto.user,
        community: dto.community,
        unit: dto.unit,
        receivable: dto.receivable,
        received: dto.received,
        materials: this.normalizeMaterials(dto.materials) as unknown as Prisma.InputJsonValue,
      },
    });
    const bill = toBillRecord(created);
    await this.audit(operator, 'create', bill.id);
    return bill;
  }

  async update(id: string, dto: UpdateBillDto, operator: JwtPayload) {
    await this.requireBill(id);
    const updated = await this.prisma.bill.update({
      where: { id },
      data: {
        date: dto.date,
        user: dto.user,
        community: dto.community,
        unit: dto.unit,
        receivable: dto.receivable,
        received: dto.received,
        materials:
          dto.materials !== undefined
            ? (this.normalizeMaterials(dto.materials) as unknown as Prisma.InputJsonValue)
            : undefined,
      },
    });
    const bill = toBillRecord(updated);
    await this.audit(operator, 'update', bill.id);
    return bill;
  }

  async remove(id: string, operator: JwtPayload) {
    const bill = await this.requireBill(id);
    await this.prisma.bill.delete({ where: { id } });
    await this.audit(operator, 'delete', bill.id);
  }

  private canAccessBill(bill: BillRecord, user: JwtPayload): boolean {
    if (user.role !== 'user') return true;
    return bill.user === user.name;
  }

  private normalizeMaterials(
    materials: CreateBillDto['materials'],
  ): BillMaterialRecord[] {
    return materials.map((item) => ({
      id: item.id ?? newId('bm'),
      materialId: item.materialId,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
  }

  private async requireBill(id: string): Promise<BillRecord> {
    const bill = await this.prisma.bill.findUnique({ where: { id } });
    if (!bill) throw new NotFoundException('账单不存在');
    return toBillRecord(bill);
  }

  private async audit(
    operator: JwtPayload,
    action: 'create' | 'update' | 'delete',
    target: string,
  ) {
    await this.auditService.record({
      action,
      module: 'bill',
      target,
      operator: operator.name,
      operatorId: operator.sub,
      status: 'success',
    });
  }
}
