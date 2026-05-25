import { Global, Inject, Injectable, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

function createPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ??
    'postgresql://tbe:tbe_dev@localhost:5432/tbe_ledger?schema=public';
  return new Pool({ connectionString });
}

@Injectable()
class PrismaLifecycle implements OnModuleInit, OnModuleDestroy {
  constructor(
    private readonly prisma: PrismaClient,
    @Inject(PG_POOL) private readonly pool: Pool,
  ) {}

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    { provide: PG_POOL, useFactory: createPool },
    {
      provide: PrismaClient,
      useFactory: (pool: Pool) =>
        new PrismaClient({ adapter: new PrismaPg(pool) }),
      inject: [PG_POOL],
    },
    PrismaLifecycle,
  ],
  exports: [PrismaClient],
})
export class PrismaModule {}
