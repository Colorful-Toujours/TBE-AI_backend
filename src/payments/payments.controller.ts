import { Controller, Get, Header, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { SkipWrap } from '../common/decorators/skip-wrap.decorator';
import { ListPaymentsQueryDto, PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payments.view')
  list(@Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.list(query);
  }

  @Get('export')
  @SkipWrap()
  @RequirePermissions('payments.view')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="payments.csv"')
  export(@Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.exportCsv(query);
  }

  @Get(':id')
  @RequirePermissions('payments.view')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
