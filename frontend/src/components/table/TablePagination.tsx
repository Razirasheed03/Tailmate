// src/components/table/TablePagination.tsx
import { Button } from '@/components/UiComponents/button';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  leftText?: string;
};

export function TablePagination({
  page,
  totalPages,
  onPrev,
  onNext,
  leftText,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="text-sm text-gray-600">
        {leftText ?? `Page ${page} of ${totalPages}`}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="border-[#E5E7EB] bg-white hover:bg-white/90"
          disabled={page <= 1}
          onClick={onPrev}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          className="border-[#E5E7EB] bg-white hover:bg-white/90"
          disabled={page >= totalPages}
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
