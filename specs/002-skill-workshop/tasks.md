# 任务: Skill Workshop (技能工坊)

**输入**: 来自 `/specs/002-skill-workshop/` 的设计文档
**前置条件**: plan.md(必需)、spec.md(用户故事必需)、research.md、data-model.md、contracts/

**组织结构**: 任务按用户故事分组, 以便每个故事能够独立实施和测试.

## 格式: `[ID] [P] [Story] 描述`
- **[P]**: 可以并行运行(不同文件, 无依赖关系)
- **[Story]**: 此任务属于哪个用户故事(例如: US1、US2、US3)
- 在描述中包含确切的文件路径

## 路径约定
- 项目根目录: `/Users/mengxiangmin/test8/`
- 源代码: `src/`
- 测试: `tests/`

---

## 阶段 1: 设置(共享基础设施)

**目的**: 项目初始化, 创建共享类型定义和数据库迁移

- [X] T001 [US1] 创建集中类型文件 `src/types/workshop.ts`, 包含: `UnifiedSkill`, `PlatformPage`, `AnalysisResultData`, `FrontmatterData`, `Draft`, `TokenInfo`, `ValidationResult`, `ClawHubSortValue` 等类型. 从 `BrowseView.tsx`, `SkillDetailDialog.tsx`, `AnalyzeView.tsx`, `AnalysisResult.tsx`, `FrontmatterForm.tsx`, `PublishView.tsx`, `SkillEditor.tsx` 中提取现有类型定义并集中.
- [X] T002 [P] [US1] 创建数据库迁移文件 `supabase/migrations/056_skill_workshop_enhancements.sql`, 为 `user_skill_drafts` 添加 `template_type`(text, default 'basic'), `validation_status`(text, default 'unknown'), `validation_errors`(jsonb) 字段; 为 `skill_workshop_analyses` 添加 `improved_content`(text), `improvement_applied`(boolean, default false) 字段.

**检查点**: 类型文件和迁移就绪, 所有后续任务可引用统一类型

---

## 阶段 2: 基础(阻塞前置条件)

**目的**: 修复阻塞性 bug 和基础设施问题, 所有用户故事的前置条件

**⚠️ 关键**: 在此阶段完成之前, 无法开始任何用户故事工作

- [X] T003 [US1] 重写 `src/lib/skillssh/client.ts`: 将 `browseSkills()` 和 `searchSkills()` 改用 CLI 无认证端点 `https://skills.sh/api/search?q=...&limit=...`; 新增 `downloadSkill(owner: string, repo: string, slug: string)` 函数使用 `https://skills.sh/api/download/{owner}/{repo}/{slug}` 获取技能文件内容; 将 v1 API 代码注释保留; 区分 401(认证失败) 和 5xx(服务不可用) 错误消息.
- [X] T004 [P] [US1] 修复 `src/lib/clawhub/client.ts`: 将 `browseSkills()` 从 page-based 改为 cursor-based 分页(参数: `limit` + `cursor`, 响应: `{ items, nextCursor }`); 更新排序值为 ClawHub 真实值(`updated`, `recommended`, `installsCurrent`, `installsAllTime`, `trending`, `createdAt`); 更新 `ClawHubBrowseResult` 类型添加 `nextCursor` 和 `hasMore` 字段.
- [X] T005 [US1] 更新 `src/app/api/skills/workshop/skillssh/browse/route.ts`: 适配新的 client 接口(无 `page` 参数, 改为 `q` + `limit`); 区分 401 和 5xx 错误返回不同消息("skills.sh 需要认证" vs "skills.sh 服务暂不可用").
- [X] T006 [P] [US1] 更新 `src/app/api/skills/workshop/skillssh/[id]/route.ts`: 适配新的 `downloadSkill()` 函数获取技能文件内容.
- [X] T007 [P] [US1] 更新 `src/app/api/skills/workshop/clawhub/browse/route.ts`: 适配 cursor-based 分页(接受 `cursor`, `limit`, `sort` 查询参数, 返回 `nextCursor` + `hasMore`).
- [X] T008 [P] [US1] 更新 `src/app/api/skills/workshop/clawhub/search/route.ts`: 适配新 client 接口.
- [X] T009 [P] [US1] 更新 `src/app/api/skills/workshop/clawhub/[slug]/route.ts`: 适配新 `getSkillDetail()` 返回格式.

**检查点**: 外部 API 客户端和代理路由修复完成, skills.sh 不再 502, ClawHub 分页准确

---

## 阶段 3: 用户故事 1 - 浏览社区技能(优先级: P1)🎯 MVP

**目标**: 用户可以浏览 ClawHub 和 skills.sh 上的社区技能, 搜索、筛选、查看详情

