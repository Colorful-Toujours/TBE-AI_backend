# 前端接口对接文档

> 适用后端：AI Ledger NestJS API  
> 默认地址：`http://localhost:8888`  
> Swagger：`http://localhost:8888/docs`  
> 更新时间：2026-05-27

## 1. 通用约定

### Base URL

开发环境后端默认监听：

```text
http://localhost:8888
```

如果前端通过 Next.js 代理访问 `/api/*`，代理应转发到后端并去掉 `/api` 前缀。

### 鉴权

除标记为“公开”的接口外，均需要请求头：

```http
Authorization: Bearer <token>
```

`token` 来自 `POST /auth/login` 或 `POST /auth/register`。

### 成功响应

多数接口返回统一包装：

```json
{
  "success": true,
  "data": {}
}
```

`POST /auth/login`、`POST /auth/register`、`GET /auth/wechat/callback` 跳过包装。`DELETE` 和 `POST /auth/logout` 成功时返回 `204 No Content`。

### 失败响应

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "手机号格式不正确",
    "details": {}
  }
}
```

错误码：

```ts
type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_ERROR'
  | 'NOT_IMPLEMENTED';
```

### 分页响应

列表接口统一返回：

```ts
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

通用分页 query：

| 参数 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `page` | number | `1` | 最小 `1` |
| `pageSize` | number | `10` | `1` 到 `100` |
| `sortBy` | string | - | 按返回字段名排序 |
| `sortOrder` | `asc` \| `desc` | `desc` | 排序方向 |

## 2. 公共类型

```ts
type UserRole = 'super_admin' | 'admin' | 'employee' | 'finance' | 'user';
type UserStatus = '启用' | '禁用';

type PermissionKey =
  | 'dashboard.view'
  | 'users.view'
  | 'users.manage'
  | 'roles.manage'
  | 'bills.view'
  | 'bills.manage'
  | 'materials.view'
  | 'materials.manage'
  | 'payments.view'
  | 'payments.manage'
  | 'settings.view'
  | 'settings.manage';

interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar: string | null;
}

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

interface Material {
  id: string;
  name: string;
  category: '建材' | '电气' | '涂料' | '门窗' | '五金' | '其他';
  unit: string;
  unitPrice: number;
  stock: number;
  remark?: string;
}

interface BillMaterial {
  id: string;
  materialId?: string;
  name: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
}

interface Bill {
  id: string;
  date: string;
  user: string;
  community: string;
  unit: string;
  receivable: number;
  received: number;
  materials?: BillMaterial[];
}

type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  email: string;
  billId?: string;
  paidAt?: string;
  channel?: string;
}

type LogAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view'
  | 'export'
  | 'other';

type LogModule =
  | 'bill'
  | 'material'
  | 'user'
  | 'settings'
  | 'payment'
  | 'auth'
  | 'system';

interface AuditLog {
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
```

## 3. 认证 Auth

### POST `/auth/login`

公开。登录成功响应不包裹。

请求体：

```ts
type LoginBody =
  | {
      username: string;
      loginType: 'password';
      password: string;
    }
  | {
      username: string;
      loginType: 'phone';
      verificationCode: string;
    };
```

响应：

```ts
interface LoginResponse {
  token: string;
  user: AuthUser;
}
```

示例：

```json
{
  "username": "13800001001",
  "loginType": "password",
  "password": "demo123"
}
```

### POST `/auth/register`

公开。注册成功响应不包裹。

请求体：

```ts
interface RegisterBody {
  username: string; // 手机号，^1\d{10}$
  loginType: 'register';
  password: string; // 6 到 64 位
  verificationCode?: string;
}
```

响应同登录。

### POST `/auth/sms/send`

公开。发送短信验证码，开发环境固定验证码为 `123456`，60 秒冷却。

请求体：

```ts
interface SendSmsBody {
  phone: string;
  scene: 'login' | 'register' | 'reset_password';
}
```

响应：

```ts
{
  success: true;
  data: {
    expiresIn: 300;
    cooldown: 60;
  };
}
```

### GET `/auth/wechat/callback`

公开，当前未接入微信登录，会返回 `501 NOT_IMPLEMENTED`。

Query：

