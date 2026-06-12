export interface ExtractedSkill {
  skill_name: string;
  category: string;
  importance: string;
}

export interface SkillMatch {
  skill_name: string;
  module_id: string | null;
  module_name: string;
  match_score: number;
}

export interface Gap {
  skill_name: string;
  category: string;
  suggestion: string;
  related_module_id: string | null;
  related_module_name: string | null;
}

export interface ResumeGap {
  skill_name: string;
  detail: string;
  suggestion: string;
}

export interface DimensionScore {
  score: number;
  detail: string;
}

export interface DimensionScores {
  core_skill_match: DimensionScore;
  skill_coverage: DimensionScore;
  responsibility_coverage: DimensionScore;
  years_match: DimensionScore;
  soft_skill_match: DimensionScore;
  industry_match: DimensionScore;
  project_depth: DimensionScore;
}

export interface ResumeMatch {
  match_score: number;
  dimension_scores?: DimensionScores;
  jd_responsibilities?: string[];
  required_years?: number;
  candidate_years?: number;
  strengths: string[];
  resume_gaps: ResumeGap[];
  improvement_suggestions: string[];
  apply_recommendation?: {
    should_apply: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
    key_actions: string[];
  } | null;
}

export interface JdAnalysis {
  id: string;
  jd_text: string;
  company_name: string | null;
  position_name: string;
  extracted_skills: ExtractedSkill[];
  skill_module_matches?: SkillMatch[];
  gaps?: Gap[];
  resume_match?: ResumeMatch | null;
  created_at: string;
}
