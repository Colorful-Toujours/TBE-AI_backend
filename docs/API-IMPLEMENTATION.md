# AI Ledger 后端 API 实现说明

> 对应规格文档：[`tbe_ai/docs/backend-api-spec.md`](../../tbe_ai/docs/backend-api-spec.md)  
> 实现仓库：`TBE-AI_backend`（NestJS）  
> 文档版本：1.0 · 2026-05-22

---

## 1. 概述

本服务为 **AI Ledger** 独立后端，供 Next.js 前端通过 `/api/*` 代理访问（代理会去掉 `/api` 前缀）。

| 项 | 说明 |
|----|------|
| 框架 | NestJS 11 |
| 默认端口 | `8888`（`PORT` 可覆盖） |
| Swagger | 开发环境 `http://localhost:8888/docs` |
| 持久化 | **PostgreSQL**（Prisma ORM，重启数据保留） |
| 鉴权 | JWT Bearer，`Authorization: Bearer <token>` |
| 业务响应 | `{ success: true, data }` / `{ success: false, error }` |
| 登录响应 | 扁平 `{ token, user }`（与登录页解析逻辑一致） |

---

## 2. 快速启动

```bash
cd TBE-AI_backend
cp .env.example .env
pnpm install
pnpm run db:up          # 启动 PostgreSQL（Docker）
pnpm run db:migrate     # 建表
pnpm run db:seed        # 演示数据（仅空库时写入）
pnpm run start:dev
```

环境变量（`.env`）：

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `8888` | 监听端口 |
| `DATABASE_URL` | 见 `.env.example` | PostgreSQL 连接串 |
| `JWT_SECRET` | `tbe-ai-ledger-dev-secret` | JWT 签名密钥 |
| `CORS_ORIGIN` | 允许全部 | 逗号分隔的前端源 |
| `NODE_ENV` | - | `production` 时短信为随机 6 位码 |
| `SWAGGER_ENABLED` | - | `production` 下设为 `true` 可开启 `/docs` |

前端 `tbe_ai` 的 `BACKEND_URL` 应指向 `http://localhost:8888`（或与 `PORT` 一致）。

### 2.0 数据库脚本

| 命令 | 说明 |
|------|------|
| `pnpm run db:up` | `docker compose up -d` 启动 Postgres |
| `pnpm run db:migrate` | 执行迁移（开发） |
| `pnpm run db:seed` | 写入演示账号与样例数据 |
| `pnpm run db:studio` | Prisma Studio 可视化管理 |

### 2.1 Swagger 交互文档

启动 `pnpm run start:dev` 后打开：

**http://localhost:8888/docs**

1. 展开 **auth** → `POST /auth/login`，填入演示账号，点 **Execute**
2. 复制响应里的 `token`
3. 页面右上角 **Authorize**，填入 `Bearer <token>`（或直接粘贴 token，Swagger 会自动加 Bearer 前缀）
4. 再试 `/users`、`/materials` 等需鉴权接口

生产环境默认不暴露文档；需要时可设 `SWAGGER_ENABLED=true`。

### 2.2 REST Client（`api.http`）

仓库根目录 [`api.http`](../api.http) 可在 Cursor/VS Code 安装 **REST Client** 扩展后，点击 `Send Request` 逐条调试；登录请求会自动把 `token` 传给后续接口。

---

## 3. 演示账号与验证码

| 用途 | 值 |
|------|-----|
| 超级管理员手机 | `13800001001` |
| 密码 | `demo123` |
| 开发环境短信验证码 | `123456`（控制台也会打印） |

其他种子用户（`13800001002` ~ `005`）密码同为 `demo123`，角色见用户管理页 mock。

---

## 4. 模块结构

```
src/
├── common/          # 全局过滤器、拦截器、守卫、RBAC、内存库
├── auth/            # 登录、注册、短信、个人资料、改密
├── users/           # 系统用户 CRUD
├── materials/       # 材料库 CRUD
├── bills/           # 账单 CRUD（user 角色数据范围）
├── payments/        # 支付列表、详情、CSV 导出
├── dashboard/       # 仪表盘汇总与图表数据
├── audit-logs/      # 操作日志列表、写入、导出
├── roles/           # 角色与权限（只读，与前端 RBAC 对齐）
└── health/          # 健康检查
```

---

## 5. 已实现接口清单

### 5.1 认证 ` /auth`

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/auth/login` | 否 | `loginType`: `phone` \| `password` |
| POST | `/auth/register` | 否 | `loginType`: `register`，手机 `^1\d{10}$` |
| POST | `/auth/sms/send` | 否 | 60s 冷却；开发码 `123456` |
| GET | `/auth/wechat/callback` | 否 | 返回 `501`（未配置微信） |
| POST | `/auth/logout` | 是 | `204`，token 加入黑名单 |
| GET | `/auth/me` | 是 | 含 `role`、`permissions` |
| PATCH | `/auth/profile` | 是 | 更新姓名/手机/邮箱/头像 |
| PATCH | `/auth/password` | 是 | 需已设置密码 |

### 5.2 用户 ` /users`

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/users` | `users.view` |
| POST | `/users` | `users.manage` |
| GET | `/users/:id` | `users.view` |
| PATCH | `/users/:id` | `users.manage` |
| DELETE | `/users/:id` | `users.manage`（不可删 `super_admin`） |