**独立测试**: 打开 `/skills/workshop/browse`, 能加载双平台技能列表, 搜索有效, 点击卡片能查看详情, View Tabs 排序生效

### 用户故事 1 的实施

- [X] T010 [US1] 重构 `src/components/skills/BrowseView.tsx`: 从 `@/types/workshop` 导入类型替代内联定义; 将分页从页码模式改为 "加载更多" 模式(基于 cursor); 将 view tabs (hot/trending/newest) 映射为 API 排序参数传递给 fetchClawhub 和 fetchSkillssh; 更新 `fetchClawhub` 传递 `cursor`/`limit`/`sort`; 更新 `fetchSkillssh` 传递 `q`/`limit`; 替换 `PlatformPager` 组件为 "加载更多" 按钮.
- [X] T011 [P] [US1] 重构 `src/components/skills/SkillDetailDialog.tsx`: 从 `@/types/workshop` 导入 `UnifiedSkill` 替代内联定义; 适配 `downloadSkill` 新接口获取 skills.sh 技能内容.
- [X] T012 [P] [US1] 重构 `src/components/skills/SkillCard.tsx`: 从 `@/types/workshop` 导入 `UnifiedSkill` 替代 props 内联类型.

**检查点**: 浏览页面完全功能化 — 双平台加载、搜索、cursor 分页、排序生效、详情查看

---

## 阶段 4: 用户故事 2 - AI 分析技能质量(优先级: P1)

**目标**: 用户可以粘贴或从浏览页加载 SKILL.md, AI 分析 5 维度质量评分, 查看改进建议, 一键改进

**独立测试**: 打开 `/skills/workshop/analyze`, 粘贴 SKILL.md 内容或从浏览页跳转, AI 返回分析结果含雷达图和改进建议, 点击一键改进可生成改进版本

### 用户故事 2 的实施

- [X] T013 [US2] 新建 `src/app/api/skills/workshop/improve/route.ts`: POST 端点, 接受 `{ content, analysisId }`; 从 Supabase 获取分析记录验证 analysisId 归属当前用户; 调用 `generateText()` 使用 `buildSkillImprovementPrompt` + `SKILL_IMPROVEMENT_SYSTEM_PROMPT`(已在 `src/lib/ai/prompts.ts` 中定义); 解析 AI 返回的 `{ improved_content, changes }`; 更新 `skill_workshop_analyses` 记录的 `improved_content` 和 `improvement_applied` 字段; 添加用户级限流(20次/天, 查询当日记录数); 使用 `withTimeout` 设置 180s 超时.
- [X] T014 [US2] 更新 `src/app/api/skills/workshop/analyze/route.ts`: 添加用户级限流(20次/天, 查询 `skill_workshop_analyses` 当日记录数); 返回 429 状态码和限流消息.
- [X] T015 [P] [US2] 更新 `src/app/api/skills/workshop/write-assist/route.ts`: 添加用户级限流(20次/天, 使用内存 Map + TTL 计数器); 返回 429 状态码和限流消息.
- [X] T016 [US2] 更新 `src/components/skills/AnalysisResult.tsx`: 从 `@/types/workshop` 导入类型; 启用 "一键改进" 按钮(移除 disabled 和 "即将推出" 标签); 点击按钮调用 `/api/skills/workshop/improve`; 显示加载状态; 成功后展示改进内容 diff 视图(改进前 vs 改进后); 添加 "使用改进版本" 按钮将改进内容传递给编辑器.
- [X] T017 [US2] 更新 `src/components/skills/AnalyzeView.tsx`: 从 `@/types/workshop` 导入类型; 接收来自 AnalysisResult 的改进内容, 支持 "在编辑器中打开" 跳转到 `/skills/workshop/write?draftId=xxx` 或携带改进内容.

**检查点**: 分析功能完全 — AI 分析 + 5维度评分 + 一键改进 + 限流保护

---

## 阶段 5: 用户故事 3 - 引导式技能编辑器(优先级: P2)

**目标**: 用户可以使用 4 种模板、frontmatter 表单、AI 辅助写作来创建和编辑技能, 支持从草稿加载继续编辑

**独立测试**: 打开 `/skills/workshop/write`, 选择模板开始编辑, 使用引导模式填写 frontmatter, 切换到原始模式, AI 辅助生成内容, 保存草稿; 从 Publish 页面点击编辑回到编辑器继续编辑

### 用户故事 3 的实施

