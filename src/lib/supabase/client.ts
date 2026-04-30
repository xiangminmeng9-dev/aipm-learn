import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
    {
      isSingleton: true,
      auth: {
        lock: async <R>(name: string, acquireTimeout: number, fn: () => Promise<R>): Promise<R> => {
          return fn();
        },
      },
    }
  );
}