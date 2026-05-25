import type { UserRole } from '../types/rbac.types';

export type UserStatus = '启用' | '禁用';

export interface StoredUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  passwordSalt?: string;
  passwordHash?: string;
}

export interface SmsCodeRecord {
  phone: string;
  code: string;
  scene: string;
  expiresAt: number;
  sentAt: number;
}

export interface MaterialRecord {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  stock: number;
  remark?: string;
}

export interface BillMaterialRecord {
  id: string;
  materialId?: string;
  name: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
}

export interface BillRecord {
  id: string;
  date: string;
  user: string;
  community: string;
  unit: string;
  receivable: number;
  received: number;
  materials: BillMaterialRecord[];
}

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'success'
  | 'failed';

export interface PaymentRecord {
  id: string;
  amount: number;
  status: PaymentStatus;
  email: string;
  billId?: string;
  paidAt?: string;
  channel?: string;
}

export type LogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'other';

export type LogModule =
  | 'bill'
  | 'material'
  | 'user'
  | 'settings'
  | 'payment'
  | 'auth'
  | 'system';

export interface AuditLogRecord {
  id: string;
  createdAt: string;
  operator: string;
  operatorId?: string;
  action: LogAction;
  module: LogModule;
  target: string;
  detail?: string;
  status: 'success' | 'failure';
}
