import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import "@fontsource-variable/inter";
import "@fontsource/sora/600.css";
import "@fontsource/sora/700.css";
import "@fontsource/sora/800.css";
import "@fontsource/jetbrains-mono/400.css";
import "./styles/globals.css";
import { store } from "@/app/store";
import { router } from "@/app/router";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
      <Toaster theme="light" position="top-right" richColors closeButton />
    </Provider>
  </StrictMode>
);
