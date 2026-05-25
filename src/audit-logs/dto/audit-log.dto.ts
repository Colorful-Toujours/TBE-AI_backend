import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { LogAction, LogModule } from '../../common/storage/entities';

export class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsIn([
    'bill',
    'material',
    'user',
    'settings',
    'payment',
    'auth',
    'system',
  ])
  module?: LogModule;

  @IsOptional()
  @IsIn([
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'view',
    'export',
    'other',
  ])
  action?: LogAction;

  @IsOptional()
  @IsIn(['success', 'failure'])
  status?: 'success' | 'failure';

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}

export class CreateAuditLogDto {
  @IsIn([
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'view',
    'export',
    'other',
  ])
  action: LogAction;

  @IsIn([
    'bill',
    'material',
    'user',
    'settings',
    'payment',
    'auth',
    'system',
  ])
  module: LogModule;

  @IsString()
  target: string;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsIn(['success', 'failure'])
  status?: 'success' | 'failure';

  @IsOptional()
  @IsString()
  operator?: string;

  @IsOptional()
  @IsString()
  operatorId?: string;
}
