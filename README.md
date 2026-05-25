# AI Ledger 后端（TBE-AI_backend）

NestJS 实现的 **AI Ledger** REST API，对接 Next.js 前端 [`tbe_ai`](../tbe_ai)。

## 文档

| 文档 | 说明 |
|------|------|
| [docs/API-IMPLEMENTATION.md](./docs/API-IMPLEMENTATION.md) | **实现说明**（接口清单、演示账号、curl、模块结构） |
| [tbe_ai/docs/backend-api-spec.md](../tbe_ai/docs/backend-api-spec.md) | 产品/API 规格（Agent 用） |

## 快速开始

```bash
cp .env.example .env
pnpm install
pnpm run db:up        # PostgreSQL（需 Docker）
pnpm run db:migrate
pnpm run db:seed
pnpm run start:dev    # http://localhost:8888
```

演示登录：`13800001001` / `demo123`（密码登录）或短信验证码 `123456`（开发环境）。

数据保存在 PostgreSQL，**重启服务不会丢失**。

### API 测试

| 方式 | 地址 / 文件 |
|------|-------------|
| **Swagger UI**（推荐） | http://localhost:8888/docs |
| REST Client | 根目录 [`api.http`](./api.http) |
| curl | 见 [docs/API-IMPLEMENTATION.md](./docs/API-IMPLEMENTATION.md) |

Swagger 在非 `production` 环境自动开启；生产环境可设 `SWAGGER_ENABLED=true`。

## 脚本

```bash
pnpm run build
pnpm run test:e2e
pnpm run lint
```

## 技术要点

- JWT + RBAC 权限守卫
- 统一 `{ success, data }` 响应（登录接口为扁平 `{ token, user }`）
- PostgreSQL + Prisma（`pnpm run db:seed` 初始化演示数据）
