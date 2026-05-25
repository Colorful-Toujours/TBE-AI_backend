import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { toMaterialRecord } from '../common/mappers/entity.mapper';
import type { MaterialRecord } from '../common/storage/entities';
import {
  fuzzyIncludes,
  paginate,
  sortItems,
} from '../common/utils/pagination.util';
import { newId } from '../common/utils/id.util';
import { PrismaClient } from '@prisma/client';
import type {
  CreateMaterialDto,
  ListMaterialsQueryDto,
  UpdateMaterialDto,
} from './dto/material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListMaterialsQueryDto) {
    const materials = (await this.prisma.material.findMany()).map(
      toMaterialRecord,
    );
    const filtered = sortItems(
      materials.filter((item) => {
        return (
          fuzzyIncludes(item.name, query.name) &&
          fuzzyIncludes(item.category, query.category) &&
          fuzzyIncludes(item.unit, query.unit)
        );
      }),
      query.sortBy,
      query.sortOrder,
    );

    return paginate(filtered, query.page, query.pageSize);
  }

  async findOne(id: string) {
    return this.requireMaterial(id);
  }

  async create(dto: CreateMaterialDto, operator: { sub: string; name: string }) {
    const created = await this.prisma.material.create({
      data: {
        id: newId('mat'),
        name: dto.name,
        category: dto.category,
        unit: dto.unit,
        unitPrice: dto.unitPrice,
        stock: dto.stock,
        remark: dto.remark,
      },
    });
    const material = toMaterialRecord(created);
    await this.audit(operator, 'create', material.name);
    return material;
  }

  async update(
    id: string,
    dto: UpdateMaterialDto,
    operator: { sub: string; name: string },
  ) {
    await this.requireMaterial(id);
    const updated = await this.prisma.material.update({
      where: { id },
      data: dto,
    });
    const material = toMaterialRecord(updated);
    await this.audit(operator, 'update', material.name);
    return material;
  }

  async remove(id: string, operator: { sub: string; name: string }) {
    const material = await this.requireMaterial(id);
    await this.prisma.material.delete({ where: { id } });
    await this.audit(operator, 'delete', material.name);
  }

  private async requireMaterial(id: string): Promise<MaterialRecord> {
    const material = await this.prisma.material.findUnique({ where: { id } });
    if (!material) throw new NotFoundException('材料不存在');
    return toMaterialRecord(material);
  }

  private async audit(
    operator: { sub: string; name: string },
    action: 'create' | 'update' | 'delete',
    target: string,
  ) {
    await this.auditService.record({
      action,
      module: 'material',
      target,
      operator: operator.name,
      operatorId: operator.sub,
      status: 'success',
    });
  }
}
