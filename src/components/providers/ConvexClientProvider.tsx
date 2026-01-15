"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";
import { ConvexSyncProvider } from "./ConvexSyncProvider";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

  const client = useMemo(() => {
    if (convexUrl) {
      return new ConvexReactClient(convexUrl);
    }
    return null;
  }, [convexUrl]);

  // If no Convex URL is set, just render children without provider
  // The app will use localStorage for data persistence
  if (!client) {
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={client}>
      <ConvexSyncProvider>{children}</ConvexSyncProvider>
    </ConvexProvider>
  );
}