- [X] T018 [US3] 更新 `src/app/skills/workshop/write/page.tsx`: 支持 `?draftId=xxx` 查询参数; 页面加载时如有 draftId 则调用 `GET /api/skills/workshop/drafts/[id]` 获取草稿内容填充编辑器; 保存草稿时如已有 draftId 则调用 PUT 更新而非 POST 创建.
- [X] T019 [US3] 更新 `src/components/skills/SkillEditor.tsx`: 从 `@/types/workshop` 导入类型; 接受 `initialContent` 和 `draftId` props 用于加载已有草稿; 保存时调用服务端验证 API `/api/skills/workshop/validate` 合并验证结果; 保存草稿时传递 `template_type` 和 `validation_status` 字段.
- [X] T020 [P] [US3] 更新 `src/components/skills/FrontmatterForm.tsx`: 从 `@/types/workshop` 导入 `FrontmatterData`; 确保导出的 `buildFrontmatterString()` 和 `parseFrontmatter()` 函数接受新字段 `template_type`.
- [X] T021 [P] [US3] 更新 `src/components/skills/SkillPreview.tsx`: 从 `@/types/workshop` 导入类型; 适配新 frontmatter 字段显示.
- [X] T022 [P] [US3] 更新 `src/components/skills/ValidationReport.tsx`: 从 `@/types/workshop` 导入 `ValidationResult`; 合并客户端和服务端验证结果显示.

**检查点**: 编辑器完全功能化 — 模板选择、引导/原始模式、AI 辅助、草稿加载、服务端验证

---

## 阶段 6: 用户故事 4 - 发布技能到社区(优先级: P2)

**目标**: 用户可以配置 ClawHub API token, 一键发布技能到 ClawHub, skills.sh 使用 CLI fallback, 管理草稿和已发布技能

**独立测试**: 打开 `/skills/workshop/publish`, 配置 ClawHub token, 选择草稿发布到 ClawHub 成功, skills.sh 显示 CLI 指引, 草稿列表中可点击编辑回到编辑器

### 用户故事 4 的实施

- [X] T023 [US4] 更新 `src/components/skills/PublishView.tsx`: 从 `@/types/workshop` 导入类型; 草稿列表中每个草稿项添加 "编辑" 按钮, 点击跳转 `/skills/workshop/write?draftId={id}`; 发布前强制调用 `/api/skills/workshop/validate` 验证, 验证失败则显示错误阻止发布; 显示草稿的 `template_type` 和 `validation_status` 信息.
- [X] T024 [P] [US4] 更新 `src/app/api/skills/workshop/publish/route.ts`: 发布前调用 validate 逻辑验证草稿内容; 更新草稿的 `validation_status` 字段; 发布成功后更新草稿 `status` 为 'published'.
- [X] T025 [P] [US4] 更新 `src/app/api/skills/workshop/drafts/route.ts`: GET 响应中包含 `template_type`, `validation_status` 字段; POST 接受 `template_type` 参数.
- [X] T026 [P] [US4] 更新 `src/app/api/skills/workshop/drafts/[id]/route.ts`: PUT 接受 `template_type`, `validation_status`, `validation_errors` 参数.

**检查点**: 发布功能完全 — token 配置、一键发布、CLI fallback、草稿管理、编辑回链

---

## 阶段 7: 完善与横切关注点

**目的**: 影响多个用户故事的改进, 代码质量, 章程合规

- [X] T027 [P] 为 `src/lib/skillssh/client.ts` 编写单元测试 `tests/unit/workshop/skillssh-client.test.ts`: mock fetch 测试 `browseSkills()`, `searchSkills()`, `downloadSkill()` 的正常和错误场景; 验证无认证端点 URL 格式; 验证错误区分(401 vs 5xx).
- [X] T028 [P] 为 `src/lib/clawhub/client.ts` 编写单元测试 `tests/unit/workshop/clawhub-client.test.ts`: mock fetch 测试 cursor-based 分页; 验证 sort 参数映射; 验证 `nextCursor` 解析.
- [X] T029 [P] 为 `src/components/skills/FrontmatterForm.tsx` 编写单元测试 `tests/unit/workshop/frontmatter-form.test.ts`: 测试 `buildFrontmatterString()` 和 `parseFrontmatter()` 函数; 验证必填字段校验; 验证 name regex 规则.
- [X] T030 [P] 为 SKILL.md 验证逻辑编写单元测试 `tests/unit/workshop/validate.test.ts`: 测试有效/无效 frontmatter; 缺少必填字段; name regex; description 长度.
- [X] T031 [P] 编写 E2E 测试 `tests/e2e/workshop.spec.ts`: 测试浏览→查看详情→AI 分析→编辑→保存草稿→发布 的主流程; 每个用户故事至少一个测试用例.
- [X] T032 运行 `pnpm format && pnpm lint && pnpm typecheck` 修复所有现有代码质量问题; 消除 `any` 类型; 确保所有文件通过 ESLint/Prettier/tsc 检查.
- [X] T033 运行 `pnpm build && pnpm start` 验证生产模式; 确认 skills.sh 不再 502; 确认 ClawHub 分页正确; 确认一键改进功能可用.

