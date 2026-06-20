'use client';

import { cn } from '@/lib/utils';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { type ValidationResult } from '@/types/workshop';

interface ValidationReportProps extends ValidationResult {
  className?: string;
}

export default function ValidationReport({
  errors,
  warnings,
  valid,
  className,
}: ValidationReportProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30',
          className
        )}
      >
        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span className="text-sm text-emerald-700 dark:text-emerald-400">
          SKILL.md 格式验证通过
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Errors */}
      {errors.map((error, i) => (
        <div
          key={`error-${i}`}
          className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/30"
        >
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
        </div>
      ))}

      {/* Warnings */}
      {warnings.map((warning, i) => (
        <div
          key={`warning-${i}`}
          className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-700 dark:text-amber-400">{warning}</span>
        </div>
      ))}

      {/* Valid items summary */}
      {valid && errors.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm text-emerald-700 dark:text-emerald-400">必填字段验证通过</span>
        </div>
      )}
    </div>
  );
}
