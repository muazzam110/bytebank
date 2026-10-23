import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIMITS } from "../filterConfig";

// 1 … 4 [5] 6 … 20
function pageItems(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) items.push("…");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("…");
  items.push(total);
  return items;
}

export default function PaginationBar({ meta, onPage, onLimit }) {
  const totalPages = Math.max(1, meta.totalPages);
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span>
          Showing {first}–{last} of {meta.total}
        </span>
        <Select value={String(meta.limit)} onValueChange={(v) => onLimit(Number(v))}>
          <SelectTrigger className="h-11 w-[120px]" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LIMITS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination className="mx-0 w-auto justify-start sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <Button variant="ghost" className="min-h-11" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
              Prev
            </Button>
          </PaginationItem>
          {pageItems(meta.page, totalPages).map((item, i) =>
            item === "…" ? (
              <PaginationItem key={`gap-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <Button
                  variant={item === meta.page ? "secondary" : "ghost"}
                  className="min-h-11 min-w-11"
                  aria-label={`Page ${item}`}
                  aria-current={item === meta.page ? "page" : undefined}
                  onClick={() => onPage(item)}
                >
                  {item}
                </Button>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <Button variant="ghost" className="min-h-11" disabled={meta.page >= totalPages} onClick={() => onPage(meta.page + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
