import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useGetAdminDepositsQuery, useGetAdminUserQuery } from "@/api/adminApi";
import { formatDateTime } from "@/lib/dates";
import { getErrorMessage } from "@/lib/formErrors";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/shared/EmptyState";
import ErrorState from "@/components/shared/ErrorState";
import Money from "@/components/shared/Money";
import StatusBadge from "@/features/transactions/components/StatusBadge";
import TypeBadge from "@/features/transactions/components/TypeBadge";
import { counterpartyLabel, moneyDirection } from "@/features/transactions/transactionMeta";
import DepositHistoryTable from "../components/DepositHistoryTable";
import UserStatusBadge from "../components/UserStatusBadge";
import UserStatusDialog from "../components/UserStatusDialog";

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right text-foreground">{children}</dd>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, error, refetch } = useGetAdminUserQuery(id);
  const deposits = useGetAdminDepositsQuery({ userId: id, page: 1, limit: 5 });
  const [statusTarget, setStatusTarget] = useState(null);

  const back = (
    <Button asChild variant="ghost">
      <Link to="/admin/users">
        <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Customers
      </Link>
    </Button>
  );

  if (isLoading)
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  if (isError) {
    if ([400, 404].includes(error?.status))
      return (
        <div className="space-y-4">
          {back}
          <EmptyState title="Customer not found" hint="The link may be wrong, or this is not a customer account." />
        </div>
      );
    return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
  }

  const { user, account, recentTransactions } = data;
  const canDeposit = user.status === "ACTIVE" && account;

  return (
    <div className="space-y-6">
      {back}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold tracking-tight">{user.name}</h1>
          <UserStatusBadge status={user.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          {canDeposit && (
            <Button asChild variant="secondary">
              <Link to={`/admin/deposits?userId=${user.id}`}>Make a deposit</Link>
            </Button>
          )}
          <Button
            variant={user.status === "ACTIVE" ? "secondary" : "default"}
            className={user.status === "ACTIVE" ? "text-danger" : ""}
            onClick={() => setStatusTarget(user)}
          >
            {user.status === "ACTIVE" ? "Suspend…" : "Reactivate…"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="rounded-full bg-muted p-1">
          <TabsTrigger value="profile" className="rounded-full">
            Profile
          </TabsTrigger>
          <TabsTrigger value="transactions" className="rounded-full">
            Transactions
          </TabsTrigger>
          <TabsTrigger value="deposits" className="rounded-full">
            Deposits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="rounded-2xl border-border bg-card">
            <CardContent className="p-6">
              <dl className="divide-y divide-border">
                <Row label="Email">{user.email}</Row>
                <Row label="Joined">{formatDateTime(user.createdAt)}</Row>
                <Row label="Account">
                  {account ? <span className="font-mono text-xs">{account.accountNumberMasked}</span> : "No account yet"}
                </Row>
                {account && (
                  <Row label="Balance">
                    <Money paise={account.balancePaise} size="row" />
                  </Row>
                )}
                {account && <Row label="Account status">{account.status === "ACTIVE" ? "Active" : "Frozen"}</Row>}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="rounded-2xl border-border bg-card">
            <CardContent className="space-y-3 p-6">
              {recentTransactions.length === 0 ? (
                <EmptyState title="No transactions yet" />
              ) : (
                <ul className="divide-y divide-border">
                  {recentTransactions.map((tx) => (
                    <li key={tx.paymentId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{counterpartyLabel(tx)}</p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{tx.paymentId}</span> · {formatDateTime(tx.createdAt)}
                        </p>
                        <div className="mt-1 flex gap-2">
                          <TypeBadge type={tx.type} />
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                      <Money paise={tx.amountPaise} direction={moneyDirection(tx)} />
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="ghost">
                <Link to={`/admin/transactions?userId=${user.id}`}>View all transactions →</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deposits">
          {deposits.isError ? (
            <ErrorState message={getErrorMessage(deposits.error)} onRetry={deposits.refetch} />
          ) : (
            <DepositHistoryTable items={deposits.data?.items ?? []} loading={deposits.isLoading} hideCustomer />
          )}
        </TabsContent>
      </Tabs>

      <UserStatusDialog user={statusTarget} onClose={() => setStatusTarget(null)} />
    </div>
  );
}
