import { useState } from "react";
import { useSelector } from "react-redux";
import { useGetAccountQuery, useGetSummaryQuery } from "@/api/accountApi";
import { selectUser } from "@/features/auth/authSlice";
import { getErrorMessage } from "@/lib/formErrors";
import ErrorState from "@/components/shared/ErrorState";
import BalanceHero from "../components/BalanceHero";
import StatCard from "../components/StatCard";
import TrajectoryChart from "../components/TrajectoryChart";
import RecentActivityList from "../components/RecentActivityList";
import QuickSendCard from "../components/QuickSendCard";
import { useIncomingCreditToast } from "../hooks/useIncomingCreditToast";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };
// Poll every 30 s, but only while the tab/window is focused: surfaces incoming payments without websockets
const POLL = { pollingInterval: 30_000, skipPollingIfUnfocused: true };

const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" });
const todayLabel = () => dateFmt.format(new Date());

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const user = useSelector(selectUser);
  const [range, setRange] = useState("30d");
  const account = useGetAccountQuery(undefined, POLL);
  const summary = useGetSummaryQuery(range, POLL);
  useIncomingCreditToast(summary.data?.recentTransactions);

  if (account.isError) {
    const noAccount = account.error?.status === 404;
    return (
      <ErrorState
        message={noAccount ? "No customer account found for this login. (Admins don't have one.)" : getErrorMessage(account.error)}
        onRetry={noAccount ? undefined : account.refetch}
      />
    );
  }

  const days = RANGE_DAYS[range];
  const firstName = user?.name?.split(" ")[0] ?? "";
  const s = summary.data;
  const summaryLoading = summary.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{todayLabel()}</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {greeting()}, <span className="text-gradient">{firstName}</span>
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          {account.isLoading ? (
            <div className="skeleton h-72 !rounded-3xl" aria-busy="true" />
          ) : (
            <BalanceHero account={account.data} userId={user.id} />
          )}
        </div>
        <div className="col-span-12 lg:col-span-4">
          <QuickSendCard transactions={s?.recentTransactions ?? []} loading={summaryLoading} />
        </div>

        {summary.isError && !s ? (
          <div className="col-span-12">
            <ErrorState message={getErrorMessage(summary.error)} onRetry={summary.refetch} />
          </div>
        ) : (
          <>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <StatCard label="Received" direction="credit" paise={s?.totalReceivedPaise} caption={`Last ${days} days`} loading={summaryLoading} />
            </div>
            <div className="col-span-12 sm:col-span-6 lg:col-span-3">
              <StatCard label="Sent" direction="debit" paise={s?.totalSentPaise} caption={`Last ${days} days`} loading={summaryLoading} />
            </div>
            <div className="col-span-12 lg:col-span-6">
              <TrajectoryChart range={range} onRangeChange={setRange} trajectory={s?.trajectory} loading={summaryLoading} fetching={summary.isFetching} />
            </div>
            <div className="col-span-12">
              <RecentActivityList transactions={s?.recentTransactions ?? []} loading={summaryLoading} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
