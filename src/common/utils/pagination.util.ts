import type { PaginatedResult } from '../types/api.types';

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10,
): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(100, Math.max(1, pageSize));
  const start = (safePage - 1) * safeSize;

  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    pageSize: safeSize,
  };
}

export function fuzzyIncludes(value: string, query?: string): boolean {
  if (!query?.trim()) return true;
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

export function sortItems<T>(
  items: T[],
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
): T[] {
  if (!sortBy) return items;

  const direction = sortOrder === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * direction;
    }
    return String(av).localeCompare(String(bv)) * direction;
  });
}
