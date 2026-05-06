import { z } from 'zod';

// ── Auth ──
export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 个字符'),
});

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少 6 个字符'),
});

// ── Chat ──
export const createSessionSchema = z.object({
  title: z.string().max(100).optional(),
  jd_text: z.string().max(10000).optional(),
  resume_text: z.string().max(10000).optional(),
});

export const chatMessageSchema = z.object({
  message: z.string().min(1, '消息不能为空').max(10000),
});

// ── Interview ──
export const analyzeSchema = z.object({
  question: z.string().min(1, '请输入问题').max(2000),
  session_id: z.string().uuid().optional(),
});

export const createMockSchema = z.object({
  type_id: z.string().uuid('请选择面试类型'),
  total_questions: z.union([z.literal(3), z.literal(5), z.literal(8), z.literal(10)]),
  jd_text: z.string().max(10000).optional(),
  resume_text: z.string().max(10000).optional(),
});

export const submitAnswerSchema = z.object({
  answer: z.string().max(10000).optional(),
  skip: z.boolean().optional(),
});

export const competitiveAnalysisSchema = z.object({
  product_name: z.string().min(1, '请输入产品名称').max(100),
});

// ── Skills ──
export const aiLearningPathSchema = z.object({
  force_regenerate: z.boolean().optional(),
});

// ── Coding ──
export const specPracticeSchema = z.object({
  question: z.string().min(1, '请输入问题').max(2000),
  user_spec: z.string().min(1, '请输入 Spec').max(20000),
  question_category: z.string().max(50).optional(),
});

// ── Settings ──
export const aiConfigSchema = z.object({
  protocol: z.enum(['anthropic', 'openai']),
  base_url: z.string().max(500).optional(),
  api_key: z.string().min(1, '请输入 API Key').max(500),
  model: z.string().min(1, '请输入模型名称').max(100),
});

// ── Daily Challenge ──
export const dailyChallengeSubmitSchema = z.object({
  answer: z.string().min(1, '请输入答案').max(10000),
  question_id: z.string().uuid().optional(),
});

// ── Resume ──
export const resumeParseSchema = z.object({
  text: z.string().min(1, '请输入简历内容').max(50000).optional(),
});

// ── Helper ──
export function validateBody<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues.map((i) => i.message).join('; ') };
}
