// src/components/table/TableToolbar.tsx
import * as React from 'react';
import { Button } from '@/components/UiComponents/button';

type ToolbarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  filters?: React.ReactNode;
  onApply: () => void;
  onClear?: () => void;
  hasFilters?: boolean;
  totalLabel?: string;
  title?: string;
  subtitle?: string;
};

export function TableToolbar({
  search,
  onSearchChange,
  filters,
  onApply,
  onClear,
  hasFilters,
  totalLabel,
  title,
  subtitle,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        {title && <h1 className="text-xl font-semibold">{title}</h1>}
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        {totalLabel && <p className="text-sm text-gray-600">{totalLabel}</p>}
      </div>
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="px-3 py-2 border rounded-lg text-sm"
        />
        {filters}
        <Button
          variant="outline"
          className="border-[#E5E7EB] bg-white hover:bg-white/90"
          onClick={onApply}
        >
          Apply
        </Button>
        {hasFilters && onClear && (
          <Button
            variant="outline"
            className="border-[#E5E7EB] bg-white hover:bg-white/90"
            onClick={onClear}
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
