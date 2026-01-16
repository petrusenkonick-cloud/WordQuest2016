"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode, useState, useEffect } from "react";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR/prerender, render children without Clerk to avoid build errors
  if (!mounted) {
    return <>{children}</>;
  }

  // On client, wrap with ClerkProvider
  return <ClerkProvider>{children}</ClerkProvider>;
}
