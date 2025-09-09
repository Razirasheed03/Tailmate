// src/components/common/StatusBadge.tsx
export function StatusBadge({ status }: { status: 'verified' | 'pending' | 'rejected' | 'active' | 'blocked' }) {
  if (status === 'verified' || status === 'active')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>;
  if (status === 'pending')
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">Rejected</span>;
}
