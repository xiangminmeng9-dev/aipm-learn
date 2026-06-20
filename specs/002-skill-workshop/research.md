# 研究报告: Skill Workshop (技能工坊)

**日期**: 2026-06-19 | **分支**: 002-skill-workshop

## 研究概览

Skill Workshop 代码已基本实现(4页面、15 API路由、12组件、3数据库表), 但存在若干功能缺口、API集成问题和代码质量问题. 本研究针对所有待解决问题进行了深入调查.

---

## 1. skills.sh API 认证问题

### Decision: 使用 skills.sh CLI 无认证端点替代 v1 API

### Rationale
skills.sh 的 v1 API (`/api/v1/...`) 现在强制要求 Vercel OIDC token 认证, 返回 401. 但 skills.sh CLI 的开源代码揭示了两条无需认证的端点:
- `/api/search?q=...&limit=10` — 搜索 (无认证)
- `/api/download/{owner}/{repo}/{slug}` — 下载技能内容 (无认证)

这些端点是 CLI 本身使用的, 稳定可靠. 对于浏览和搜索场景, 这些端点完全够用.

### Alternatives considered
1. **部署 Vercel OIDC 代理** — 需要额外 Vercel 项目, 增加运维复杂度, 且本地开发仍需处理 token 获取
2. **使用 Well-Known URI 协议** — 去中心化方案, 但仅限于发布者自建端点的场景, 覆盖面窄
3. **直接调用 GitHub API** — 绕过 skills.sh, 但需要知道技能的 GitHub 仓库地址

### 实施要点
- 修改 `src/lib/skillssh/client.ts`: 浏览和搜索改用 `/api/search` 端点
- 新增 `downloadSkill()` 函数使用 `/api/download/{owner}/{repo}/{slug}` 获取技能内容
- 保留 v1 API 客户端代码作为注释, 未来如获取 OIDC token 可切换
- API 路由需区分 401 (认证失败) 和 5xx (服务不可用), 给用户更准确的错误信息

---

## 2. ClawHub API 分页模型不匹配

### Decision: 改用 cursor-based 分页, 适配 ClawHub 真实 API

### Rationale
当前 `src/lib/clawhub/client.ts` 使用 `page` + `sort` 参数, 但 ClawHub 真实 API 使用:
- **cursor-based 分页**: `limit` + `cursor` (而非 page/perPage)
- **不同排序值**: `updated`, `recommended`, `installsCurrent`, `installsAllTime`, `trending`, `createdAt` (而非 `stars`)
- **不同响应格式**: `{ items: [...], nextCursor: "..." }` (而非 `{ data: [...], pagination: { page, total } }`)

当前代码虽然 "work", 但分页可能不准确, 排序值不匹配导致排序功能失效.

### Alternatives considered
1. **保持现状** — 分页可能工作但不准确, 排序功能名存实亡
2. **完全重写客户端** — 适配真实 API, 但需同步修改前端分页逻辑

### 实施要点
- 重写 `browseSkills()`: 使用 `limit` + `cursor` 参数, 解析 `{ items, nextCursor }` 响应
- 更新前端分页: 从页码分页改为"加载更多"模式 (基于 cursor)
- 映射 view tabs 到正确排序值: hot → `installsAllTime`, trending → `trending`, newest → `createdAt`
- 新增 `limit` 参数 (默认 20, 最大 200)

---

## 3. 浏览页 View Tabs 排序未生效

### Decision: 将 View Tabs 映射到平台排序参数

### Rationale
当前 `BrowseView.tsx` 中 hot/trending/newest tabs 仅在客户端 state 切换, 未传递给 API. 修复 ClawHub 客户端后, 应将 view 值映射为排序参数传递给后端.

### 实施要点
- ClawHub: hot → `sort=installsAllTime`, trending → `sort=trending`, newest → `sort=createdAt`
- skills.sh: hot → `view=all-time`, trending → `view=trending`, hot → `view=hot` (已有但未使用)
- 修改 `fetchClawhub`/`fetchSkillssh` 传递 view 参数

---

## 4. "一键改进"功能未实现

### Decision: 实现 "一键改进" 功能, 连接已有的 AI prompt

### Rationale
AI prompt `buildSkillImprovementPrompt` + `SKILL_IMPROVEMENT_SYSTEM_PROMPT` 已在 `prompts.ts` 中完整定义, 但缺少:
1. API 路由 (`/api/skills/workshop/improve`)
2. 前端调用逻辑 (`AnalysisResult.tsx` 中的按钮已存在但禁用)