### 5.3 材料 ` /materials`

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/materials` | `materials.view` |
| POST | `/materials` | `materials.manage` |
| GET | `/materials/:id` | `materials.view` |
| PATCH | `/materials/:id` | `materials.manage` |
| DELETE | `/materials/:id` | `materials.manage` |

### 5.4 账单 ` /bills`

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/bills` | `bills.view`（`user` 仅本人姓名匹配） |
| POST | `/bills` | `bills.manage` |
| GET | `/bills/:id` | `bills.view` |
| PATCH | `/bills/:id` | `bills.manage` |
| DELETE | `/bills/:id` | `bills.manage` |

Query：`page`、`pageSize`、`sortBy`、`sortOrder`、筛选字段、`dateFrom`/`dateTo`、`includeMaterials=false`。

### 5.5 支付 ` /payments`

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/payments` | `payments.view` |
| GET | `/payments/export` | `payments.view`（CSV 原始响应） |
| GET | `/payments/:id` | `payments.view` |

### 5.6 仪表盘 ` /dashboard`

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/dashboard/summary` | `dashboard.view` |
| GET | `/dashboard/trends?range=12m` | `dashboard.view` |
| GET | `/dashboard/categories?range=12m` | `dashboard.view` |

金额单位：**元**（`number`）。

### 5.7 操作日志 ` /audit-logs`

| 方法 | 路径 | 权限 |
|------|------|------|
| GET | `/audit-logs` | `users.view` |
| GET | `/audit-logs/export` | `users.view`（CSV） |
| POST | `/audit-logs` | 登录即可（补充客户端日志） |

服务端在登录、用户/材料/账单增删改时**自动写入**审计记录。

### 5.8 角色 ` /roles`

| 方法 | 路径 | 鉴权 |
|------|------|------|
| GET | `/roles` | 公开 |
| GET | `/roles/:role/permissions` | 公开 |

权限矩阵与 `tbe_ai/lib/rbac/roles.ts` 中 `ROLE_DEFINITIONS` 一致。

### 5.9 健康检查

| 方法 | 路径 | 鉴权 |
|------|------|------|
| GET | `/health` | 公开 |

---

## 6. 请求/响应约定

### 6.1 业务成功

```json
{
  "success": true,
  "data": {}
}
```

列表 `data`：

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 10
}
```

### 6.2 业务失败

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "资源不存在"
  }
}
```

### 6.3 登录成功（不包裹）

```json
{
  "token": "eyJ...",
  "user": {
    "id": "u-001",
    "name": "王超",
    "phone": "13800001001",
    "email": "wangchao@example.com",
    "avatar": null
  }
}
```

### 6.4 无 body 成功

`DELETE`、`POST /auth/logout` → **HTTP 204**。

---

## 7. RBAC 说明

角色：`super_admin` | `admin` | `employee` | `finance` | `user`。

- `super_admin`：全部 `PermissionKey`。
- 接口通过 `@RequirePermissions(...)` + `PermissionsGuard` 校验。
- `user` 角色访问账单时，仅返回 `bill.user === 当前用户 name` 的记录。

定义文件：`src/common/types/rbac.types.ts`。

---

## 8. 验收 curl

```bash
# 健康检查
curl http://localhost:8888/health

# 密码登录
curl -X POST http://localhost:8888/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"13800001001","loginType":"password","password":"demo123"}'

# 账单列表（替换 TOKEN）
curl "http://localhost:8888/bills?page=1&pageSize=10" \
  -H "Authorization: Bearer TOKEN"

# 发送短信（开发验证码 123456）
curl -X POST http://localhost:8888/auth/sms/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800001001","scene":"login"}'
```

经 Next 代理（前端 3000）：

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"13800001001","loginType":"password","password":"demo123"}'
```

---

## 9. 与规格的差异 / 后续工作

| 项 | 状态 |
|----|------|
| 数据库持久化 | 未做，当前内存 + 种子数据 |
| 微信登录 | `501 NOT_IMPLEMENTED` |
| 支付写操作/退款 | P2，未实现 |
| 附件数 `attachmentCount` | 仪表盘固定为 `0` |
| 生产短信 | 需接入真实短信网关 |

建议下一步：接入 PostgreSQL/Prisma、替换 `InMemoryStore`、前端按规格第 14 节逐页改 API 调用。

---

## 10. 相关命令

```bash
pnpm run build      # 编译
pnpm run start:dev  # 热重载开发
pnpm run test:e2e   # 端到端（health + 登录拉账单）
pnpm run lint       # ESLint
```
