'use client';

import { useState, type ReactNode } from 'react';

export default function ResponsiveSidebar({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg md:hidden"
        aria-label="打开菜单"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Sidebar: always visible on md+, drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 transform transition-transform duration-200 md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => {
          // Close drawer when a link is clicked
          if ((e.target as HTMLElement).closest('a')) setOpen(false);
        }}
      >
        {children}
      </aside>
    </>
  );
}
