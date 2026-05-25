import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { AuthModule } from './auth/auth.module';
import { BillsModule } from './bills/bills.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { MaterialsModule } from './materials/materials.module';
import { PaymentsModule } from './payments/payments.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    AuthModule,
    HealthModule,
    UsersModule,
    MaterialsModule,
    BillsModule,
    PaymentsModule,
    DashboardModule,
    AuditLogsModule,
    RolesModule,
  ],
})
export class AppModule {}
