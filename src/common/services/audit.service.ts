import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { toAuditLogRecord } from '../mappers/entity.mapper';
import type { AuditLogRecord } from '../storage/entities';
import { newId } from '../utils/id.util';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    partial: Omit<AuditLogRecord, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<AuditLogRecord> {
    const log = await this.prisma.auditLog.create({
      data: {
        id: partial.id ?? newId('log'),
        createdAt: partial.createdAt
          ? new Date(partial.createdAt)
          : undefined,
        operator: partial.operator,
        operatorId: partial.operatorId,
        action: partial.action,
        module: partial.module,
        target: partial.target,
        detail: partial.detail,
        status: partial.status,
      },
    });
    return toAuditLogRecord(log);
  }
}
