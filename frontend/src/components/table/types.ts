// src/components/table/types.ts
export type AccessorFn<T> = (row: T) => React.ReactNode;

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode | ((col: ColumnDef<T>) => React.ReactNode);
  accessor?: keyof T;
  cell?: (row: T) => React.ReactNode;
  width?: string | number;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  // optional filter control id used by external toolbar
  filterId?: string;
};

export type TableState = {
  page: number;
  pageSize: number;
  total: number;
};

export type TableHandlers<T> = {
  onSortChange?: (columnId: string, dir: 'asc' | 'desc' | 'none') => void;
  onRowClick?: (row: T) => void;
};

export type TableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  // accessibility counts
  ariaColCount?: number;
  ariaRowCount?: number;
  // unique row key
  getRowKey: (row: T, index: number) => string;
  // slots
  renderLoadingRow?: () => React.ReactNode;
  renderEmptyRow?: () => React.ReactNode;
  handlers?: TableHandlers<T>;
};
