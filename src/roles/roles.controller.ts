import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import {
  ALL_PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type UserRole,
} from '../common/types/rbac.types';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  @Public()
  @Get()
  list() {
    return Object.entries(ROLE_LABELS).map(([id, label]) => ({
      id,
      label,
      permissions: ROLE_PERMISSIONS[id as UserRole],
    }));
  }

  @Public()
  @Get(':role/permissions')
  permissions(@Param('role') role: UserRole) {
    return {
      role,
      permissions: ROLE_PERMISSIONS[role] ?? [],
      all: ALL_PERMISSIONS,
    };
  }
}
