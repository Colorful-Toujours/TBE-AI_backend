import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';
import { CreateBillDto, ListBillsQueryDto, UpdateBillDto } from './dto/bill.dto';
import { BillsService } from './bills.service';

@ApiTags('bills')
@ApiBearerAuth('access-token')
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Get()
  @RequirePermissions('bills.view')
  list(@Query() query: ListBillsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.billsService.list(query, user);
  }

  @Post()
  @RequirePermissions('bills.manage')
  create(@Body() dto: CreateBillDto, @CurrentUser() user: JwtPayload) {
    return this.billsService.create(dto, user);
  }

  @Get(':id')
  @RequirePermissions('bills.view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.billsService.findOne(id, user);
  }

  @Patch(':id')
  @RequirePermissions('bills.manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBillDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('bills.manage')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.billsService.remove(id, user);
  }
}
