'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface CompanyPreference {
  persona: string;
  core_skills: Array<{ name: string; count: number }>;
  soft_skills: string[];
  not_care: string;
  suggestion: string;
  strengthen: string;
}

interface CompanyProfileData {
  companyType: string | null;
  companyTypeSource: string | null;
  preference: CompanyPreference | null;
  report: string | null;
  fixedPersona: string | null;
  preferenceSource: string | null; // 'fixed' | 'jd_analyses' | 'web_research' | 'generic' | null
}

interface UseCompanyProfileResult {
  profile: CompanyProfileData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export type { CompanyPreference, CompanyProfileData };

export function useCompanyProfile(companyName: string): UseCompanyProfileResult {
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastFetchedRef = useRef<string>('');
  const isFetchingRef = useRef(false);

  const fetchProfile = useCallback(async (name: string) => {
    if (!name || name.trim().length < 2) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      lastFetchedRef.current = '';
      return;
    }

    // Skip if same name already fetched successfully
    const normalized = name.trim();
    if (normalized === lastFetchedRef.current && !isFetchingRef.current) return;

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    isFetchingRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/resume/company-profile?company=${encodeURIComponent(normalized)}`,
        { signal: controller.signal }
      );
      const data = await res.json();

      if (controller.signal.aborted) return;

      if (!res.ok) {
        setError(data.error || '获取公司画像失败');
        if (data.company_type) {
          setProfile({
            companyType: data.company_type,
            companyTypeSource: data.source,
            preference: data.preference || null,
            report: data.report || null,
            fixedPersona: data.fixed_persona || null,
            preferenceSource: data.preference_source || null,
          });
        } else {
          setProfile(null);
        }
      } else {
        setProfile({
          companyType: data.company_type || null,
          companyTypeSource: data.source || null,
          preference: data.preference || null,
          report: data.report || null,
          fixedPersona: data.fixed_persona || null,
          preferenceSource: data.preference_source || null,
        });
        setError(null);
        lastFetchedRef.current = normalized;
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      const errMsg = err instanceof Error ? err.message : '获取公司画像失败';
      setError(errMsg);
      setProfile(null);
    } finally {
      isFetchingRef.current = false;
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []); // No dependency on profile — use ref to break the cycle

  // Debounced fetch on companyName change
  useEffect(() => {
    const name = companyName.trim();
    if (!name || name.length < 2) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      lastFetchedRef.current = '';
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      fetchProfile(name);
    }, 800);

    return () => {
      clearTimeout(timer);
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [companyName, fetchProfile]);

  const refetch = useCallback(() => {
    lastFetchedRef.current = '';
    fetchProfile(companyName.trim());
  }, [companyName, fetchProfile]);

  return { profile, isLoading, error, refetch };
}