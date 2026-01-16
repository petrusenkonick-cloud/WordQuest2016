import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that doesn't require Clerk
// Clerk auth is handled client-side via ClerkProvider
export function middleware(request: NextRequest) {
  // Allow all requests to pass through
  // Authentication is handled client-side
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run middleware on API routes that need protection
    // Skip everything else
    "/(api/protected)(.*)",
  ],
};
