import ResourcesSidebar from '@/components/layout/ResourcesSidebar';

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <ResourcesSidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
