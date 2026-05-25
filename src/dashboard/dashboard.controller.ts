import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { DashboardRangeQueryDto, DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard.view')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('trends')
  @RequirePermissions('dashboard.view')
  trends(@Query() query: DashboardRangeQueryDto) {
    return this.dashboardService.trends(query);
  }

  @Get('categories')
  @RequirePermissions('dashboard.view')
  categories(@Query() query: DashboardRangeQueryDto) {
    return this.dashboardService.categories(query);
  }
}
