import { ChevronDown } from 'lucide-react';
import type { DashboardStats } from '@/types';

export default function DashboardRecentReviews({ items }: { items: DashboardStats['recent_reviews'] }) {
  // 获取实际存在的状态列表
  const statuses = [...new Set(items.map(item => item.status))];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">近期待复盘</h3>
        <div className="relative">
          <select className="appearance-none text-xs text-muted-foreground bg-transparent pr-4 py-1 outline-none cursor-pointer hover:text-foreground transition-colors">
            <option>全部状态</option>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">暂无待复盘项</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.company_name} — {item.position_name}</p>
                </div>
                <span className="text-sm text-muted-foreground w-[60px] text-right shrink-0">{item.updated_at?.slice(5) || '-'}</span>
                <span className="text-sm font-medium text-indigo-600 w-[70px] text-right shrink-0">{item.status}</span>
              </div>
            ))}
          </div>

          {items.length > 5 && (
            <button className="w-full mt-4 pt-3 border-t border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              查看全部 ({items.length} 条)
            </button>
          )}
        </>
      )}
    </div>
  );
}