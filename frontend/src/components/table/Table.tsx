// src/components/table/Table.tsx
import type { TableProps } from './types';

export function Table<T>({
  columns,
  data,
  loading,
  emptyText = 'No records',
  className,
  ariaColCount = columns.length,
  ariaRowCount = data.length,
  getRowKey,
  renderLoadingRow,
  renderEmptyRow,
  handlers,
}: TableProps<T>) {
  return (
    <div role="grid" aria-colcount={ariaColCount} aria-rowcount={ariaRowCount} className={`overflow-x-auto ${className ?? ''}`}>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr role="row">
            {columns.map((col, idx) => {
              const header =
                typeof col.header === 'function' ? (col.header as any)(col) : col.header;
              return (
                <th
                  key={col.id}
                  role="columnheader"
                  aria-colindex={idx + 1}
                  className={`text-left px-4 py-3 ${col.headerClassName ?? ''}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {renderLoadingRow ? renderLoadingRow() : 'Loading...'}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {renderEmptyRow ? renderEmptyRow() : emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {
              const onClick = handlers?.onRowClick ? () => handlers.onRowClick!(row) : undefined;
              return (
                <tr
                  key={getRowKey(row, rIdx)}
                  role="row"
                  aria-rowindex={rIdx + 1}
                  className="border-t"
                  onClick={onClick}
                >
                  {columns.map((col, cIdx) => {
                    const content =
                      col.cell
                        ? col.cell(row)
                        : col.accessor
                        ? (row as any)[col.accessor]
                        : null;
                    return (
                      <td
                        key={`${col.id}-${cIdx}`}
                        role="gridcell"
                        aria-colindex={cIdx + 1}
                        className={`px-4 py-3 ${col.className ?? ''}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
