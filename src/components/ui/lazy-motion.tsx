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
  // Apply initial styles during SSR so server and client render the same content
  // This prevents hydration mismatch when framer-motion applies initial on mount
  const ssrStyle = { ...rest.style };
  if (typeof initial === 'object' && initial !== null) {
    if (initial.opacity !== undefined) ssrStyle.opacity = initial.opacity;
    if (initial.y !== undefined) ssrStyle.transform = ssrStyle.transform || `translateY(${initial.y}px)`;
    if (initial.x !== undefined) ssrStyle.transform = `translateX(${initial.x}px)${ssrStyle.transform ? ' ' + ssrStyle.transform : ''}`;
    if (initial.scale !== undefined) ssrStyle.transform = `${ssrStyle.transform || ''} scale(${initial.scale})`.trim();
    if (initial.scaleX !== undefined) ssrStyle.transformOrigin = ssrStyle.transformOrigin || 'center';
  }
  return createElement('div', { ...rest, ref, style: ssrStyle });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionP = forwardRef<any, any>(function MotionP(props, ref) {
  const mod = useFramerMotion();
  if (mod) return createElement(mod.motion.p, { ...props, ref });
  const { initial, animate, exit, transition, ...rest } = props;
  const ssrStyle = { ...rest.style };
  if (typeof initial === 'object' && initial !== null) {
    if (initial.opacity !== undefined) ssrStyle.opacity = initial.opacity;
    if (initial.y !== undefined) ssrStyle.transform = `translateY(${initial.y}px)`;
  }
  return createElement('p', { ...rest, ref, style: ssrStyle });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MotionButton = forwardRef<any, any>(function MotionButton(props, ref) {
  const mod = useFramerMotion();
  if (mod) return createElement(mod.motion.button, { ...props, ref });
  const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
  const ssrStyle = { ...rest.style };
  if (typeof initial === 'object' && initial !== null) {
    if (initial.opacity !== undefined) ssrStyle.opacity = initial.opacity;
    if (initial.y !== undefined) ssrStyle.transform = `translateY(${initial.y}px)`;
  }
  return createElement('button', { ...rest, ref, style: ssrStyle });
});
