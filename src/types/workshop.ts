// ── Skill Workshop centralized type definitions ──────────────────────
// Single source of truth for all workshop-related types.
// Components should import from '@/types/workshop' instead of defining inline types.

// ── Validation constants (shared between client & server) ────────────

export const NAME_REGEX = /^[a-z0-9][a-z0-9-]*$/;
export const NAME_MAX_LENGTH = 64;
export const DESCRIPTION_MAX_LENGTH = 1024;

// ── Platform types ───────────────────────────────────────────────────

export type Platform = 'clawhub' | 'skillssh';
export type PlatformTab = 'all' | 'clawhub' | 'skillssh';
export type ViewTab = 'hot' | 'trending' | 'newest';
export type EditorMode = 'guided' | 'raw';
export type InputTab = 'paste' | 'browse';
export type DraftStatus = 'draft' | 'published';
export type ValidationStatus = 'unknown' | 'valid' | 'invalid';
export type SkillTemplateKey = 'basic' | 'agent' | 'workflow' | 'pm-specialist';
export type EffortLevel = 'low' | 'medium' | 'high';

// ── ClawHub sort values (maps ViewTab to API sort param) ─────────────

export type ClawHubSortValue =
  | 'updated'
  | 'recommended'
  | 'installsCurrent'
  | 'installsAllTime'
  | 'trending'
  | 'createdAt';

export const VIEW_TAB_TO_CLAWHUB_SORT: Record<ViewTab, ClawHubSortValue> = {
  hot: 'installsAllTime',
  trending: 'trending',
  newest: 'createdAt',
} as const;

// ── Unified skill model (used across browse, detail, card) ──────────

export interface UnifiedSkill {
  id: string;
  name: string;
  description: string;
  author: string;
  installs: number;
  platform: Platform;
  url: string;
  slug: string;
  tags?: string[];
  updatedAt?: string;
  // AI-translated Chinese fields (populated server-side)
  nameZh?: string;
  descriptionZh?: string;
}

// ── Platform page state (used by BrowseView) ────────────────────────

export interface PlatformPage {
  skills: UnifiedSkill[];
  total: number;
  cursor: string | null; // cursor for next page (null = no more pages)
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

// ── Frontmatter types ────────────────────────────────────────────────

export interface FrontmatterData {
  name: string;
  description: string;
  metadata?: {
    author?: string;
    version?: string;
    category?: string;
    role?: string;
  };
  'allowed-tools'?: string;
  effort?: EffortLevel;
}

// ── Analysis types ───────────────────────────────────────────────────

export interface StructureAnalysis {
  has_frontmatter: boolean;
  required_fields_present: string[];
  missing_fields: string[];
  optional_fields_used: string[];
  frontmatter_quality: number;
}

export interface QualityScore {
  score: number;
  comment: string;
}

export interface QualityScores {
  clarity: QualityScore;
  completeness: QualityScore;
  practicality: QualityScore;
  robustness: QualityScore;
  innovation: QualityScore;
}

export interface UseCase {
  scenario: string;
  example: string;
}

export interface Improvement {
  aspect: string;
  current: string;
  suggestion: string;
}

export interface AnalysisResultData {
  overall_quality: number;
  structure_analysis: StructureAnalysis;
  quality_scores: QualityScores;
  use_cases: UseCase[];
  improvements: Improvement[];
  summary: string;
}

export interface HistoryItem {
  id: string;
  skill_name: string | null;
  skill_slug: string | null;
  skill_source: string | null;
  overall_quality: number;
  created_at: string;
}

// ── Improvement result (from one-click improve) ─────────────────────

export interface ImprovementChange {
  field: string;
  before: string;
  after: string;
  reason: string;
}

export interface ImproveResult {
  improved_content: string;
  changes: ImprovementChange[];
  analysis_id: string;
}

// ── Draft types ──────────────────────────────────────────────────────

export interface Draft {
  id: string;
  name: string;
  description: string | null;
  content: string;
  status: DraftStatus;
  template_type: SkillTemplateKey;
  validation_status: ValidationStatus;
  validation_errors: string[] | null;
  clawhub_slug: string | null;
  clawhub_url: string | null;
  skillssh_slug: string | null;
  skillssh_url: string | null;
  created_at: string;
  updated_at: string;
}

// ── Token types ──────────────────────────────────────────────────────

export interface TokenInfo {
  id: string;
  provider: Platform;
  token_masked: string;
  created_at: string;
}

// ── Validation types ─────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ── AI write-assist result ───────────────────────────────────────────

export interface WriteAssistResult {
  skill_content: string;
  explanation: string;
  tips: string[];
}

// ── Publish result ───────────────────────────────────────────────────

export interface PublishResult {
  success: boolean;
  platform?: Platform;
  url?: string;
  slug?: string;
  version?: string;
  error?: string;
  mode?: string;
  cli_command?: string;
  instructions?: string[];
  content?: string;
}

// ── Platform config (for UI display) ────────────────────────────────

export const PLATFORM_CONFIG = {
  clawhub: {
    label: 'ClawHub',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  skillssh: {
    label: 'skills.sh',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
} as const;

// ── Tab definitions ──────────────────────────────────────────────────

export const PLATFORM_TABS: { value: PlatformTab; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'clawhub', label: 'ClawHub' },
  { value: 'skillssh', label: 'skills.sh' },
];

export const VIEW_TABS: { value: ViewTab; label: string }[] = [
  { value: 'hot', label: '热门' },
  { value: 'trending', label: '趋势' },
  { value: 'newest', label: '最新' },
];
