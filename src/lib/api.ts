import { NextResponse } from "next/server";

import { AuthContext, getAuthContext } from "./auth-context";

/**
 * An error whose message is safe to show the caller. Anything thrown that is
 * *not* an ApiError is treated as a bug and reported as a generic 500, so an
 * internal failure cannot leak its message through the API.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const badRequest = (message: string) =>
  new ApiError(400, "bad_request", message);
export const forbidden = (message: string) =>
  new ApiError(403, "forbidden", message);
export const notFound = (message: string) =>
  new ApiError(404, "not_found", message);
export const conflict = (message: string) =>
  new ApiError(409, "conflict", message);

/**
 * Next signals control flow by throwing: `redirect()`, `notFound()`, and the
 * dynamic-rendering bailout all surface as errors carrying a `digest`. Catching
 * those would turn a redirect into a 500, so they have to pass through.
 */
function isFrameworkControlFlow(error: unknown): boolean {
  const digest = (error as { digest?: unknown } | null)?.digest;
  if (typeof digest !== "string") {
    return false;
  }
  return (
    digest.startsWith("NEXT_REDIRECT") ||
    digest === "NEXT_NOT_FOUND" ||
    digest === "DYNAMIC_SERVER_USAGE"
  );
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status }
    );
  }

  console.error("Unhandled API error:", error);
  return NextResponse.json(
    { error: "internal_error", message: "Something went wrong" },
    { status: 500 }
  );
}

/**
 * Wraps a route handler so thrown ApiErrors become responses. Replaces the
 * try/catch-and-match-on-error.message block that every route had a copy of.
 */
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (isFrameworkControlFlow(error)) {
        throw error;
      }
      return errorResponse(error);
    }
  };
}

export async function requireApiUser(): Promise<AuthContext> {
  const context = await getAuthContext();
  if (!context) {
    throw new ApiError(401, "unauthorized", "You must be logged in");
  }
  return context;
}

/**
 * Guard for every mutating endpoint. Impersonation is deliberately read-only:
 * an admin can reproduce what a user sees without leaving real writes behind
 * under that person's name.
 */
export async function requireApiWrite(): Promise<AuthContext> {
  const context = await requireApiUser();
  if (context.impersonation) {
    throw new ApiError(
      403,
      "read_only_impersonation",
      "Impersonation is read-only. Stop impersonating to make changes."
    );
  }
  return context;
}

export async function requireApiAdmin(): Promise<AuthContext> {
  const context = await requireApiUser();
  if (!context.isAdmin) {
    // Same shape as any other forbidden response - no hint that an admin API
    // is what was hit.
    throw new ApiError(403, "forbidden", "Forbidden");
  }
  return context;
}

export const noStore = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
} as const;
