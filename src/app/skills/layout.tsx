import Sidebar from '@/components/layout/SkillsSidebar';

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[#F5F7FA]">{children}</main>
    </div>
  );
}
