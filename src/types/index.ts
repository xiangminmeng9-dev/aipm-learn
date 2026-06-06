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
  related_modules?: { id: string; name: string }[];
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

// --- Resources Stats ---
export interface ResourcesStatsResponse {
  total_resources: number;
  total_rss_articles: number;
  total_daily_news: number;
  total_rss_sources: number;
  type_distribution: { type: string; count: number }[];
  source_distribution: { source: string; count: number }[];
  daily_activity: { date: string; count: number }[];
  growth_timeline: { date: string; count: number }[];
  folder_treemap: { name: string; value: number; children?: { name: string; value: number }[] }[];
  rss_category_distribution: { category: string; count: number }[];
  rss_read_stats: { total: number; read: number; translated: number };
  daily_news_recent: { date: string; article_count: number }[];
}

// --- External Resource ---
export type ResourceCategoryType = 'website' | 'paper' | 'blog' | 'lark_doc' | 'wechat' | 'video' | 'book' | 'workflow';
export type ExternalResourceType = 'link' | 'video' | 'doc' | 'folder' | 'blog' | 'paper' | 'book' | 'wechat' | 'lark_doc';

export interface ExternalResource {
  id: string;
  parent_id: string | null;
  title: string;
  url: string;
  type: ExternalResourceType;
  resource_type: ResourceCategoryType | null;
  subcategory: string | null;
  thumbnail_url: string | null;
  local_path: string | null;
  author: string | null;
  year: number | null;
  platform: string | null;
  duration: string | null;
  source: string;
  notes: string | null;
  related_module_id: string | null;
  related_module_name: string | null;
  sort_order: number;
  description: string | null;
  created_at: string;
}

// --- Skill Module ---
export type UserResourceType = 'article' | 'video' | 'book' | 'note';
export type UserTaskType = string;

export interface SkillModule {
  id: string;
  slug?: string;
  name: string;
  description: string;
  level: number;
  icon: string;
  is_seed: boolean;
  level_name: string;
  prerequisites: string[];
  created_at: string;
}

export interface LearningTask {
  id: string;
  module_id: string;
  title: string;
  description: string;
  objective?: string;
  task_type: string;
  sort_order: number;
  is_seed: boolean;
  created_at: string;
}

export interface LearningTaskWithProgress extends LearningTask {
  is_completed: boolean;
  completed_at: string | null;
  status: string;
  estimated_days?: number;
  content_summary?: string;
  resources?: LearningResource[];
  user_resources?: UserTaskResource[];
}

export interface SkillModuleWithProgress extends SkillModule {
  tasks: LearningTaskWithProgress[];
  completion_rate: number;
  progress_percentage: number;
  total_tasks?: number;
  completed_tasks?: number;
  task_count: number;
  completed_count: number;
  resource_count?: number;
  interview_weak_types?: string[];
  interview_methodology_count?: number;
  is_unlocked: boolean;
}

export interface LearningResource {
  id: string;
  title: string;
  url: string;
  type: string;
  source?: string;
  created_at: string;
}

export interface UserTaskResource {
  id: string;
  task_id: string;
  title: string;
  url: string;
  type: string;
  source?: string;
  notes?: string;
  created_at: string;
}

export interface ExtractedSkill {
  skill: string;
  skill_name: string;
  category: string;
  frequency: number;
  importance: string;
}

export interface SkillModuleMatch {
  skill: string;
  module_id: string;
  module_name: string;
  match_score: number;
}

export interface SkillGap {
  skill: string;
  skill_name: string;
  reason: string;
  suggestion: string;
}

// --- Daily AI News ---
export interface DailyAiNewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  published_at: string | null;
  summary?: string | null;
  news_date: string;
  fetched_at: string;
}

export interface DailyAiNewsDigest {
  id: string;
  news_date: string;
  digest: string;
  article_count: number;
  generated_at: string | null;
}

// --- Coding Methodology ---
export interface DevMode {
  id: string;
  name: string;
  description: string;
  created_at?: string;
}

export interface CodingMethodology {
  id: string;
  user_id: string;
  mode_id: string;
  high_freq_questions: string[];
  common_breakdowns: string[];
  cross_mode_steps: string[];
  key_notes: string[];
  source_count: number;
  created_at: string;
  updated_at: string;
}

// --- Spec Practice ---
export interface DimensionScore {
  dimension: string;
  score: number;
  comment: string;
}

export interface SpecSuggestion {
  original_text: string;
  improvement: string;
  suggestion: string;
}

export interface SpecPractice {
  id: string;
  user_id: string;
  question: string;
  question_category: string;
  user_spec: string;
  total_score: number;
  dimension_scores: DimensionScore[];
  suggestions: SpecSuggestion[];
  created_at: string;
}

// --- RSS Article Collection ---
export type RssSourceCategory = 'ai_tech' | 'ai_pm';
export type RssSourceLanguage = 'en' | 'zh';

export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: RssSourceCategory;
  language: RssSourceLanguage;
  is_active: boolean;
  last_fetched_at: string | null;
  created_at: string;
}

