/**
 * Lazy-loaded framer-motion components.
 *
 * Instead of importing `motion` and `AnimatePresence` directly (which adds ~40KB
 * to every page bundle synchronously), import from this module.
 *
 * Usage:
 *   Before: import { motion, AnimatePresence } from 'framer-motion';
 *   After:  import { MotionDiv, MotionP, AnimatePresence } from '@/components/ui/lazy-motion';
 */

import dynamic from 'next/dynamic';
import { forwardRef, useState, useEffect, createElement } from 'react';

// Cache the loaded framer-motion module
type FM = typeof import('framer-motion');
let fm: FM | null = null;
const fmPromise: Promise<FM> = import('framer-motion');
fmPromise.then(m => { fm = m; });

function useFramerMotion() {
  const [mod, setMod] = useState<FM | null>(fm);
  useEffect(() => { if (!mod) fmPromise.then(m => setMod(m)); }, [mod]);
  return mod;
}

// Re-export AnimatePresence as a lazy component
export const AnimatePresence = dynamic(
  () => import('framer-motion').then(m => m.AnimatePresence),
  { ssr: false },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionDiv = forwardRef<any, any>(function MotionDiv(props, ref) {
  const mod = useFramerMotion();
  if (mod) return createElement(mod.motion.div, { ...props, ref });
  const { initial, animate, exit, transition, whileHover, whileTap, layout, layoutId, variants, custom, ...rest } = props;
  return createElement('div', { ...rest, ref });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionP = forwardRef<any, any>(function MotionP(props, ref) {
  const mod = useFramerMotion();
  if (mod) return createElement(mod.motion.p, { ...props, ref });
  const { initial, animate, exit, transition, ...rest } = props;
  return createElement('p', { ...rest, ref });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionButton = forwardRef<any, any>(function MotionButton(props, ref) {
  const mod = useFramerMotion();
  if (mod) return createElement(mod.motion.button, { ...props, ref });
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
  return createElement('button', { ...rest, ref });
});
