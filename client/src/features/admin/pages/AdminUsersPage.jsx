import { useState } from "react";
import { useGetAdminUsersQuery } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/formErrors";
import { cn } from "@/lib/cn";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import PaginationBar from "@/features/transactions/components/PaginationBar";
import UserSearchBar from "../components/UserSearchBar";
import UsersTable from "../components/UsersTable";
import UserStatusDialog from "../components/UserStatusDialog";

export default function AdminUsersPage() {
  const [filters, setFilters] = useState({ q: "", status: "", page: 1, limit: 20 });
  const [target, setTarget] = useState(null); // the user whose status dialog is open
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminUsersQuery(filters, { refetchOnMountOrArgChange: 30 });
  const update = (patch) => setFilters((f) => ({ ...f, ...patch, page: patch.page ?? 1 })); // any filter change → page 1

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Customers</h1>
      <UserSearchBar status={filters.status} onChange={update} />

      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : isError && !data ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No customers match" hint="Try a different name or email, or clear the status filter." />
      ) : (
        <div aria-busy={isFetching} className={cn("space-y-4 transition-opacity", isFetching && "opacity-60")}>
          <UsersTable users={data.items} onToggleStatus={setTarget} />
          <PaginationBar meta={data.meta} onPage={(page) => update({ page })} onLimit={(limit) => update({ limit })} />
        </div>
      )}

      <UserStatusDialog user={target} onClose={() => setTarget(null)} />
    </div>
  );
}
