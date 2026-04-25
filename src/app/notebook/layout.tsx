import NotebookSidebar from '@/components/layout/NotebookSidebar';

export default function NotebookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <NotebookSidebar />
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-100">{children}</main>
    </div>
  );
}
