import { Prisma } from '@prisma/client';
import type { AuditLog, Bill, Material, Payment, User } from '@prisma/client';
import type {
  AuditLogRecord,
  BillMaterialRecord,
  BillRecord,
  MaterialRecord,
  PaymentRecord,
  PaymentStatus,
  StoredUser,
} from '../storage/entities';
import type { UserRole } from '../types/rbac.types';

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function toStoredUser(user: User): StoredUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email ?? undefined,
    avatar: user.avatar,
    role: user.role as UserRole,
    status: user.status as StoredUser['status'],
    createdAt: user.createdAt.toISOString(),
    passwordSalt: user.passwordSalt ?? undefined,
    passwordHash: user.passwordHash ?? undefined,
  };
}

export function toMaterialRecord(material: Material): MaterialRecord {
  return {
    id: material.id,
    name: material.name,
    category: material.category,
    unit: material.unit,
    unitPrice: toNumber(material.unitPrice),
    stock: material.stock,
    remark: material.remark ?? undefined,
  };
}

export function toBillRecord(bill: Bill): BillRecord {
  return {
    id: bill.id,
    date: bill.date,
    user: bill.user,
    community: bill.community,
    unit: bill.unit,
    receivable: toNumber(bill.receivable),
    received: toNumber(bill.received),
    materials: bill.materials as unknown as BillMaterialRecord[],
  };
}

export function toPaymentRecord(payment: Payment): PaymentRecord {
  return {
    id: payment.id,
    amount: toNumber(payment.amount),
    status: payment.status as PaymentStatus,
    email: payment.email,
    billId: payment.billId ?? undefined,
    paidAt: payment.paidAt?.toISOString(),
    channel: payment.channel ?? undefined,
  };
}

export function toAuditLogRecord(log: AuditLog): AuditLogRecord {
  return {
    id: log.id,
    createdAt: log.createdAt.toISOString(),
    operator: log.operator,
    operatorId: log.operatorId ?? undefined,
    action: log.action as AuditLogRecord['action'],
    module: log.module as AuditLogRecord['module'],
    target: log.target,
    detail: log.detail ?? undefined,
    status: log.status as AuditLogRecord['status'],
  };
}
