import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthBootstrap from "@/features/auth/guards/AuthBootstrap";
import RequireAuth from "@/features/auth/guards/RequireAuth";
import RequireAdmin from "@/features/auth/guards/RequireAdmin";
import GuestOnly from "@/features/auth/guards/GuestOnly";
import PublicLayout from "@/layouts/PublicLayout";
import AuthLayout from "@/layouts/AuthLayout";
import CustomerShell from "@/layouts/CustomerShell";
import AdminShell from "@/layouts/AdminShell";
import AppRouteError from "@/components/shared/AppRouteError";

// lazy-load each page: the browser only downloads a page when you visit it
const lazyPage = (loader) => ({ lazy: async () => ({ Component: (await loader()).default }) });

export const router = createBrowserRouter([
  {
    element: <AuthBootstrap />,
    errorElement: <AppRouteError />,
    children: [
      {
        element: <PublicLayout />,
        children: [{ path: "/", ...lazyPage(() => import("@/features/auth/pages/LandingPage.jsx")) }],
      },

      {
        element: <GuestOnly />,
        children: [
          {
            element: <AuthLayout />,
            children: [
              { path: "/login", ...lazyPage(() => import("@/features/auth/pages/LoginPage.jsx")) },
              { path: "/signup", ...lazyPage(() => import("@/features/auth/pages/SignupPage.jsx")) },
              { path: "/forgot-password", ...lazyPage(() => import("@/features/auth/pages/ForgotPasswordPage.jsx")) },
              { path: "/reset-password", ...lazyPage(() => import("@/features/auth/pages/ResetPasswordPage.jsx")) },
            ],
          },
        ],
      },

      {
        element: <RequireAuth />,
        children: [
          {
            path: "/app",
            element: <CustomerShell />,
            children: [
              { index: true, element: <Navigate to="dashboard" replace /> },
              { path: "dashboard", ...lazyPage(() => import("@/features/dashboard/pages/DashboardPage.jsx")) },
              { path: "transfer", ...lazyPage(() => import("@/features/transfer/pages/TransferPage.jsx")) },
              { path: "transactions", ...lazyPage(() => import("@/features/transactions/pages/TransactionsPage.jsx")) },
              { path: "transactions/:paymentId", ...lazyPage(() => import("@/features/transactions/pages/TransactionDetailPage.jsx")) },
              { path: "transactions/:paymentId/receipt", ...lazyPage(() => import("@/features/transactions/pages/ReceiptPage.jsx")) },
              { path: "lookup", ...lazyPage(() => import("@/features/transactions/pages/LookupPage.jsx")) },
              { path: "profile", ...lazyPage(() => import("@/features/profile/pages/ProfilePage.jsx")) },
            ],
          },
        ],
      },

      {
        element: <RequireAdmin />,
        children: [
          {
            path: "/admin",
            element: <AdminShell />,
            children: [
              { index: true, element: <Navigate to="overview" replace /> },
              { path: "overview", ...lazyPage(() => import("@/features/admin/pages/AdminOverviewPage.jsx")) },
              { path: "users", ...lazyPage(() => import("@/features/admin/pages/AdminUsersPage.jsx")) },
              { path: "users/:id", ...lazyPage(() => import("@/features/admin/pages/AdminUserDetailPage.jsx")) },
              { path: "transactions", ...lazyPage(() => import("@/features/admin/pages/AdminTransactionsPage.jsx")) },
              { path: "deposits", ...lazyPage(() => import("@/features/admin/pages/AdminDepositsPage.jsx")) },
            ],
          },
        ],
      },

      { path: "*", ...lazyPage(() => import("@/features/auth/pages/NotFoundPage.jsx")) },
    ],
  },
]);
