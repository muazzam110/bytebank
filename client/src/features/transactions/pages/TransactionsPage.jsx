import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useGetTransactionsQuery } from "@/api/transactionsApi";
import { useTransactionFilters } from "@/hooks/useTransactionFilters";
import { getErrorMessage } from "@/lib/formErrors";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import { hasActiveFilters } from "../filterConfig";
import { resetFilters, setFilter, setPage } from "../transactionsFilterSlice";
import FilterBar from "../components/FilterBar";
import ActiveFilterChips from "../components/ActiveFilterChips";
import AnalyticsCore from "../components/AnalyticsCore";
import TransactionsTable from "../components/TransactionsTable";
import TransactionCard from "../components/TransactionCard";
import PaginationBar from "../components/PaginationBar";
import TransactionSheet from "../components/TransactionSheet";

export default function TransactionsPage() {
  const dispatch = useDispatch();
  const { ready } = useTransactionFilters(); // URL ⇄ slice sync
  const filters = useSelector((s) => s.transactionsFilter);
  const [selected, setSelected] = useState(null); // paymentId shown in the Sheet

  // skip until the URL has been read (no wasted request with default filters).
  // refetchOnMountOrArgChange: 30 → cached data younger than 30 s is reused, older data is refreshed,
  // so incoming payments appear even though only YOUR OWN mutations invalidate the tag.
  const { data, isLoading, isFetching, isError, error, refetch } = useGetTransactionsQuery(filters, {
    skip: !ready,
    refetchOnMountOrArgChange: 30,
  });
  const items = data?.items ?? [];
  const meta = data?.meta;
  const showSkeleton = !ready || isLoading;

  // a hand-edited ?page=999 → jump to the real last page
  useEffect(() => {
    if (meta && items.length === 0 && meta.total > 0 && filters.page > meta.totalPages) {
      dispatch(setPage(meta.totalPages));
    }
  }, [meta, items.length, filters.page, dispatch]);

  const onSort = (field) => dispatch(setFilter({ sort: filters.sort === `-${field}` ? field : `-${field}` }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold tracking-tight">Transactions</h1>
        <Button asChild variant="secondary">
          <Link to="/app/lookup">Look up a payment ID</Link>
        </Button>
      </div>

      <FilterBar />
      <ActiveFilterChips />
      <AnalyticsCore />

      <p className="sr-only" aria-live="polite">
        {meta ? `${meta.total} transactions found` : ""}
      </p>

      {showSkeleton ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : isError && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : items.length === 0 ? (
        hasActiveFilters(filters) ? (
          <EmptyState
            title="No transactions match these filters"
            hint="Try removing a filter or widening the date range."
            action={
              <Button variant="secondary" onClick={() => dispatch(resetFilters())}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState title="No transactions yet" hint="Send or receive money and it will appear here." />
        )
      ) : (
        // while a NEW page/filter loads, RTK Query keeps showing the previous result → dim it instead of flashing
        <div aria-busy={isFetching} className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>
          <div className="hidden md:block">
            <TransactionsTable items={items} sort={filters.sort} onSort={onSort} onOpen={setSelected} />
          </div>
          <div className="space-y-2 md:hidden">
            {items.map((tx) => (
              <TransactionCard key={tx.paymentId} tx={tx} onOpen={setSelected} />
            ))}
          </div>
          <PaginationBar meta={meta} onPage={(p) => dispatch(setPage(p))} onLimit={(limit) => dispatch(setFilter({ limit }))} />
        </div>
      )}

      <TransactionSheet paymentId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
