# Quickstart: Skill Workshop 开发指南

**日期**: 2026-06-19 | **分支**: 002-skill-workshop

## 前置条件

- Node.js 18+
- pnpm 10+
- Supabase 项目 (本地或远程)
- 环境变量配置: `.env.local` 中需包含 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## 本地启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 Skill Workshop
open http://localhost:3000/skills/workshop/browse
```

## 项目结构速览

```
src/app/skills/workshop/     # 4 个子页面 (browse, analyze, write, publish)
src/app/api/skills/workshop/ # 15+ API 路由
src/components/skills/       # 12+ Workshop 组件
src/lib/clawhub/             # ClawHub API 客户端
src/lib/skillssh/            # skills.sh API 客户端
src/lib/skills/              # 技能模板
src/lib/ai/prompts.ts        # Workshop AI prompts (3 套)
src/types/workshop.ts        # [待创建] 集中类型定义
```

## 关键文件

| 文件 | 用途 |
|------|------|
| `src/lib/clawhub/client.ts` | ClawHub API 客户端 (浏览/搜索/详情/发布) |
| `src/lib/skillssh/client.ts` | skills.sh API 客户端 (浏览/搜索/详情) |
| `src/lib/skills/skill-templates.ts` | 4 个技能模板 (basic, agent, workflow, pm-specialist) |
| `src/lib/ai/prompts.ts` | AI prompts: 分析, 写作辅助, 改进 |
| `src/components/skills/WorkshopTabs.tsx` | 4 tab 导航 |
| `src/components/skills/BrowseView.tsx` | 双平台浏览视图 |
| `src/components/skills/AnalyzeView.tsx` | AI 分析视图 |
| `src/components/skills/SkillEditor.tsx` | 技能编辑器 (引导/原始模式) |
| `src/components/skills/PublishView.tsx` | 发布管理视图 |

## 数据库

3 张表已在 `supabase/migrations/055_skill_workshop_publish.sql` 中创建:
- `user_skill_drafts` — 用户草稿
- `skill_workshop_analyses` — AI 分析记录
- `user_external_tokens` — 平台 API token (加密存储)

新增字段需创建新迁移:
- `user_skill_drafts` 增加 `template_type`, `validation_status`, `validation_errors`
- `skill_workshop_analyses` 增加 `improved_content`, `improvement_applied`

## 开发工作流

```bash
# 1. 格式化
pnpm format

# 2. Lint
pnpm lint

# 3. 类型检查
pnpm typecheck

# 4. 单元测试
pnpm test

# 5. E2E 测试
pnpm exec playwright test

# 6. 构建
pnpm build

# 7. 生产模式验证
pnpm start
```

## 外部 API 注意事项

### ClawHub
- Base URL: `https://clawhub.ai/api/v1`
- 浏览/搜索: 无需认证
- 发布: 需要 `clh_...` Bearer token
- 分页: cursor-based (非 page-based)
- 限流: 匿名 3000/min, 认证 12000/min

### skills.sh
- v1 API (`/api/v1/...`): 需要 Vercel OIDC token (当前不可用)
- CLI 端点 (`/api/search`, `/api/download`): 无需认证, 推荐使用
- 发布: 仅支持 CLI (`npx skills add`)

## 已知问题

1. **skills.sh 502**: v1 API 需认证, 当前客户端未处理 401, 需改用 CLI 无认证端点
2. **ClawHub 分页**: 客户端使用 page-based, 实际 API 是 cursor-based
3. **View Tabs**: 排序参数未传递给后端 API
4. **一键改进**: prompt 已定义但无 API 路由和前端调用
5. **类型分散**: UnifiedSkill 等类型在多个组件中重复定义
6. **Validate API**: 服务端验证路由存在但前端未调用
7. **AI 无限流**: analyze 和 write-assist 无频率限制
8. **草稿-编辑器**: 无法从草稿列表加载到编辑器继续编辑
