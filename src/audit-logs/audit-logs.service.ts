import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { AuditService } from '../common/services/audit.service';
import { toAuditLogRecord } from '../common/mappers/entity.mapper';
import {
  fuzzyIncludes,
  paginate,
  sortItems,
} from '../common/utils/pagination.util';
import { PrismaClient } from '@prisma/client';
import type {
  CreateAuditLogDto,
  ListAuditLogsQueryDto,
} from './dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListAuditLogsQueryDto) {
    const logs = (await this.prisma.auditLog.findMany()).map(toAuditLogRecord);
    const filtered = sortItems(
      logs.filter((log) => {
        if (query.dateFrom && log.createdAt < query.dateFrom) return false;
        if (query.dateTo && log.createdAt > query.dateTo) return false;
        return (
          fuzzyIncludes(log.operator, query.operator) &&
          (!query.module || log.module === query.module) &&
          (!query.action || log.action === query.action) &&
          (!query.status || log.status === query.status)
        );
      }),
      query.sortBy ?? 'createdAt',
      query.sortOrder,
    );

    return paginate(filtered, query.page, query.pageSize);
  }

  async create(dto: CreateAuditLogDto, user: JwtPayload) {
    return this.auditService.record({
      action: dto.action,
      module: dto.module,
      target: dto.target,
      detail: dto.detail,
      status: dto.status ?? 'success',
      operator: dto.operator ?? user.name,
      operatorId: dto.operatorId ?? user.sub,
    });
  }

  async exportCsv(query: ListAuditLogsQueryDto) {
    const { items } = await this.list({ ...query, page: 1, pageSize: 10_000 });
    const header = 'id,createdAt,operator,action,module,target,status';
    const rows = items.map((item) =>
      [
        item.id,
        item.createdAt,
        item.operator,
        item.action,
        item.module,
        item.target,
        item.status,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
