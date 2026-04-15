'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MethodologyCardProps {
  type: { id: string; name: string };
  framework: string;
  keySteps: string[];
  typicalCases: string[];
  sourceCount: number;
  updatedAt: string;
  isExpanded: boolean;
  onToggle: () => void;
  highFrequencyQuestions?: { id: string; text: string }[];
}

export default function MethodologyCard({
  type,
  framework,
  keySteps,
  typicalCases,
  sourceCount,
  updatedAt,
  isExpanded,
  onToggle,
  highFrequencyQuestions,
}: MethodologyCardProps) {
  return (
    <Card className="border-neutral-700 bg-neutral-800/50">
      <CardHeader className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base text-neutral-200">{type.name}</CardTitle>
            <Badge variant="secondary" className="bg-amber-600/20 text-amber-400 text-xs">
              {sourceCount} 次练习
            </Badge>
          </div>
          <span className="text-xs text-neutral-500">
            {new Date(updatedAt).toLocaleDateString('zh-CN')}
          </span>
        </div>
        {!isExpanded && <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{framework}</p>}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-0">
          {/* 核心框架 */}
          <div>
            <h4 className="mb-1 text-xs font-medium text-neutral-500">核心框架</h4>
            <p className="whitespace-pre-wrap text-sm text-neutral-300">{framework}</p>
          </div>

          {/* 关键步骤 */}
          {keySteps.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-neutral-500">关键步骤</h4>
              <ol className="space-y-1">
                {keySteps.map((step, i) => (
                  <li key={i} className="flex gap-2 text-sm text-neutral-300">
                    <span className="shrink-0 text-amber-400">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 典型案例 */}
          {typicalCases.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-neutral-500">典型案例</h4>
              <div className="space-y-1">
                {typicalCases.map((c, i) => (
                  <p key={i} className="text-sm text-neutral-300">
                    • {c}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 高频问题 */}
          {highFrequencyQuestions && highFrequencyQuestions.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-medium text-neutral-500">高频问题</h4>
              <div className="space-y-1">
                {highFrequencyQuestions.map((q) => (
                  <p key={q.id} className="text-sm text-neutral-400">
                    • {q.text}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
