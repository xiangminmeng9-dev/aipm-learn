// 资源类型体系定义

export type ResourceType = 'website' | 'paper' | 'blog' | 'lark_doc' | 'wechat' | 'video' | 'book';

export interface ResourceTypeDefinition {
  value: ResourceType;
  label: string;
  icon: string;
  subcategories: { value: string; label: string }[];
}

export const CHART_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#F97316'];

export const TYPE_LABELS: Record<string, string> = {
  website: '网站', paper: '论文', blog: '博客', lark_doc: '飞书文档',
  wechat: '公众号', video: '视频', book: '书籍',
  link: '链接', doc: '文档', folder: '文件夹',
};

export const AI_PM_DIRECTIONS = [
  {
    title: '产品思维',
    icon: '🧠',
    color: 'from-indigo-500 to-purple-500',
    topics: ['需求分析', '用户研究', '产品规划', '数据驱动决策', 'A/B测试设计'],
  },
  {
    title: 'AI 技术基础',
    icon: '🤖',
    color: 'from-emerald-500 to-teal-500',
    topics: ['大模型原理', 'Prompt Engineering', 'RAG 架构', 'Agent 设计', 'Fine-tuning 基础'],
  },
  {
    title: '行业应用',
    icon: '🌐',
    color: 'from-orange-500 to-red-500',
    topics: ['AI 搜索', 'AI 写作', 'AI 绘图', 'AI 编程助手', 'AI 客服'],
  },
  {
    title: '工程实践',
    icon: '⚙️',
    color: 'from-blue-500 to-cyan-500',
    topics: ['API 设计', '模型评估', '成本优化', '安全合规', 'MLOps'],
  },
];

export const RESOURCE_TYPES: ResourceTypeDefinition[] = [
  {
    value: 'website',
    label: '网站',
    icon: '🌐',
    subcategories: [
      { value: 'ai_api', label: 'AI模型与API平台' },
      { value: 'prompt_eng', label: 'Prompt工程工具' },
      { value: 'dev_framework', label: '开发框架文档' },
      { value: 'coding', label: '编程实战' },
      { value: 'pm_toolkit', label: '产品经理工具箱' },
      { value: 'open_source', label: '开源社区' },
      { value: 'ai_nav', label: 'AI导航' },
    ],
  },
  {
    value: 'paper',
    label: '论文',
    icon: '📄',
    subcategories: [
      { value: 'llm', label: 'LLM核心论文' },
      { value: 'rag', label: 'RAG与检索论文' },
      { value: 'agent', label: 'Agent与工具论文' },
      { value: 'evaluation', label: '评估与对齐论文' },
      { value: 'product_ai', label: 'AI产品化论文' },
    ],
  },
  {
    value: 'blog',
    label: '博客',
    icon: '📝',
    subcategories: [
      { value: 'ai_tech', label: 'AI技术深度' },
      { value: 'ai_product', label: 'AI产品思考' },
      { value: 'industry', label: '行业与投资观察' },
      { value: 'pm_practice', label: 'PM实战经验' },
      { value: 'team_eng', label: '团队工程博客' },
    ],
  },
  {
    value: 'lark_doc',
    label: '飞书文档',
    icon: '📋',
    subcategories: [
      { value: 'tech_doc', label: '技术文档' },
      { value: 'product_doc', label: '产品文档' },
      { value: 'notes', label: '学习笔记' },
      { value: 'team_doc', label: '团队文档' },
    ],
  },
  {
    value: 'wechat',
    label: '公众号',
    icon: '📱',
    subcategories: [
      { value: 'tech_account', label: '技术公众号' },
      { value: 'product_account', label: '产品公众号' },
      { value: 'ai_news', label: 'AI资讯' },
    ],
  },
  {
    value: 'video',
    label: '视频',
    icon: '🎬',
    subcategories: [
      { value: 'ai_course', label: 'AI系统课程' },
      { value: 'tech_talk', label: '技术分享与论文解读' },
      { value: 'product_demo', label: 'AI产品拆解与Demo' },
      { value: 'interview_prep', label: '面试准备与实战' },
      { value: 'conference', label: '会议演讲与Keynote' },
    ],
  },
  {
    value: 'book',
    label: '书籍',
    icon: '📚',
    subcategories: [
      { value: 'ai_tech', label: 'AI技术' },
      { value: 'product_method', label: '产品方法论' },
      { value: 'data_analysis', label: '数据分析' },
      { value: 'career', label: '职业发展' },
      { value: 'thinking', label: '思维模型' },
    ],
  },
];

export const RESOURCE_TYPE_MAP = Object.fromEntries(
  RESOURCE_TYPES.map(t => [t.value, t])
) as Record<ResourceType, ResourceTypeDefinition>;

export const SUBCATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  RESOURCE_TYPES.flatMap(t => t.subcategories.map(s => [s.value, s.label]))
);

