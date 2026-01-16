"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  // During build time, publishableKey might not be available
  // Clerk will use NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY env var automatically
  return <ClerkProvider>{children}</ClerkProvider>;
}