| 参数 | 类型 | 必填 |
| --- | --- | --- |
| `code` | string | 是 |
| `state` | string | 否 |

### POST `/auth/logout`

需要登录。成功返回 `204 No Content`。

### GET `/auth/me`

需要登录。

响应：

```ts
{
  success: true;
  data: AuthUser & {
    role: UserRole;
    permissions: PermissionKey[];
  };
}
```

### PATCH `/auth/profile`

需要登录。

请求体：

```ts
interface UpdateProfileBody {
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string | null;
}
```

响应：`AuthUser`

### PATCH `/auth/password`

需要登录。

请求体：

```ts
interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string; // 6 到 64 位
}
```

响应：

```ts
{
  success: true;
  data: { ok: true };
}
```

## 4. 用户 Users

所有接口需要登录。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/users` | `users.view` | 用户列表 |
| POST | `/users` | `users.manage` | 新建用户 |
| GET | `/users/:id` | `users.view` | 用户详情 |
| PATCH | `/users/:id` | `users.manage` | 更新用户 |
| DELETE | `/users/:id` | `users.manage` | 删除用户，不能删除超级管理员 |

### GET `/users`

Query：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 姓名模糊搜索 |
| `phone` | string | 手机号模糊搜索 |
| `role` | `UserRole` | 角色 |
| `status` | `启用` \| `禁用` | 状态 |

响应：`PaginatedResult<User>`

### POST `/users`

请求体：

```ts
interface CreateUserBody {
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
}
```

响应：`User`

### PATCH `/users/:id`

请求体：

```ts
interface UpdateUserBody {
  name?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
}
```

响应：`User`

## 5. 材料 Materials

所有接口需要登录。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/materials` | `materials.view` | 材料列表 |
| POST | `/materials` | `materials.manage` | 新建材料 |
| GET | `/materials/:id` | `materials.view` | 材料详情 |
| PATCH | `/materials/:id` | `materials.manage` | 更新材料 |
| DELETE | `/materials/:id` | `materials.manage` | 删除材料 |

### GET `/materials`

Query：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `name` | string | 名称模糊搜索 |
| `category` | string | 分类模糊搜索 |
| `unit` | string | 单位模糊搜索 |

响应：`PaginatedResult<Material>`

### POST `/materials`

请求体：

```ts
interface CreateMaterialBody {
  name: string;
  category: Material['category'];
  unit: string;
  unitPrice: number;
  stock: number;
  remark?: string;
}
```

响应：`Material`

### PATCH `/materials/:id`

请求体：

```ts
interface UpdateMaterialBody {
  name?: string;
  category?: Material['category'];
  unit?: string;
  unitPrice?: number;
  stock?: number;
  remark?: string;
}
```

响应：`Material`

## 6. 账单 Bills

所有接口需要登录。`user` 角色只能访问 `bill.user === 当前用户 name` 的账单。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/bills` | `bills.view` | 账单列表 |
| POST | `/bills` | `bills.manage` | 新建账单 |
| GET | `/bills/:id` | `bills.view` | 账单详情 |
| PATCH | `/bills/:id` | `bills.manage` | 更新账单 |
| DELETE | `/bills/:id` | `bills.manage` | 删除账单 |

### GET `/bills`

Query：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `date` | string | 日期模糊搜索 |
| `user` | string | 用户名模糊搜索 |
| `community` | string | 小区模糊搜索 |
| `unit` | string | 单元/房号模糊搜索 |
| `dateFrom` | string | 起始日期，字符串比较 |
| `dateTo` | string | 结束日期，字符串比较 |
| `includeMaterials` | string | 传 `false` 时列表不返回材料明细 |

响应：`PaginatedResult<Bill>`

### POST `/bills`

请求体：

```ts
interface CreateBillBody {
  id?: string;
  date: string;
  user: string;
  community: string;
  unit: string;
  receivable: number;
  received: number;
  materials: Array<{
    id?: string;
    materialId?: string;
    name: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
  }>;
}
```

响应：`Bill`

### PATCH `/bills/:id`

请求体：

```ts
interface UpdateBillBody {
  date?: string;
  user?: string;
  community?: string;
  unit?: string;
  receivable?: number;
  received?: number;
  materials?: CreateBillBody['materials'];
}
```

响应：`Bill`

## 7. 支付 Payments

所有接口需要登录。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/payments` | `payments.view` | 支付列表 |
| GET | `/payments/export` | `payments.view` | 导出 CSV，不包裹响应 |
| GET | `/payments/:id` | `payments.view` | 支付详情 |