export function getResourceTypeLabel(type: string): string {
  return RESOURCE_TYPE_MAP[type as ResourceType]?.label ?? type;
}

export function getSubcategoryLabel(type: string, subcategory: string): string {
  const def = RESOURCE_TYPE_MAP[type as ResourceType];
  return def?.subcategories.find(s => s.value === subcategory)?.label ?? subcategory;
}

export function getSubcategoriesForType(type: string) {
  return RESOURCE_TYPE_MAP[type as ResourceType]?.subcategories ?? [];
}

export function getResourceTypeIcon(type: string): string {
  return RESOURCE_TYPE_MAP[type as ResourceType]?.icon ?? '📌';
}

// 现有资源预设数据 — 按新分类体系整理
export const PRESET_RESOURCES = [
  // === 网站 - AI模型与API平台 ===
  { name: 'OpenAI API Docs', url: 'https://platform.openai.com/docs', description: 'GPT系列模型API官方文档', resource_type: 'website' as ResourceType, subcategory: 'ai_api' },
  { name: 'Anthropic Docs', url: 'https://docs.anthropic.com', description: 'Claude系列模型API官方文档', resource_type: 'website' as ResourceType, subcategory: 'ai_api' },
  { name: 'Google AI Studio', url: 'https://aistudio.google.com', description: 'Gemini模型API与实验平台', resource_type: 'website' as ResourceType, subcategory: 'ai_api' },
  // === 网站 - Prompt工程工具 ===
  { name: 'ChatGPT Shortcut', url: 'https://newzone.top/chatgpt/', description: 'ChatGPT提示词快捷指令', resource_type: 'website' as ResourceType, subcategory: 'prompt_eng' },
  // === 网站 - 编程实战 ===
  { name: 'LeetCode', url: 'https://leetcode.cn', description: '算法与数据结构刷题平台', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  { name: '牛客网', url: 'https://www.nowcoder.com', description: 'IT求职笔试面试刷题平台', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  { name: 'Kaggle', url: 'https://www.kaggle.com', description: '数据科学竞赛与数据集平台', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  { name: 'Google Colab', url: 'https://colab.research.google.com', description: '免费GPU在线Python编程环境', resource_type: 'website' as ResourceType, subcategory: 'coding' },
  // === 网站 - 开发框架文档 ===
  { name: 'LangChain Docs', url: 'https://python.langchain.com/docs/', description: 'LangChain框架官方文档', resource_type: 'website' as ResourceType, subcategory: 'dev_framework' },
  { name: 'LangGraph Docs', url: 'https://langchain-ai.github.io/langgraph/', description: 'LangGraph状态图框架文档', resource_type: 'website' as ResourceType, subcategory: 'dev_framework' },
  { name: 'MCP Specification', url: 'https://spec.modelcontextprotocol.io', description: 'Model Context Protocol协议规范', resource_type: 'website' as ResourceType, subcategory: 'dev_framework' },
  // === 网站 - 产品经理工具箱 ===
  { name: 'Coursera', url: 'https://www.coursera.org', description: '全球顶级在线课程平台', resource_type: 'website' as ResourceType, subcategory: 'pm_toolkit' },
  { name: '吴恩达AI课程', url: 'https://www.deeplearning.ai', description: 'Andrew Ng深度学习系列课程', resource_type: 'website' as ResourceType, subcategory: 'pm_toolkit' },
  { name: 'DeepLearning.AI Short Courses', url: 'https://www.deeplearning.ai/short-courses/', description: 'AI领域免费短课程集合', resource_type: 'website' as ResourceType, subcategory: 'pm_toolkit' },
  // === 网站 - 开源社区 ===
  { name: 'GitHub', url: 'https://github.com', description: '全球最大代码托管与开源社区', resource_type: 'website' as ResourceType, subcategory: 'open_source' },
  { name: 'Hugging Face', url: 'https://huggingface.co', description: '模型仓库与NLP工具平台', resource_type: 'website' as ResourceType, subcategory: 'open_source' },
  // === 网站 - AI导航 ===
  { name: 'AI工具集', url: 'https://ai-bot.cn', description: 'AI工具与资源导航', resource_type: 'website' as ResourceType, subcategory: 'ai_nav' },
  { name: 'WaytoAGI', url: 'https://www.waytoagi.com', description: 'AI知识库与社区导航', resource_type: 'website' as ResourceType, subcategory: 'ai_nav' },
  // === 论文 ===
  { name: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762', description: 'Transformer架构奠基论文', resource_type: 'paper' as ResourceType, subcategory: 'llm', author: 'Vaswani et al.', year: 2017 },
  { name: 'Retrieval-Augmented Generation', url: 'https://arxiv.org/abs/2005.11401', description: 'RAG架构原始论文', resource_type: 'paper' as ResourceType, subcategory: 'rag', author: 'Lewis et al.', year: 2020 },
  { name: 'ReAct: Synergizing Reasoning and Acting', url: 'https://arxiv.org/abs/2210.03629', description: 'ReAct Agent范式论文', resource_type: 'paper' as ResourceType, subcategory: 'agent', author: 'Yao et al.', year: 2022 },
  { name: 'Training language models to follow instructions', url: 'https://arxiv.org/abs/2203.02155', description: 'InstructGPT/RLHF对齐论文', resource_type: 'paper' as ResourceType, subcategory: 'evaluation', author: 'Ouyang et al.', year: 2022 },
  // === 博客 ===
  { name: 'Lilian Weng Blog', url: 'https://lilianweng.github.io/', description: 'OpenAI研究员Lilian Weng技术博客', resource_type: 'blog' as ResourceType, subcategory: 'ai_tech' },
  { name: 'Jay Alammar Blog', url: 'https://jalammar.github.io/', description: 'Transformer/LLM可视化解读', resource_type: 'blog' as ResourceType, subcategory: 'ai_tech' },
  { name: 'Latent Cat', url: 'https://latent.cat', description: 'AI产品经理深度内容', resource_type: 'blog' as ResourceType, subcategory: 'ai_product' },
  // === 视频 ===
  { name: '3Blue1Brown 神经网络', url: 'https://www.bilibili.com/video/BV1bx411M7Zx', description: '最直观的神经网络可视化讲解', resource_type: 'video' as ResourceType, subcategory: 'ai_course', platform: 'B站' },
  { name: '李沐动手学深度学习', url: 'https://www.bilibili.com/video/BV1kq4y1H7FL', description: 'Amazon首席科学家深度学习课程', resource_type: 'video' as ResourceType, subcategory: 'ai_course', platform: 'B站' },
  // === 书籍 ===
  { name: '《人工智能：现代方法》', url: '', description: 'AI领域经典教材(Stuart Russell)', resource_type: 'book' as ResourceType, subcategory: 'ai_tech', author: 'Stuart Russell, Peter Norvig' },
  { name: '《深度学习》', url: '', description: '花书-Ian Goodfellow深度学习圣经', resource_type: 'book' as ResourceType, subcategory: 'ai_tech', author: 'Ian Goodfellow' },
  { name: '《启示录》', url: '', description: '产品经理必读经典-Marty Cagan', resource_type: 'book' as ResourceType, subcategory: 'product_method', author: 'Marty Cagan' },
  { name: '《精益数据分析》', url: '', description: '数据驱动产品决策方法论', resource_type: 'book' as ResourceType, subcategory: 'data_analysis', author: 'Alistair Croll' },
  { name: '《金字塔原理》', url: '', description: '结构化思维与表达方法论', resource_type: 'book' as ResourceType, subcategory: 'thinking', author: 'Barbara Minto' },
];

// --- 文件夹辅助函数 ---
import type { ExternalResource } from '@/types';

export interface FolderNode {
  id: string;
  title: string;
  parent_id: string | null;
  children: FolderNode[];
  itemCount: number;
}

export function buildFolderTree(resources: ExternalResource[], resourceType: string): FolderNode[] {
  const folders = resources.filter(r => r.type === 'folder' && (r.resource_type || 'website') === resourceType);
  const nonFolderResources = resources.filter(r => r.type !== 'folder' && (r.resource_type || 'website') === resourceType);

  const nodeMap = new Map<string, FolderNode>();
  for (const f of folders) {
    nodeMap.set(f.id, { id: f.id, title: f.title, parent_id: f.parent_id, children: [], itemCount: 0 });
  }

  for (const r of nonFolderResources) {
    if (r.parent_id && nodeMap.has(r.parent_id)) {
      nodeMap.get(r.parent_id)!.itemCount++;
    }
  }
  for (const f of folders) {
    if (f.parent_id && nodeMap.has(f.parent_id)) {
      nodeMap.get(f.parent_id)!.itemCount++;
    }
  }

  const roots: FolderNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title));
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(roots);

  return roots;
}

export function getFolderPath(resources: ExternalResource[], folderId: string): { id: string; title: string }[] {
  const path: { id: string; title: string }[] = [];
  let current = resources.find(r => r.id === folderId);
  while (current) {
    path.unshift({ id: current.id, title: current.title });
    current = current.parent_id ? resources.find(r => r.id === current!.parent_id) : undefined;
  }
  return path;
}

export function getFoldersForType(resources: ExternalResource[], resourceType: string): ExternalResource[] {
  return resources.filter(r => r.type === 'folder' && (r.resource_type || 'website') === resourceType);
}

export function getDirectChildrenCount(resources: ExternalResource[], folderId: string): number {
  return resources.filter(r => r.parent_id === folderId).length;
}