### Alternatives considered
1. **删除此功能** — 但 spec 明确要求, 且 prompt 已写好
2. **延后实现** — 增加技术债, 用户已看到 "即将推出" 标签

### 实施要点
- 新增 `src/app/api/skills/workshop/improve/route.ts`
- 修改 `AnalysisResult.tsx`: 启用按钮, 调用 improve API, 用改进结果替换编辑器内容
- 改进结果保存到草稿或直接更新分析记录

---

## 5. 类型定义分散与重复

### Decision: 创建集中类型文件 `src/types/workshop.ts`

### Rationale
当前类型分散在多个组件中:
- `UnifiedSkill` 在 `BrowseView.tsx` 和 `SkillDetailDialog.tsx` 中重复定义
- `AnalysisResultData` 在 `AnalysisResult.tsx` 中定义但可能被多处使用
- `FrontmatterData` 在 `FrontmatterForm.tsx` 中导出
- 各组件的 props 类型内联定义

集中类型文件可消除重复, 提高可维护性.

### 实施要点
- 创建 `src/types/workshop.ts`, 包含: UnifiedSkill, PlatformPage, AnalysisResultData, FrontmatterData, Draft, TokenInfo, ValidationResult 等
- 各组件改为从 `@/types/workshop` 导入
- 删除组件内的重复类型定义

---

## 6. Validate API 未被前端调用

### Decision: 在 SkillEditor 中集成服务端验证

### Rationale
`/api/skills/workshop/validate` 路由已实现完整的 SKILL.md 格式验证, 但 `SkillEditor.tsx` 仅做客户端验证, 未调用服务端. 服务端验证更可靠 (如 name regex 规则可能更新).

### 实施要点
- 在 SkillEditor 的 "保存" 或 "预览" 操作时调用 validate API
- 合并客户端和服务端验证结果
- 或在发布前强制调用服务端验证

---

## 7. AI 端点无限流

### Decision: 为 AI 端点添加基础限流

### Rationale
`/api/skills/workshop/analyze` 和 `/api/skills/workshop/write-assist` 直接调用 AI API, 无任何频率限制. 恶意用户可无限调用导致 API 成本失控.

### 实施要点
- 基于用户 ID 的简单限流: 每用户每天最多 20 次分析 + 20 次写作辅助
- 使用 Supabase 查询 `skill_workshop_analyses` 表的当日记录数来判断
- 或使用内存 Map + TTL 实现简单计数器

---

## 8. 草稿与编辑器未打通

### Decision: 支持从草稿加载到编辑器

### Rationale
当前 Write 页面可保存草稿, 但无法加载已有草稿到编辑器继续编辑. Publish 页面显示草稿列表, 但点击只能预览, 无法进入编辑模式.

### 实施要点
- Write 页面支持 `?draftId=xxx` 查询参数
- 加载草稿内容到编辑器
- Publish 页面的草稿项添加 "编辑" 按钮, 跳转到 `/skills/workshop/write?draftId=xxx`

---

## 9. 测试覆盖为零

### Decision: 补齐关键路径的单元测试和 E2E 测试

### Rationale
章程原则 II 要求: 单元测试覆盖核心逻辑 80%, 每个用户故事至少一个 E2E 测试. 当前 workshop 功能零测试覆盖.

### 实施要点
- 单元测试: 外部 API 客户端 (mock fetch), 验证逻辑, frontmatter 解析/构建
- E2E 测试: 浏览→分析→编辑→发布 的主流程
- 优先级: 客户端 > API 路由 > 组件渲染

---

## 研究结论

| # | 问题 | 优先级 | 复杂度 | 影响 |
|---|------|--------|--------|------|
| 1 | skills.sh 502 bug | P0 | 中 | 核心功能不可用 |
| 2 | ClawHub 分页不匹配 | P1 | 中 | 分页可能不准确 |
| 3 | View Tabs 排序未生效 | P1 | 低 | 功能名存实亡 |
| 4 | 一键改进未实现 | P1 | 低 | 功能缺口 |
| 5 | 类型定义分散 | P2 | 低 | 可维护性 |
| 6 | Validate API 未调用 | P2 | 低 | 代码质量 |
| 7 | AI 端点无限流 | P2 | 中 | 成本风险 |
| 8 | 草稿-编辑器未打通 | P2 | 低 | 用户体验 |
| 9 | 测试覆盖为零 | P1 | 高 | 章程合规 |
