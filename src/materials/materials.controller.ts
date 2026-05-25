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
import {
  CreateMaterialDto,
  ListMaterialsQueryDto,
  UpdateMaterialDto,
} from './dto/material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('materials')
@ApiBearerAuth('access-token')
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  @RequirePermissions('materials.view')
  list(@Query() query: ListMaterialsQueryDto) {
    return this.materialsService.list(query);
  }

  @Post()
  @RequirePermissions('materials.manage')
  create(@Body() dto: CreateMaterialDto, @CurrentUser() user: JwtPayload) {
    return this.materialsService.create(dto, user);
  }

  @Get(':id')
  @RequirePermissions('materials.view')
  findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('materials.manage')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.materialsService.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermissions('materials.manage')
  @HttpCode(204)
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    this.materialsService.remove(id, user);
  }
}
