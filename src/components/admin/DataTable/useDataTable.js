import { useState, useMemo, useCallback } from 'react';

export function useDataTable({ data = [], pageSize = 25, onSortChange, onFilterChange }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc' | null
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selection, setSelection] = useState(new Set());
  const [filters, setFilters] = useState({});

  // Cyclical sort: none -> asc -> desc -> none
  const setSort = useCallback((key) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') {
        setSortKey(null);
        setSortDir('asc');
      }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey, sortDir]);

  const toggleRow = useCallback((id) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids) => {
    setSelection(prev => {
      if (prev.size === ids.length) return new Set();
      return new Set(ids);
    });
  }, []);

  const clearSelection = useCallback(() => setSelection(new Set()), []);

  // Process: filter (search + custom filters) -> sort -> paginate
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter (simple substring match on all string fields)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(v =>
          v != null && String(v).toLowerCase().includes(q)
        )
      );
    }

    // Custom filters (e.g., status, date range)
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        result = result.filter(row => value.includes(row[key]));
      }
    });

    // Sorting
    if (sortKey && sortDir) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      });
    }

    // Pagination
    const totalPages = Math.ceil(result.length / pageSize);
    const safePage = Math.min(page, totalPages - 1);
    if (safePage !== page) setPage(safePage);

    const paginated = result.slice(safePage * pageSize, (safePage + 1) * pageSize);

    return {
      all: result,
      paginated,
      totalPages,
      currentPage: safePage,
      total: result.length,
    };
  }, [data, search, filters, sortKey, sortDir, page, pageSize]);

  return {
    // State
    sortKey,
    sortDir,
    search,
    page,
    selection,
    filters,

    // Setters
    setSort,
    setSearch,
    setPage,
    toggleRow,
    toggleAll,
    clearSelection,
    setFilters,

    // Computed
    processedData,
    sortedData: processedData.all,
    paginatedData: processedData.paginated,
    totalPages: processedData.totalPages,
    currentPage: processedData.currentPage,
    totalResults: processedData.total,
  };
}
