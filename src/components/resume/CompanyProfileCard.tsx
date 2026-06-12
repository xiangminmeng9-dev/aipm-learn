'use client';

import { AnimatePresence, MotionDiv } from '@/components/ui/lazy-motion';

interface CompanyPreference {
  persona: string;
  core_skills: Array<{ name: string; count: number }>;
  soft_skills: string[];
  not_care: string;
  suggestion: string;
  strengthen: string;
}

interface CompanyProfileCardProps {
  companyName: string;
  companyType: string | null;
  companyPreference: CompanyPreference | null;
  isLoading: boolean;
  error: string | null;
  fixedPersona?: string | null;
  preferenceSource?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  big_company: '大厂',
  foreign: '外企',
  state_owned: '国企',
  startup: '创业公司',
  traditional: '传统行业',
  other: '其他',
};

const TYPE_COLORS: Record<string, string> = {
  big_company: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  foreign: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  state_owned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  startup: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  traditional: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  other: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  fixed: { label: '官方画像', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  jd_analyses: { label: 'JD分析', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  web_research: { label: '官网推断', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
  generic: { label: '类型推断', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export type { CompanyPreference };

export default function CompanyProfileCard({
  companyName,
  companyType,
  companyPreference,
  isLoading,
  error,
  fixedPersona,
  preferenceSource,
}: CompanyProfileCardProps) {
  if (!companyName || companyName.trim().length < 2) return null;

  return (
    <AnimatePresence mode="wait">
      <MotionDiv
        key={companyName}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl border border-violet-200 bg-violet-50/30 p-4 dark:border-violet-800 dark:bg-violet-950/20"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-base">🏢</span>
          <h3 className="text-sm font-semibold text-foreground">
            {companyName} 招聘画像
          </h3>
          {companyType && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[companyType] || TYPE_COLORS.other}`}>
              {TYPE_LABELS[companyType] || companyType}
            </span>
          )}
          {preferenceSource && SOURCE_LABELS[preferenceSource] && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_LABELS[preferenceSource].color}`}>
              {SOURCE_LABELS[preferenceSource].label}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="flex gap-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-6 w-16 animate-pulse rounded-full bg-muted" />
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            未找到该公司的历史分析数据，将基于公司类型生成通用建议
          </p>
        )}

        {!isLoading && companyPreference && (
          <div className="space-y-3">
            {/* Persona */}
            {companyPreference.persona && (
              <div className="text-sm text-foreground">
                <span className="font-medium text-violet-700 dark:text-violet-400">画像：</span>
                {fixedPersona ? (
                  <>
                    <span className="font-semibold">{fixedPersona}</span>
                    {(() => {
                      const jdPart = companyPreference.persona.replace(fixedPersona + '\n\n', '').trim();
                      return jdPart ? (
                        <span className="mt-1 block text-muted-foreground">从JD分析来看，{jdPart}</span>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <span>{companyPreference.persona}</span>
                )}
              </div>
            )}

            {/* Core skills */}
            {companyPreference.core_skills?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">核心技能</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {companyPreference.core_skills.slice(0, 5).map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    >
                      {s.name}{s.count > 1 ? ` (${s.count})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Soft skills */}
            {companyPreference.soft_skills?.length > 0 && (
              <div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">软技能</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {companyPreference.soft_skills.map((s, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Not care */}
            {companyPreference.not_care && (
              <p className="text-xs italic text-muted-foreground">
                不太看重：{companyPreference.not_care}
              </p>
            )}

            {/* Suggestion */}
            {companyPreference.suggestion && (
              <p className="text-xs text-foreground">
                <span className="font-medium text-violet-600 dark:text-violet-400">建议：</span>
                {companyPreference.suggestion}
              </p>
            )}
          </div>
        )}

        {!isLoading && !error && !companyPreference && companyType && (
          <p className="text-xs text-muted-foreground">
            暂无该公司的详细画像数据，将基于公司类型（{TYPE_LABELS[companyType] || companyType}）生成通用建议
          </p>
        )}
      </MotionDiv>
    </AnimatePresence>
  );
}
