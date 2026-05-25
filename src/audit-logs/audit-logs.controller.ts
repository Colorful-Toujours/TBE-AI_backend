import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { SkipWrap } from '../common/decorators/skip-wrap.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import {
  CreateAuditLogDto,
  ListAuditLogsQueryDto,
} from './dto/audit-log.dto';
import { AuditLogsService } from './audit-logs.service';

@ApiTags('audit-logs')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions('users.view')
  list(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsService.list(query);
  }

  @Get('export')
  @SkipWrap()
  @RequirePermissions('users.view')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="audit-logs.csv"')
  export(@Query() query: ListAuditLogsQueryDto) {
    return this.auditLogsService.exportCsv(query);
  }

  @Post()
  create(@Body() dto: CreateAuditLogDto, @CurrentUser() user: JwtPayload) {
    return this.auditLogsService.create(dto, user);
  }
}
