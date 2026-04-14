// ============================================================
// Global Type Definitions — AI PM Interview Assistant
// ============================================================

// --- User ---
export interface User {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string | null;
}

// --- Question Type (dynamic, not fixed) ---
export interface QuestionType {
  id: string;
  name: string;
  description: string | null;
  is_seed: boolean;
  created_by: string | null;
  created_at: string;
}

// --- Chat Session ---
export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  jd_text: string | null;
  resume_text: string | null;
  compressed_summary: string | null;
  total_tokens: number;
  is_compressed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionListItem {
  id: string;
  title: string;
  has_jd: boolean;
  has_resume: boolean;
  message_count: number;
  updated_at: string;
}

// --- Chat Message ---
export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  session_id: string;
  role: MessageRole;
  content: string;
  is_compressed: boolean;
  token_count: number;
  created_at: string;
}

// --- Interview Question ---
export type QuestionSource = 'user_input' | 'trending' | 'mock_generated';

export interface InterviewQuestion {
  id: string;
  text: string;
  type_id: string | null;
  source: QuestionSource;
  user_id: string | null;
  created_at: string;
}

// --- Question Analysis ---
export interface QuestionAnalysis {
  id: string;
  question_id: string;
  user_id: string;
  analysis: string;
  thinking_framework: string;
  answer_approach: string;
  answer_template: string;
  created_at: string;
}

export interface AnalysisResult {
  question_id: string;
  type: { id: string; name: string; is_new: boolean };
  analysis: string;
  thinking_framework: string;
  answer_approach: string;
  answer_template: string;
}

// --- Mock Interview ---
export type MockInterviewStatus = 'in_progress' | 'completed' | 'abandoned';

export interface MockInterview {
  id: string;
  user_id: string;
  type_id: string;
  total_questions: number;
  current_question: number;
  jd_text: string | null;
  resume_text: string | null;
  status: MockInterviewStatus;
  total_score: number | null;
  summary_strengths: string | null;
  summary_weaknesses: string | null;
  summary_suggestions: string | null;
  weak_skill_modules: WeakSkillModule[] | null;
  created_at: string;
  completed_at: string | null;
}

export interface WeakSkillModule {
  module_id: string;
  module_name: string;
  recommended_tasks: { task_id: string; task_name: string }[];
}

// --- Interview Answer ---
export interface InterviewAnswer {
  id: string;
  mock_interview_id: string;
  question_number: number;
  question_text: string;
  question_type_id: string | null;
  user_answer: string | null;
  score: number | null;
  gap_analysis: string | null;
  perfect_answer: string | null;
  is_skipped: boolean;
  created_at: string;
  answered_at: string | null;
}

export interface AnswerEvaluationResult {
  score: number;
  gap_analysis: string;
  perfect_answer: string;
}

// --- Interview Methodology ---
export interface InterviewMethodology {
  id: string;
  user_id: string;
  type_id: string;
  framework: string;
  key_steps: string[];
  typical_cases: string[];
  source_count: number;
  created_at: string;
  updated_at: string;
}

export interface MethodologyWithType extends InterviewMethodology {
  type: QuestionType;
}

// --- Trending Question ---
export interface TrendingQuestion {
  id: string;
  text: string;
  type_id: string | null;
  rank: number;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrendingQuestionWithType extends TrendingQuestion {
  type: QuestionType | null;
}

// --- Type Skill Mapping ---
export interface TypeSkillMapping {
  id: string;
  type_id: string;
  skill_module_id: string;
  recommended_tasks: string[];
  created_at: string;
}

// --- Stats ---
export interface TypeDistribution {
  type_name: string;
  count: number;
  percentage: number;
}

export interface ScoreTrend {
  date: string;
  score: number;
}

export interface WeakArea {
  type_name: string;
  average_score: number;
  recommended_questions: { id: string; text: string }[];
}

export interface UserStats {
  total_questions: number;
  type_distribution: TypeDistribution[];
  mock_interviews: {
    total: number;
    average_score: number;
    score_trend: ScoreTrend[];
  };
  weak_areas: WeakArea[];
}

// --- API Request/Response types ---
export interface AnalyzeRequest {
  question: string;
  session_id?: string;
}

export interface CreateSessionRequest {
  title?: string;
  jd_text?: string;
  resume_text?: string;
}

export interface UpdateSessionRequest {
  title?: string;
  jd_text?: string;
  resume_text?: string;
}

export interface ChatRequest {
  message: string;
}

export interface CreateMockRequest {
  type_id: string;
  total_questions: 3 | 5 | 8 | 10;
  jd_text?: string;
  resume_text?: string;
}

export interface SubmitAnswerRequest {
  answer?: string;
  skip?: boolean;
}

export interface ApiError {
  error: string;
  code?: string;
}
