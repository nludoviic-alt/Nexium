import { useEffect, useMemo, useState } from "react";

export function useTableQuery<T>(rows: T[], matcher: (row: T, query: string) => boolean, pageSize = 10) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => matcher(r, q)) : rows;
  }, [rows, query, matcher]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { query, setQuery, page: safePage, setPage, totalPages, filtered, pageRows, pageSize };
}