### GET `/payments`

Query：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `status` | `pending` \| `processing` \| `success` \| `failed` | 支付状态 |
| `email` | string | 邮箱模糊搜索 |
| `billId` | string | 账单 ID 精确匹配 |

响应：`PaginatedResult<Payment>`

### GET `/payments/export`

响应头：

```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="payments.csv"
```

CSV 列：

```text
id,amount,status,email,billId,paidAt,channel
```

## 8. 仪表盘 Dashboard

所有接口需要登录，权限为 `dashboard.view`。

### GET `/dashboard/summary`

响应：

```ts
{
  success: true;
  data: {
    totalBills: number;
    totalFlow: number;
    transactionCount: number;
    categoryCount: number;
    pendingCount: number;
    attachmentCount: number;
    trends: {
      totalBills: { value: string; direction: 'up' };
      totalFlow: { value: string; direction: 'up' };
    };
  };
}
```

### GET `/dashboard/trends`

Query：

| 参数 | 类型 | 默认 |
| --- | --- | --- |
| `range` | `12m` \| `6m` \| `3m` | `12m` |

响应：

```ts
{
  success: true;
  data: {
    points: Array<{
      month: string;
      bills: number;
      amount: number;
    }>;
  };
}
```

### GET `/dashboard/categories`

Query 同 `/dashboard/trends`。

响应：

```ts
{
  success: true;
  data: {
    items: Array<{
      category: string;
      amount: number;
      count: number;
    }>;
  };
}
```

## 9. 操作日志 Audit Logs

所有接口需要登录。列表和导出权限为 `users.view`，创建接口登录即可。

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | `/audit-logs` | `users.view` | 操作日志列表 |
| GET | `/audit-logs/export` | `users.view` | 导出 CSV，不包裹响应 |
| POST | `/audit-logs` | 登录即可 | 创建客户端日志 |

### GET `/audit-logs`

Query：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `operator` | string | 操作人模糊搜索 |
| `module` | `LogModule` | 模块 |
| `action` | `LogAction` | 动作 |
| `status` | `success` \| `failure` | 状态 |
| `dateFrom` | string | 起始时间，字符串比较 |
| `dateTo` | string | 结束时间，字符串比较 |

响应：`PaginatedResult<AuditLog>`

### POST `/audit-logs`

请求体：

```ts
interface CreateAuditLogBody {
  action: LogAction;
  module: LogModule;
  target: string;
  detail?: string;
  status?: 'success' | 'failure';
  operator?: string;
  operatorId?: string;
}
```

响应：`AuditLog`

### GET `/audit-logs/export`

响应头：

```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="audit-logs.csv"
```

CSV 列：

```text
id,createdAt,operator,action,module,target,status
```

## 10. 角色 Roles

角色接口公开。

### GET `/roles`

响应：

```ts
{
  success: true;
  data: Array<{
    id: UserRole;
    label: string;
    permissions: PermissionKey[];
  }>;
}
```

### GET `/roles/:role/permissions`

响应：

```ts
{
  success: true;
  data: {
    role: UserRole;
    permissions: PermissionKey[];
    all: PermissionKey[];
  };
}
```

## 11. 健康检查 Health

### GET `/health`

公开。

响应：

```ts
{
  success: true;
  data: {
    status: 'ok';
    version: string;
    time: string;
  };
}
```

## 12. 前端调用示例

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8888';

async function request<T>(path: string, init: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  if (!res.ok || body.success === false) {
    throw new Error(body.error?.message ?? '请求失败');
  }

  return (body.success === true ? body.data : body) as T;
}

export async function login() {
  return request<{ token: string; user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: '13800001001',
      loginType: 'password',
      password: 'demo123',
    }),
  });
}

export async function getBills() {
  return request<PaginatedResult<Bill>>('/bills?page=1&pageSize=10');
}
```

