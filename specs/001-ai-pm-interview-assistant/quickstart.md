# 快速开始: AI 产品经理面试助手

**功能**: 001-ai-pm-interview-assistant

## 前置要求

- Node.js 20+
- pnpm（推荐）或 npm
- Supabase 账号（免费注册：https://supabase.com）
- Anthropic API Key（https://console.anthropic.com）

## 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd test8
git checkout 001-ai-pm-interview-assistant
pnpm install
```

## 2. 配置 Supabase

1. 登录 Supabase Dashboard，创建新项目
2. 在 SQL Editor 中执行 `supabase/migrations/` 下的迁移文件（按序号顺序）
3. 在 Settings → API 中获取 `Project URL` 和 `anon/public key`

## 3. 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

填入以下变量：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic
ANTHROPIC_API_KEY=sk-ant-your-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 5. 运行测试

```bash
# 单元测试
pnpm test

# E2E 测试（需先启动 dev server）
pnpm test:e2e

# 类型检查
pnpm typecheck

# Lint
pnpm lint
```

## 6. 构建与生产验证

```bash
# 构建
pnpm build

# 生产模式启动
pnpm start
```

## 7. 关键命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器（Turbopack） |
| `pnpm build` | 生产构建 |
| `pnpm start` | 生产模式启动 |
| `pnpm lint` | ESLint 检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm test` | 运行单元测试（Vitest） |
| `pnpm test:e2e` | 运行 E2E 测试（Playwright） |

## 8. 开发流程

1. 修改代码
2. `pnpm format && pnpm lint && pnpm typecheck`
3. `pnpm test`
4. `pnpm build && pnpm start`（验证生产模式）
5. 提交代码
