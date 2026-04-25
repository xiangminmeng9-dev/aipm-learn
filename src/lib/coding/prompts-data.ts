// 精选 AI Coding 提示词范例 — 完整项目级开发工作流
// 分类：完整项目、系统设计、AI 应用、前端开发、后端开发、DevOps、代码审查

export interface PromptExample {
  id: string;
  title: string;
  category: string;
  tags: string[];
  source: string;
  sourceUrl: string;
  prompt: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const PROMPT_EXAMPLES: PromptExample[] = [
  // ── 完整项目 ──
  {
    id: 'proj-01',
    title: '从零搭建 Next.js SaaS 全栈项目',
    category: '完整项目',
    tags: ['next.js', 'saas', 'fullstack', 'supabase'],
    source: 'Claude Code 最佳实践',
    sourceUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    prompt: `我要从零搭建一个 Next.js SaaS 全栈项目。请按以下步骤完整实施：

## 技术栈
- Next.js 14 App Router + TypeScript
- Supabase（Auth + DB + Storage + RLS）
- Tailwind CSS + shadcn/ui
- Vercel 部署

## 第一步：项目初始化
1. 用 create-next-app 初始化，选择 App Router + TypeScript + Tailwind
2. 安装并配置 Supabase 客户端（@supabase/ssr）
3. 配置中间件处理 Auth session 刷新
4. 创建 .env.local 模板文件

## 第二步：认证系统
1. 实现登录页（邮箱+密码 + Google OAuth）
2. 实现注册页（邮箱验证流程）
3. 创建 Supabase Auth 中间件，保护路由
4. 实现忘记密码/重置密码流程
5. 创建 useAuth hook 和 AuthProvider

## 第三步：数据库设计
1. 设计 profiles 表（id, user_id FK, name, avatar_url, plan, created_at）
2. 设计 projects 表（id, user_id FK, name, description, settings JSONB, created_at, updated_at）
3. 设置 RLS 策略：用户只能访问自己的数据
4. 创建 Supabase migration SQL 文件

## 第四步：核心功能
1. Dashboard 页面：展示用户项目列表
2. 项目 CRUD：创建/读取/更新/删除
3. 项目设置页：表单 + 实时保存
4. 文件上传：Supabase Storage + 预览

## 第五步：付费与订阅
1. Stripe 集成：Checkout Session + Webhook
2. 免费版/专业版功能限制
3. 订阅管理页面

## 第六步：部署
1. Vercel 项目配置
2. 环境变量设置
3. Supabase 生产环境配置

每一步都要给出完整的代码文件，不要省略。先从第一步开始，等我确认后再继续。`,
    description: '从零搭建完整的 Next.js SaaS 项目，涵盖认证、数据库、核心功能、付费和部署',
    difficulty: 'advanced',
  },
  {
    id: 'proj-02',
    title: '构建 AI 聊天应用（类 ChatGPT）',
    category: '完整项目',
    tags: ['ai', 'chat', 'streaming', 'claude-api'],
    source: 'Anthropic 文档',
    sourceUrl: 'https://docs.anthropic.com/en/docs/build-with-claude',
    prompt: `构建一个 AI 聊天应用，支持多轮对话、流式输出和对话管理。

## 技术栈
- Next.js 14 App Router + TypeScript
- Claude API（Anthropic SDK）
- Supabase（存储对话历史）
- Tailwind CSS

## 功能需求

### 1. 对话管理
- 创建新对话
- 对话列表侧边栏
- 删除对话
- 对话标题自动生成（根据第一条消息）

### 2. 聊天界面
- 消息气泡（用户/AI 区分样式）
- 流式输出（SSE，逐字显示 AI 回复）
- Markdown 渲染（代码高亮 + 复制按钮）
- 打字指示器（AI 正在回复时显示）
- 自动滚动到最新消息

### 3. API 设计
- POST /api/chat：发送消息，返回 SSE 流
  - 接收：{ conversationId, message }
  - 返回：text/event-stream，每行是 AI 输出的一个 token
- GET /api/conversations：获取对话列表
- POST /api/conversations：创建新对话
- DELETE /api/conversations/[id]：删除对话

### 4. 数据库设计
- conversations 表：id, user_id, title, created_at, updated_at
- messages 表：id, conversation_id FK, role (user/assistant), content, created_at

### 5. 系统提示词
- 支持自定义系统提示词
- 保存到对话设置中

### 6. 上下文管理
- 自动管理对话上下文窗口
- 超过 token 限制时，压缩旧消息为摘要
- 显示当前 token 使用量

请给出完整的项目结构和所有代码文件。`,
    description: '完整的 AI 聊天应用，支持流式输出、多轮对话、Markdown 渲染',
    difficulty: 'advanced',
  },
  {
    id: 'proj-03',
    title: '构建 AI 知识库 RAG 系统',
    category: '完整项目',
    tags: ['rag', 'knowledge-base', 'embedding', 'vector-search'],
    source: 'LangChain 社区',
    sourceUrl: 'https://python.langchain.com/docs/',
    prompt: `构建一个 AI 知识库系统，用户上传文档后可以通过自然语言搜索和问答。

## 核心流程
1. 用户上传文档（PDF/Markdown/TXT）
2. 系统自动切分、嵌入、存储到向量数据库
3. 用户提问时，检索相关文档片段
4. AI 基于检索结果生成回答，附带来源引用

## 技术栈
- Next.js 14 + TypeScript
- Supabase pgvector（向量存储）
- OpenAI Embeddings API（text-embedding-3-small）
- Claude API（生成回答）
- Vercel AI SDK（流式输出）

## 模块一：文档处理管道
\`\`\`
上传文件 → 解析文本 → 切分（500 token/块，50 token 重叠）
→ 生成嵌入 → 存储到 Supabase（content + embedding + metadata）
\`\`\`

具体实现：
- PDF 解析：用 pdf-parse 提取文本
- Markdown 解析：按标题层级切分
- 切分策略：保留段落完整性，不截断句子
- 元数据：文件名、页码、章节标题、上传时间

## 模块二：向量检索
\`\`\`
用户问题 → 生成问题嵌入 → 向量相似度搜索（余弦距离）
→ Top-K 结果 → 重排序 → 拼接上下文
\`\`\`

具体实现：
- Supabase pgvector 的 match_documents RPC 函数
- 混合搜索：语义搜索 + 关键词搜索
- 相关性阈值过滤（< 0.5 的结果丢弃）
- MMR 多样性重排（避免返回重复内容）

## 模块三：问答生成
\`\`\`
检索结果 + 用户问题 → 构造 Prompt → Claude 生成回答
→ 流式输出 → 附带来源引用
\`\`\`

Prompt 模板：
\`\`\`
你是知识库助手。根据以下检索到的文档片段回答用户问题。

如果文档中没有相关信息，明确说明"知识库中未找到相关信息"，不要编造。

检索到的文档：
{context}

用户问题：{question}

回答格式：
1. 直接回答问题
2. 在回答中标注来源，如 [文档1, 第3页]
3. 如果有多个相关文档，综合分析
\`\`\`

## 模块四：前端界面
- 文档上传区（拖拽上传 + 进度条）
- 知识库列表（文件名、状态、chunk 数量）
- 问答界面（聊天式，引用可点击跳转原文）
- 管理后台（删除文档、查看统计）

## 数据库 Schema
\`\`\`sql
-- 文档表
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  chunk_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 文档块表（含向量）
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 匹配函数
CREATE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
) RETURNS TABLE (...) LANGUAGE plpgsql ...
\`\`\`

请给出完整的实现代码，包括 API 路由、前端组件和数据库迁移。`,
    description: '完整的 RAG 知识库系统，从文档上传到智能问答，含向量检索和来源引用',
    difficulty: 'advanced',
  },

  // ── 系统设计 ──
  {
    id: 'sys-01',
    title: '设计高并发 API 限流系统',
    category: '系统设计',
    tags: ['rate-limit', 'redis', 'middleware', 'scalability'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `设计并实现一个 API 限流系统，支持多种限流策略。

## 需求
1. 支持三种限流算法：
   - 固定窗口计数器
   - 滑动窗口日志
   - 令牌桶
2. 支持多维度限流：IP、用户 ID、API Key
3. 支持自定义限流规则（不同接口不同限制）
4. 返回标准限流响应头：X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
5. 超限时返回 429 + Retry-After 头

## 技术方案
- Redis 存储计数器（INCR + EXPIRE）
- Next.js 中间件拦截请求
- 配置文件定义限流规则

## 限流规则配置
\`\`\`typescript
const rateLimitRules = {
  '/api/chat': { window: '1m', limit: 20, strategy: 'sliding' },
  '/api/upload': { window: '1h', limit: 100, strategy: 'token-bucket', burst: 10 },
  'default': { window: '1m', limit: 60, strategy: 'fixed' },
};
\`\`\`

## 实现要求
1. Redis 限流器类（支持三种算法）
2. Next.js 中间件（读取规则、检查限流、设置响应头）
3. 限流规则配置文件
4. 单元测试（模拟 Redis 和高并发场景）
5. 监控日志（记录限流事件）

请给出完整代码。`,
    description: '高并发 API 限流系统，支持固定窗口/滑动窗口/令牌桶三种算法',
    difficulty: 'advanced',
  },
  {
    id: 'sys-02',
    title: '设计实时协作编辑系统（类 Notion）',
    category: '系统设计',
    tags: ['collaboration', 'crdt', 'websocket', 'realtime'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `设计一个实时协作编辑系统的核心架构和实现。

## 核心需求
1. 多人同时编辑同一文档，实时看到彼此的修改
2. 离线编辑支持，重新上线后自动同步
3. 冲突解决：不丢失任何人的修改
4. 光标位置同步：看到其他人的光标位置

## 架构设计

### 数据模型：CRDT（Conflict-free Replicated Data Type）
- 使用 Yjs CRDT 库处理冲突
- 每个文档一个 Y.Doc 实例
- 操作类型：insert, delete, format

### 同步协议
1. 客户端连接 WebSocket
2. 发送本地变更（增量更新）
3. 接收远程变更并应用到本地
4. 新用户加入时，发送完整文档状态 + 增量历史

### 服务端
- WebSocket 服务器（维护房间/文档映射）
- 持久化 CRDT 状态到数据库
- 历史版本管理（定期快照 + 增量日志）

### 前端
- 编辑器集成（Tiptap + Yjs binding）
- 光标同步（Awareness 协议）
- 在线用户列表
- 连接状态指示器

## 实现范围
1. WebSocket 服务器（Node.js + ws 库）
2. CRDT 文档管理器
3. 前端编辑器组件
4. 数据库 Schema（documents, document_versions, document_operations）

请给出核心代码实现。`,
    description: '实时协作编辑系统，CRDT 冲突解决 + WebSocket 同步 + 离线支持',
    difficulty: 'advanced',
  },

  // ── AI 应用 ──
  {
    id: 'ai-01',
    title: '构建 AI Agent 自动化工作流',
    category: 'AI 应用',
    tags: ['agent', 'tool-use', 'react', 'autonomous'],
    source: 'Anthropic 文档',
    sourceUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/tool-use',
    prompt: `构建一个 AI Agent，能自主完成多步骤任务。

## Agent 架构：ReAct 循环
\`\`\`
用户任务 → [思考 → 选择工具 → 执行 → 观察结果] 循环 → 最终回答
\`\`\`

## 工具定义
\`\`\`typescript
const tools = [
  {
    name: 'web_search',
    description: '搜索网络信息',
    input_schema: { query: string, max_results?: number }
  },
  {
    name: 'code_execute',
    description: '在沙箱中执行 Python/JS 代码',
    input_schema: { language: 'python'|'javascript', code: string }
  },
  {
    name: 'file_read',
    description: '读取项目文件内容',
    input_schema: { path: string }
  },
  {
    name: 'file_write',
    description: '写入文件',
    input_schema: { path: string, content: string }
  },
  {
    name: 'api_call',
    description: '发起 HTTP 请求',
    input_schema: { url: string, method: string, headers?: object, body?: string }
  },
  {
    name: 'database_query',
    description: '执行 SQL 查询（只读）',
    input_schema: { sql: string }
  }
];
\`\`\`

## 核心实现
1. Agent 类：
   - 接收任务描述
   - 维护对话历史和工具调用记录
   - 每步决策：思考 → 行动 → 观察
   - 最大迭代次数 15，防止无限循环
   - 支持提前终止（任务完成）

2. 工具执行器：
   - 安全执行每个工具调用
   - 超时控制（每个工具 30 秒）
   - 错误处理和重试
   - 执行结果格式化

3. 决策 Prompt：
\`\`\`
你是一个 AI Agent，正在执行任务：{task}

当前进度：
{conversation_history}

可用工具：{tools}

请思考下一步操作：
1. 分析当前状态
2. 决定是否需要继续（任务是否已完成）
3. 如果需要继续，选择工具和参数
4. 如果任务完成，给出最终回答

输出格式（JSON）：
{
  "thought": "当前分析和推理",
  "action": "tool_name" 或 "finish",
  "action_input": { ... } 或 "最终回答",
  "is_complete": true/false
}
\`\`\`

4. 执行日志：
   - 记录每步的思考、行动、观察
   - 支持回放和调试
   - 可视化执行流程

请给出完整的 TypeScript 实现。`,
    description: 'AI Agent 自动化工作流，ReAct 循环 + 多工具调用 + 安全执行',
    difficulty: 'advanced',
  },
  {
    id: 'ai-02',
    title: '实现 Prompt 缓存优化策略',
    category: 'AI 应用',
    tags: ['prompt-caching', 'cost-optimization', 'claude-api'],
    source: 'Anthropic 文档',
    sourceUrl: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching',
    prompt: `为 Claude API 集成实现 Prompt 缓存策略，降低 API 成本 50% 以上。

## 背景
当前每月 Claude API 费用 $2000，主要来自：
- 重复的系统提示词（每次请求都发送完整 system prompt，约 2000 tokens）
- 长上下文对话（历史消息累积，每次发送全量）
- 文档分析（同一文档反复查询）

## 缓存策略

### 1. 系统提示词缓存
\`\`\`typescript
// 使用 cache_control 标记可缓存内容
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 1024,
  system: [
    {
      type: 'text',
      text: longSystemPrompt,  // 2000+ tokens 的系统提示词
      cache_control: { type: 'ephemeral' }
    }
  ],
  messages: [...]
});
\`\`\`

### 2. 对话历史缓存
- 将旧消息标记为可缓存
- 只让最新消息不缓存
- 压缩策略：超过 10 轮时，压缩前 8 轮为摘要

### 3. 文档缓存
- 上传文档后，将文档内容标记为缓存
- 后续查询同一文档时，直接命中缓存
- 文档更新时，自动失效旧缓存

### 4. 缓存监控
- 追踪 cache_creation_input_tokens 和 cache_read_input_tokens
- 计算缓存命中率
- 按功能模块统计成本
- 生成每日成本报告

## 实现要求
1. 封装 Anthropic 客户端，自动处理缓存标记
2. 对话管理器，自动压缩和缓存历史
3. 缓存监控中间件
4. 成本分析仪表盘

请给出完整实现代码。`,
    description: 'Prompt 缓存优化策略，降低 Claude API 成本 50%+',
    difficulty: 'intermediate',
  },
  {
    id: 'ai-03',
    title: '实现 AI 内容审核系统',
    category: 'AI 应用',
    tags: ['content-moderation', 'safety', 'pipeline'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `构建一个 AI 内容审核系统，自动检测和过滤用户生成内容。

## 审核维度
1. 违禁内容：暴力、色情、违法信息
2. 敏感话题：政治、宗教、争议性话题
3. 垃圾信息：广告、刷屏、恶意链接
4. 个人信息：手机号、身份证号、银行卡号泄露
5. 仇恨言论：歧视、侮辱、骚扰

## 架构设计

### 多层审核管道
\`\`\`
用户内容 → [规则引擎快速过滤] → [AI 模型深度审核] → [人工复审队列]
                ↓                        ↓                      ↓
            明确违规→拦截           疑似违规→标记          争议内容→人工判断
\`\`\`

### 第一层：规则引擎（毫秒级）
- 正则匹配违禁词库
- 个人信息检测（手机号、身份证号正则）
- 链接黑名单检查
- 频率限制（同一用户短时间内大量提交）

### 第二层：AI 审核（秒级）
- Claude API 分类审核
- Prompt 模板：
\`\`\`
你是内容审核员。判断以下内容是否违规。

审核维度：暴力、色情、违法、敏感、垃圾信息、个人信息泄露、仇恨言论

内容：{content}

输出 JSON：
{
  "is_violation": true/false,
  "severity": "high"/"medium"/"low",
  "categories": ["violence", "spam", ...],
  "confidence": 0.0-1.0,
  "reason": "违规原因说明"
}
\`\`\`

### 第三层：人工复审
- AI 置信度 < 0.8 的内容进入人工队列
- 提供审核界面：内容 + AI 判断 + 操作按钮
- 人工判断反馈用于优化 AI 模型

## 实现要求
1. 审核管道类（三层串联）
2. 规则引擎（可配置规则）
3. AI 审核器（Claude API 封装）
4. 审核结果存储和查询
5. 管理后台（审核队列 + 统计面板）

请给出完整代码。`,
    description: 'AI 内容审核系统，三层管道：规则引擎 → AI 审核 → 人工复审',
    difficulty: 'advanced',
  },

  // ── 前端开发 ──
  {
    id: 'fe-01',
    title: '实现高级数据表格组件',
    category: '前端开发',
    tags: ['table', 'pagination', 'filter', 'sort', 'react'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `实现一个功能完善的数据表格组件，支持排序、筛选、分页和行操作。

## 功能清单
1. 列排序（升序/降序/默认，支持多列排序）
2. 列筛选（文本搜索、下拉选择、范围筛选）
3. 分页（前端分页 + 服务端分页）
4. 行选择（单选/多选/全选）
5. 行操作（编辑、删除、自定义操作按钮）
6. 列宽拖拽调整
7. 列显隐控制
8. 固定列（左固定/右固定）
9. 空状态和加载状态
10. 导出 CSV

## API 设计
\`\`\`typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[] | (() => Promise<PaginatedResponse<T>>);  // 静态数据或异步函数
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  pageSize?: number;
  serverSide?: boolean;  // 服务端分页/排序/筛选
  onFetch?: (params: FetchParams) => Promise<PaginatedResponse<T>>;
  rowActions?: RowAction<T>[];
  emptyMessage?: string;
  loading?: boolean;
}
\`\`\`

## 实现要求
1. 使用 React + TypeScript
2. 不依赖第三方表格库，自己实现
3. 性能优化：虚拟滚动（大数据量）、memo 避免不必要渲染
4. 可访问性：键盘导航、ARIA 属性
5. 响应式：小屏幕自动隐藏次要列

请给出完整组件代码和使用示例。`,
    description: '高级数据表格组件，排序/筛选/分页/行操作/虚拟滚动',
    difficulty: 'intermediate',
  },
  {
    id: 'fe-02',
    title: '实现拖拽看板组件（类 Trello）',
    category: '前端开发',
    tags: ['drag-drop', 'kanban', 'board', 'react'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `实现一个拖拽看板组件，支持列间拖拽排序和列内卡片排序。

## 功能需求
1. 多列看板（可添加/删除列）
2. 卡片在列内拖拽排序
3. 卡片跨列拖拽
4. 列标题可编辑
5. 卡片 CRUD（添加/编辑/删除）
6. 卡片详情弹窗
7. 拖拽时的视觉反馈（占位符、阴影）
8. 触摸设备支持
9. 撤销/重做操作

## 技术方案
- 使用 HTML5 Drag and Drop API
- 触摸设备用 pointer events 模拟
- 状态管理用 useReducer + Context

## 数据模型
\`\`\`typescript
interface Board {
  id: string;
  title: string;
  columns: Column[];
}

interface Column {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

interface Card {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  assignee?: string;
  dueDate?: string;
  order: number;
}
\`\`\`

## 实现要求
1. 完整的拖拽逻辑（列内 + 跨列）
2. 流畅的动画过渡
3. 持久化到 localStorage
4. 键盘可访问（Tab + Enter 操作卡片）

请给出完整代码。`,
    description: '拖拽看板组件，支持列间/列内拖拽、卡片 CRUD、触摸设备',
    difficulty: 'intermediate',
  },

  // ── 后端开发 ──
  {
    id: 'be-01',
    title: '实现完整的用户权限系统（RBAC）',
    category: '后端开发',
    tags: ['rbac', 'auth', 'permission', 'middleware'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `实现一个基于角色的访问控制（RBAC）系统。

## 数据模型
\`\`\`typescript
// 角色
interface Role {
  id: string;
  name: string;  // admin, editor, viewer
  permissions: Permission[];
}

// 权限
interface Permission {
  resource: string;  // 'articles', 'users', 'settings'
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

// 用户-角色关联
interface UserRole {
  user_id: string;
  role_id: string;
  scope?: string;  // 可选的作用域，如特定项目 ID
}
\`\`\`

## 功能需求
1. 角色管理：创建/编辑/删除角色，分配权限
2. 用户授权：给用户分配角色，支持多角色
3. 权限检查中间件：API 路由自动检查权限
4. 前端权限指令：根据权限显示/隐藏 UI 元素
5. 审计日志：记录所有权限变更

## 实现要求

### 1. 数据库 Schema
\`\`\`sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users NOT NULL,
  role_id UUID REFERENCES roles NOT NULL,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_id, scope)
);
\`\`\`

### 2. 权限检查中间件
\`\`\`typescript
// 使用方式
@RequirePermission('articles', 'update')
async function handleUpdateArticle(req, res) { ... }

// 或在 Next.js 中间件中
export function withPermission(resource: string, action: string) {
  return (handler) => async (req, res) => {
    const user = await getUser(req);
    const hasPermission = await checkPermission(user.id, resource, action);
    if (!hasPermission) return res.status(403).json({ error: '无权限' });
    return handler(req, res);
  };
}
\`\`\`

### 3. 前端权限 Hook
\`\`\`typescript
const { hasPermission, loading } = usePermission();
if (hasPermission('articles', 'create')) {
  // 显示创建按钮
}
\`\`\`

### 4. 预设角色
- admin：所有权限
- editor：创建/编辑内容，不能管理用户
- viewer：只读权限

请给出完整实现。`,
    description: '完整 RBAC 权限系统，角色管理 + 权限中间件 + 前端权限指令',
    difficulty: 'advanced',
  },
  {
    id: 'be-02',
    title: '实现异步任务队列系统',
    category: '后端开发',
    tags: ['queue', 'worker', 'async', 'redis'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `实现一个异步任务队列系统，处理耗时的后台任务。

## 使用场景
- AI 文档分析（耗时 10-60 秒）
- 批量数据导入
- 报告生成
- 邮件发送

## 架构
\`\`\`
生产者 → [任务队列 Redis] → 消费者 Worker → [结果存储] → 前端轮询/SSE
\`\`\`

## 功能需求
1. 任务提交：返回 task_id，前端可轮询状态
2. 任务优先级：high / normal / low
3. 任务重试：失败自动重试，最多 3 次，指数退避
4. 任务超时：超过 5 分钟自动标记失败
5. 并发控制：Worker 同时处理 N 个任务
6. 任务进度：支持报告进度百分比
7. 任务取消：用户可取消排队中的任务

## API 设计
\`\`\`
POST   /api/tasks          提交任务 → { task_id }
GET    /api/tasks/[id]     查询状态 → { status, progress, result }
POST   /api/tasks/[id]/cancel  取消任务
GET    /api/tasks          任务列表（支持筛选状态）
\`\`\`

## 任务状态机
\`\`\`
pending → running → completed
                  → failed → retrying → running
pending → cancelled
running → cancelled
\`\`\`

## 实现要求
1. 任务队列类（基于 Redis LIST + SORTED SET）
2. Worker 进程（可多实例部署）
3. 任务处理器注册机制
4. 前端轮询 Hook（useTaskStatus）
5. 监控面板（队列长度、处理速度、失败率）

请给出完整 TypeScript 实现。`,
    description: '异步任务队列系统，优先级/重试/超时/并发控制/进度追踪',
    difficulty: 'advanced',
  },

  // ── DevOps ──
  {
    id: 'ops-01',
    title: '配置 CI/CD 流水线（GitHub Actions）',
    category: 'DevOps',
    tags: ['ci-cd', 'github-actions', 'testing', 'deployment'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `为 Next.js 项目配置完整的 CI/CD 流水线。

## 流水线阶段

### 1. PR 检查（pull_request 触发）
- 代码检查：ESLint + Prettier
- 类型检查：tsc --noEmit
- 单元测试：vitest --coverage
- E2E 测试：Playwright（仅关键路径）
- 构建验证：next build（确保能成功构建）

### 2. 预览部署（PR 合并到 develop 触发）
- 部署到 Vercel Preview
- 生成预览 URL，评论到 PR
- 运行 Lighthouse CI（性能评分）

### 3. 生产部署（push 到 main 触发）
- 运行完整测试套件
- 部署到 Vercel Production
- 数据库迁移（Supabase）
- 部署后健康检查
- Slack 通知部署结果

### 4. 定期任务（cron 触发）
- 每日运行完整 E2E 测试
- 每周检查依赖安全漏洞（npm audit）
- 每月更新依赖（自动创建 PR）

## 配置要求
1. 使用 GitHub Actions YAML
2. 缓存 node_modules 和 .next/cache
3. 并行执行独立阶段
4. 失败时发送 Slack 通知
5. 环境变量通过 GitHub Secrets 管理
6. 矩阵测试（Node 18 + 20）

请给出完整的 .github/workflows 配置文件。`,
    description: '完整 CI/CD 流水线，PR 检查/预览部署/生产部署/定期任务',
    difficulty: 'intermediate',
  },
  {
    id: 'ops-02',
    title: '实现应用监控与告警系统',
    category: 'DevOps',
    tags: ['monitoring', 'alerting', 'observability', 'logging'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `为 Next.js 应用实现监控与告警系统。

## 监控维度

### 1. 应用性能
- API 响应时间（P50/P95/P99）
- 页面加载时间（Web Vitals：LCP/FID/CLS）
- 错误率（4xx/5xx 比例）
- 并发连接数

### 2. 业务指标
- 日活用户
- 关键功能使用量
- 转化漏斗
- AI API 调用量和成本

### 3. 基础设施
- CPU/内存使用率
- 数据库连接池
- Redis 内存使用
- 磁盘空间

## 实现方案

### 日志采集
\`\`\`typescript
// 结构化日志
logger.info('api_request', {
  method: req.method,
  path: req.url,
  status: res.statusCode,
  duration: endTime - startTime,
  userId: user?.id,
});

logger.error('api_error', {
  path: req.url,
  error: err.message,
  stack: err.stack,
  userId: user?.id,
});
\`\`\`

### 指标收集
\`\`\`typescript
// 自定义指标
metrics.increment('api.chat.request');
metrics.histogram('api.chat.duration', duration);
metrics.gauge('active_users', count);
\`\`\`

### 告警规则
\`\`\`typescript
const alerts = [
  { metric: 'api_error_rate', threshold: 0.05, window: '5m', action: 'slack' },
  { metric: 'api_p95_latency', threshold: 3000, window: '10m', action: 'slack' },
  { metric: 'db_connections', threshold: 80, window: '5m', action: 'pagerduty' },
  { metric: 'ai_cost_daily', threshold: 50, window: '1d', action: 'email' },
];
\`\`\`

## 实现要求
1. Next.js 中间件自动采集 API 指标
2. Web Vitals 采集（next/script + reportWebVitals）
3. 错误边界自动上报
4. 告警通知（Slack Webhook）
5. 简易监控仪表盘页面

请给出完整实现代码。`,
    description: '应用监控与告警系统，性能/业务/基础设施三维监控',
    difficulty: 'intermediate',
  },

  // ── 代码审查 ──
  {
    id: 'review-01',
    title: 'AI 代码审查完整工作流',
    category: '代码审查',
    tags: ['code-review', 'quality', 'security', 'automation'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `实现一个 AI 驱动的代码审查工作流，在 PR 提交时自动审查。

## 审查维度

### 1. 代码质量
- 命名规范（变量、函数、文件名）
- 代码复杂度（圈复杂度 > 10 告警）
- 重复代码检测
- 未使用的导入和变量
- 过长的函数（> 50 行）

### 2. 安全审查
- SQL 注入风险
- XSS 风险（dangerouslySetInnerHTML 等）
- 敏感信息泄露（硬编码密钥、token）
- 不安全的依赖
- 认证/授权漏洞

### 3. 性能审查
- N+1 查询
- 不必要的重渲染
- 大包体积（未做 code splitting）
- 缺少缓存

### 4. 架构一致性
- 是否遵循项目既有模式
- 是否引入了不必要的抽象
- 是否违反 SOLID 原则

## 审查 Prompt
\`\`\`
你是代码审查专家。审查以下代码变更：

文件：{filename}
变更：
{diff}

审查标准：
1. 正确性：逻辑是否正确？有没有边界情况遗漏？
2. 安全性：有没有注入、XSS、信息泄露风险？
3. 性能：有没有 N+1、内存泄漏、不必要的计算？
4. 可维护性：命名是否清晰？是否遵循既有模式？
5. 测试：关键逻辑是否有测试覆盖？

输出格式：
🔴 必须修复：[问题列表]
🟡 建议修复：[问题列表]
🟢 可选优化：[问题列表]

每个问题包含：行号、问题描述、修复建议、严重程度。
\`\`\`

## 实现要求
1. GitHub Action 触发审查
2. 获取 PR diff
3. 调用 Claude API 审查
4. 将审查结果作为 PR 评论发布
5. 支持配置审查规则（.ai-review.yml）

请给出完整实现。`,
    description: 'AI 代码审查工作流，质量/安全/性能/架构四维审查',
    difficulty: 'advanced',
  },

  // ── 调试与重构 ──
  {
    id: 'debug-01',
    title: '系统性 Bug 调查与修复工作流',
    category: '调试与重构',
    tags: ['debug', 'investigation', 'root-cause', 'systematic'],
    source: 'Claude Code 最佳实践',
    sourceUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    prompt: `我遇到了一个 Bug，请系统性调查并修复。

## Bug 描述
[在此描述 Bug 症状]

## 调查步骤
1. **复现**：确认 Bug 可以稳定复现，记录复现步骤
2. **定位**：阅读相关代码，追踪数据流，找到出错的代码位置
3. **根因分析**：找到根本原因，而非表面症状
   - 是逻辑错误？数据问题？并发问题？环境问题？
   - 是否有其他地方也受影响？
4. **修复**：修复根因，而非修补症状
   - 修复是否可能影响其他功能？
   - 是否需要数据迁移？
5. **测试**：编写测试确保修复有效，且不会回退
6. **预防**：添加防御性代码或 lint 规则防止同类问题

## 禁止事项
- 不读代码就猜测原因
- 用 try/catch 掩盖错误
- 只修表面症状不修根因
- 不写测试就认为修好了

请按以上步骤逐一执行，每步给出分析结果。`,
    description: '系统性 Bug 调查工作流，从复现到根因分析到预防',
    difficulty: 'intermediate',
  },
  {
    id: 'refactor-01',
    title: '安全增量重构工作流',
    category: '调试与重构',
    tags: ['refactor', 'incremental', 'safe', 'step-by-step'],
    source: '社区精选',
    sourceUrl: '',
    prompt: `对 [代码模块] 进行安全增量重构，改善 [可读性/性能/可维护性]。

## 重构原则
1. **最小改动**：每次只改一个方面
2. **不改行为**：所有现有测试必须仍然通过
3. **可回退**：每步都是独立可部署的
4. **有测试**：重构前先确保有足够的测试覆盖

## 重构步骤

### 第一步：建立安全网
- 为要重构的代码编写/补充测试
- 确认所有测试通过
- 记录当前性能基线

### 第二步：小步重构
每次只做以下一种改动：
- 重命名变量/函数（更清晰的命名）
- 提取函数（降低复杂度）
- 移动代码到更合适的位置
- 简化条件逻辑
- 消除重复代码

每步之后：
- 运行测试确认通过
- 如测试失败，立即回退
- 提交代码

### 第三步：验证
- 所有测试通过
- 性能没有回退
- 代码审查确认改动合理

### 禁止事项
- 重构时添加新功能
- 重命名公共 API 或更改接口
- 一次改多个方面
- 不运行测试就提交

请先分析代码现状，列出重构计划，等我确认后逐步执行。`,
    description: '安全增量重构工作流，最小改动、不改行为、逐步验证',
    difficulty: 'intermediate',
  },
];

export const PROMPT_CATEGORIES = [
  { id: '完整项目', label: '完整项目', icon: '🏗️' },
  { id: '系统设计', label: '系统设计', icon: '🏛️' },
  { id: 'AI 应用', label: 'AI 应用', icon: '🤖' },
  { id: '前端开发', label: '前端开发', icon: '🎨' },
  { id: '后端开发', label: '后端开发', icon: '⚙️' },
  { id: 'DevOps', label: 'DevOps', icon: '🚀' },
  { id: '代码审查', label: '代码审查', icon: '👁️' },
  { id: '调试与重构', label: '调试与重构', icon: '🔧' },
];

export const DIFFICULTY_CONFIG = {
  beginner: { label: '入门', color: 'text-[#34c759]', bg: 'bg-[#34c759]/10' },
  intermediate: { label: '进阶', color: 'text-[#ff9500]', bg: 'bg-[#ff9500]/10' },
  advanced: { label: '高级', color: 'text-[#ff3b30]', bg: 'bg-[#ff3b30]/10' },
};
