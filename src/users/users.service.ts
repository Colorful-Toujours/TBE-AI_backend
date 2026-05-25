import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../common/services/audit.service';
import { toStoredUser } from '../common/mappers/entity.mapper';
import type { StoredUser } from '../common/storage/entities';
import {
  fuzzyIncludes,
  paginate,
  sortItems,
} from '../common/utils/pagination.util';
import { newId } from '../common/utils/id.util';
import { PasswordUtil } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserDto, ListUsersQueryDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordUtil: PasswordUtil,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ListUsersQueryDto) {
    const users = (await this.prisma.user.findMany()).map(toStoredUser);
    const filtered = sortItems(
      users.filter((user) => {
        return (
          fuzzyIncludes(user.name, query.name) &&
          fuzzyIncludes(user.phone, query.phone) &&
          (!query.role || user.role === query.role) &&
          (!query.status || user.status === query.status)
        );
      }),
      query.sortBy,
      query.sortOrder,
    ).map((user) => this.toPublic(user));

    return paginate(filtered, query.page, query.pageSize);
  }

  async findOne(id: string) {
    return this.toPublic(await this.requireUser(id));
  }

  async create(dto: CreateUserDto, operator: { sub: string; name: string }) {
    const exists = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (exists) {
      throw new ConflictException('手机号已存在');
    }

    const created = await this.prisma.user.create({
      data: {
        id: newId('u'),
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        role: dto.role,
        status: dto.status,
        ...(dto.password
          ? this.passwordUtil.createFields(dto.password)
          : {}),
      },
    });
    const user = toStoredUser(created);

    await this.auditService.record({
      action: 'create',
      module: 'user',
      target: user.name,
      operator: operator.name,
      operatorId: operator.sub,
      status: 'success',
    });

    return this.toPublic(user);
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    operator: { sub: string; name: string },
  ) {
    const current = await this.requireUser(id);
    if (dto.phone && dto.phone !== current.phone) {
      const conflict = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (conflict) throw new ConflictException('手机号已存在');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name ?? current.name,
        phone: dto.phone ?? current.phone,
        email: dto.email ?? current.email,
        role: dto.role ?? current.role,
        status: dto.status ?? current.status,
      },
    });
    const user = toStoredUser(updated);

    await this.auditService.record({
      action: 'update',
      module: 'user',
      target: user.name,
      operator: operator.name,
      operatorId: operator.sub,
      status: 'success',
    });

    return this.toPublic(user);
  }

  async remove(id: string, operator: { sub: string; name: string }) {
    const user = await this.requireUser(id);
    if (user.role === 'super_admin') {
      throw new ForbiddenException('不可删除超级管理员');
    }

    await this.prisma.user.delete({ where: { id } });

    await this.auditService.record({
      action: 'delete',
      module: 'user',
      target: user.name,
      operator: operator.name,
      operatorId: operator.sub,
      status: 'success',
    });
  }

  private async requireUser(id: string): Promise<StoredUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('用户不存在');
    return toStoredUser(user);
  }

  private toPublic(user: StoredUser) {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
