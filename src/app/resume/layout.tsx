import ResumeSidebar from '@/components/layout/ResumeSidebar';

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResumeSidebar />
      <main className="flex-1 overflow-y-auto bg-[#F5F7FA]">{children}</main>
    </div>
  );
}
