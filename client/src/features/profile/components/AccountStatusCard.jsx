import { useSelector } from "react-redux";
import { useGetAccountQuery } from "@/api/accountApi";
import { selectUser } from "@/features/auth/authSlice";
import { formatDateTime } from "@/lib/dates";
import { maskAccount } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserStatusBadge from "@/features/admin/components/UserStatusBadge";

export default function AccountStatusCard() {
  const user = useSelector(selectUser);
  const isCustomer = user?.role === "CUSTOMER"; // admins have no account
  const { data: account, isLoading } = useGetAccountQuery(undefined, { skip: !isCustomer });

  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Account status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="skeleton h-24 w-full" />
        ) : (
          <dl className="divide-y divide-border text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Login status</dt>
              <dd>
                <UserStatusBadge status={user.status} />
              </dd>
            </div>
            {account && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Account</dt>
                <dd className="font-mono text-xs">{maskAccount(account.accountNumber)}</dd>
              </div>
            )}
            {account && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Account state</dt>
                <dd>{account.status === "ACTIVE" ? "Active" : "Frozen"}</dd>
              </div>
            )}
            {account && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Customer since</dt>
                <dd>{formatDateTime(account.createdAt)}</dd>
              </div>
            )}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