---

## 依赖关系与执行顺序

### 阶段依赖关系

- **设置(阶段 1)**: 无依赖关系 — 可立即开始
- **基础(阶段 2)**: 依赖于 T001(类型定义) — 阻塞所有用户故事
- **用户故事 1(阶段 3)**: 依赖于阶段 2 完成
- **用户故事 2(阶段 4)**: 依赖于阶段 2 完成, 可与 US1 并行
- **用户故事 3(阶段 5)**: 依赖于阶段 2 完成, US2 的 T017 可与此阶段集成
- **用户故事 4(阶段 6)**: 依赖于阶段 2 完成, US3 的 T018(草稿加载) 与此阶段集成
- **完善(阶段 7)**: 依赖于所有用户故事完成

### 用户故事依赖关系

- **US1(浏览)**: 可在基础(阶段 2) 后开始 — 无其他故事依赖
- **US2(分析)**: 可在基础(阶段 2) 后开始 — "一键改进→编辑器" 跳转与 US3 集成但可独立测试
- **US3(编辑)**: 可在基础(阶段 2) 后开始 — 草稿加载与 US4 集成但可独立测试
- **US4(发布)**: 可在基础(阶段 2) 后开始 — 依赖 US3 的编辑器可用才能 "编辑" 回跳

### 每个用户故事内部

- 客户端修改需等待对应服务端路由更新
- 组件重构需等待类型文件就绪(T001)
- API 路由更新需等待 client 库更新(T003-T009)

### 并行机会

- T002(迁移) 可与 T001(类型) 并行
- T004(ClawHub client) 可与 T003(skills.sh client) 并行
- T005-T009(API 路由更新) 可在 client 更新后并行
- T011(SkillDetailDialog) 可与 T012(SkillCard) 并行
- T014(分析限流) 可与 T015(写作限流) 并行
- T020-T022(编辑器子组件) 可并行
- T024-T026(发布 API 路由) 可并行
- T027-T031(所有测试) 可并行

---

## 并行示例: 阶段 2 (基础)

```bash
# 先完成 client 库重写(阻塞 API 路由):
任务 T003: "重写 src/lib/skillssh/client.ts"
任务 T004: "重写 src/lib/clawhub/client.ts"  # 与 T003 并行

# client 完成后, 并行更新所有 API 路由:
任务 T005: "更新 skillssh/browse 路由"
任务 T006: "更新 skillssh/[id] 路由"       # 与 T005 并行
任务 T007: "更新 clawhub/browse 路由"       # 与 T005 并行
任务 T008: "更新 clawhub/search 路由"       # 与 T005 并行
任务 T009: "更新 clawhub/[slug] 路由"       # 与 T005 并行
```

## 并行示例: 阶段 7 (测试)

```bash
# 所有测试可完全并行:
任务 T027: "skillssh client 单元测试"
任务 T028: "clawhub client 单元测试"
任务 T029: "frontmatter form 单元测试"
任务 T030: "validate 单元测试"
任务 T031: "E2E 测试"
```

---

## 实施策略

### 仅 MVP(用户故事 1)

1. 完成阶段 1: 设置(T001-T002)
2. 完成阶段 2: 基础(T003-T009) — 修复 skills.sh 502 和 ClawHub 分页
3. 完成阶段 3: 用户故事 1(T010-T012) — 浏览功能完全可用
4. **停止并验证**: 独立测试浏览功能
5. 可部署/演示

### 增量交付

1. 完成设置 + 基础 → 外部 API 修复就绪
2. 添加 US1(浏览) → 独立测试 → 部署(MVP!)
3. 添加 US2(分析) → 独立测试 → 部署(含一键改进)
4. 添加 US3(编辑) → 独立测试 → 部署(含草稿加载)
5. 添加 US4(发布) → 独立测试 → 部署(含编辑回链)
6. 完善测试 + 质量检查 → 最终部署

### 建议的 MVP 范围

**US1(浏览)** 是最小可行产品. 原因:
- 修复了 skills.sh 502 阻塞性 bug(P0)
- 修复了 ClawHub 分页问题(P1)
- 使 View Tabs 排序生效(P1)
- 其他功能(分析/编辑/发布)已有基础实现可继续使用

---

## 注意事项

- [P] 任务 = 不同文件, 无依赖关系
- [Story] 标签将任务映射到特定用户故事以实现可追溯性
- 每个用户故事应该独立可完成和可测试
- 在每个任务或逻辑组后提交
- 在任何检查点停止以独立验证故事
- 避免: 模糊任务、相同文件冲突、破坏独立性的跨故事依赖
- 现有代码已基本实现, 大部分任务是修复/增强而非从零构建
