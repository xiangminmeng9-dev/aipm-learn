import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'echarts',
      '@supabase/supabase-js',
      'zod',
      'react-markdown',
      'remark-gfm',
      'marked',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },
};

export default nextConfig;