export interface RssArticle {
  id: string;
  source_id: string;
  source?: RssSource;
  title: string;
  original_url: string;
  author: string | null;
  published_at: string | null;
  content_raw: string | null;
  content_summary: string | null;
  plain_explanation: string | null;
  category: RssSourceCategory;
  tags: string[];
  is_read: boolean;
  is_translated: boolean;
  fetched_at: string;
  created_at: string;
}

export interface PlainTranslation {
  summary: string;
  explanation: string;
  impact: string;
  tags: string[];
}

// --- Competitive Analysis ---
export interface CompetitiveAnalysis {
  id: string;
  user_id: string;
  product_name: string;
  market_position: string;
  feature_comparison: string;
  strengths_weaknesses: string;
  differentiation_strategy: string;
  total_score: number;
  dimension_scores: DimensionScore[];
  created_at: string;
}

// --- AI PM Simulator ---
export interface SimulatorSession {
  id: string;
  user_id: string;
  current_stage_id: string;
  stage_scores: Record<string, { score: number; feedback: string; completed_at: string }>;
  status: 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface SimulatorMessage {
  id: string;
  session_id: string;
  stage_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

// --- User Question Bookmark ---
export interface UserQuestionBookmark {
  id: string;
  user_id: string;
  question_id: string;
  mastery_level: 'mastered' | 'learning' | 'review';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookmarkWithQuestion extends UserQuestionBookmark {
  question_text: string;
  type_name: string | null;
  type_id: string | null;
}

// --- Community Question ---
export interface CommunityQuestion {
  id: string;
  text: string;
  type_id: string | null;
  user_id: string;
  status: 'active' | 'removed';
  created_at: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 1 | -1 | null;
  type_name?: string | null;
}

// --- Interview Tip ---
export interface InterviewTip {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// --- Learning Reminder ---
export interface LearningReminder {
  id: string;
  user_id: string;
  reminder_time: string;
  enabled_days: number[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// --- AI Learning Path (Weakness-based) ---
export interface RecommendedModule {
  name: string;
  priority: 'high' | 'medium' | 'low';
  estimatedHours: number;
  reason: string;
}

export interface AiLearningPath {
  id: string;
  user_id: string;
  weakness_summary: string;
  recommended_modules: RecommendedModule[];
  total_estimated_hours: number;
  created_at: string;
}

// ============================================================
// Resume Application Tracker
// ============================================================

export interface ResumeRepositoryItem {
  id: string;
  user_id: string;
  company_name: string;
  position_name: string;
  jd_text: string;
  jd_link: string | null;
  file_name: string | null;
  file_url: string | null;
  resume_text: string;
  resume_version_id: string | null;
  company_type: CompanyType;
  company_preference: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationChannel = 'BOSS' | '猎头' | '官网' | '内推' | '脉脉' | '其他';
export type ApplicationStatus =
  | '已投递'
  | '简历筛选'
  | '初面'
  | '二面'
  | '终面'
  | '已发offer'
  | '已接受'
  | '已拒绝';

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  date: string;
  note?: string;
}

export type CompanyType = 'big_company' | 'foreign' | 'state_owned' | 'startup' | 'traditional' | 'other';

export interface ResumeApplication {
  id: string;
  user_id: string;
  company_name: string;
  position_name: string;
  channel: ApplicationChannel;
  status: ApplicationStatus;
  applied_at: string;
  notes: string | null;
  city: string | null;
  position_category: string | null;
  resume_version_id: string | null;
  status_history: StatusHistoryEntry[];
  company_type: CompanyType;
  company_preference: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_applications: number;
  interview_count: number;
  interview_pass_rate: number;
  offers_received: number;
  offer_acceptance_rate: number;
  rejection_count: number;
  rejection_reasons: { reason: string; count: number }[];
  channel_distribution: { channel: string; count: number; percentage: number }[];
  status_distribution: { status: string; count: number }[];
  application_trend: { date: string; count: number; interviews: number; offers: number; accepted: number }[];
  status_timeline: { date: string; status: string; count: number }[];
  city_distribution: { city: string; count: number }[];
  position_category_conversion: { category: string; total: number; interviews: number; offers: number }[];
  funnel_stages: { stage: string; count: number }[];
  recent_reviews: {
    id: string;
    company_name: string;
    position_name: string;
    status: ApplicationStatus;
    notes: string | null;
    updated_at: string;
  }[];
  // 环比变化
  total_applications_change?: number;
  interview_count_change?: number;
  interview_pass_rate_change?: number;
  offers_received_change?: number;
  offer_acceptance_rate_change?: number;
  rejection_count_change?: number;
  // 简历修改数据
  total_resume_modifications?: number;
  resume_modification_trend?: { date: string; count: number }[];
  resume_version_history?: {
    id: string;
    company_name: string | null;
    position_name: string | null;
    style_type: string;
    changes_summary: string | null;
    created_at: string;
    version_number: number;
  }[];
}

export interface ApplicationCalendarDay {
  date: string;
  applications_count: number;
  interviews: { company_name: string; position_name: string; status: ApplicationStatus }[];
  has_note: boolean;
}

