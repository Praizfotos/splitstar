"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5_000, retry: 2 } } }));
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#1e1b4b", color: "#e2e8f0", border: "1px solid rgba(255,255,255,0.1)" } }} />
    </QueryClientProvider>
  );
}
