import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, Search, Download } from 'lucide-react';
import { Input } from './Input';
import { Button } from './Button';
import { exportCurrentPage } from '@/lib/exportExcel';

function DataTable({ 
  columns, 
  data, 
  searchPlaceholder = 'Buscar...',
  onRowClick,
  emptyMessage = 'No hay datos',
  loading,
  pageName // Para exportar a Excel
}) {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const filteredData = data.filter(row =>
    Object.values(row).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    if (pageName && data.length > 0) {
      exportCurrentPage(pageName, data, columns);
    }
  };

  if (loading) {
    return (
      <div className="stitch-panel p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-stitch-surface-elevated rounded w-1/4" />
          <div className="h-4 bg-stitch-surface-elevated rounded w-1/2" />
          <div className="h-4 bg-stitch-surface-elevated rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="stitch-panel overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-stitch-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-stitch-surface-elevated/50">
        <div className="relative w-full sm:max-w-xs sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stitch-muted" />
          <Input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {pageName && data.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:w-auto shrink-0 justify-center">
            <Download className="w-4 h-4" />
            Exportar
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto -mx-px overscroll-x-contain">
        <table className="w-full min-w-[520px] sm:min-w-[640px]">
          <thead>
            <tr className="bg-stitch-surface-elevated border-b border-stitch-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-3 sm:px-6 py-3 text-left text-[11px] font-mono font-semibold text-stitch-muted uppercase tracking-wider',
                    col.sortable && 'cursor-pointer hover:text-stitch-text'
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stitch-border/30">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 sm:px-6 py-12 text-center text-stitch-muted">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className={cn(
                    'hover:bg-stitch-surface-elevated/50 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 sm:px-6 py-4 text-sm text-stitch-text">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
