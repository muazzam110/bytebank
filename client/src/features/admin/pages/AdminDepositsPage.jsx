import { useState } from "react";
import { useGetAdminDepositsQuery } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/formErrors";
import { cn } from "@/lib/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorState from "@/components/shared/ErrorState";
import PaginationBar from "@/features/transactions/components/PaginationBar";
import DepositForm from "../components/DepositForm";
import DepositHistoryTable from "../components/DepositHistoryTable";

export default function AdminDepositsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data, isLoading, isFetching, isError, error, refetch } = useGetAdminDepositsQuery({ page, limit }, { refetchOnMountOrArgChange: 30 });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Deposits</h1>

      <Card className="mx-auto max-w-2xl rounded-2xl border-violet/30 bg-card shadow-elev-2">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">New simulated deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <DepositForm />
        </CardContent>
      </Card>

      <section aria-labelledby="history-heading" className="space-y-4">
        <h2 id="history-heading" className="text-xl font-semibold">
          Deposit history
        </h2>
        {isError && !data ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : (
          <div aria-busy={isFetching} className={cn("space-y-4 transition-opacity", isFetching && !isLoading && "opacity-60")}>
            <DepositHistoryTable items={data?.items ?? []} loading={isLoading} />
            {data && data.meta.total > 0 && (
              <PaginationBar
                meta={data.meta}
                onPage={setPage}
                onLimit={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
