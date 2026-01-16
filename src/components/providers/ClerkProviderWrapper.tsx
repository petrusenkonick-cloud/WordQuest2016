"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ClerkProviderWrapperProps {
  children: ReactNode;
}

export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  // Always wrap with ClerkProvider - dynamic rendering prevents SSG issues
  return <ClerkProvider dynamic>{children}</ClerkProvider>;
}
