import { useGetAdminOverviewQuery } from "@/api/adminApi";
import { getErrorMessage } from "@/lib/formErrors";
import ErrorState from "@/components/shared/ErrorState";
import OverviewStats from "../components/OverviewStats";

export default function AdminOverviewPage() {
  const { data, isLoading, isError, error, refetch } = useGetAdminOverviewQuery(undefined, { refetchOnMountOrArgChange: 30 });
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Overview</h1>
      {isError && !data ? <ErrorState message={getErrorMessage(error)} onRetry={refetch} /> : <OverviewStats data={data} loading={isLoading} />}
    </div>
  );
}
