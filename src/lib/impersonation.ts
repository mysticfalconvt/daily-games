import { createHmac, timingSafeEqual } from "crypto";

import { env } from "@/env/server";

export const IMPERSONATION_COOKIE = "dg_impersonate";

/** Impersonation expires on its own so a forgotten tab cannot stay elevated. */
export const IMPERSONATION_MAX_AGE_SECONDS = 30 * 60;

export type ImpersonationToken = {
  /** The admin who started this. Checked against the real session user. */
  adminId: string;
  targetId: string;
  /** Unix seconds. */
  issuedAt: number;
  expiresAt: number;
};

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function signPayload(payload: string): string {
  return base64url(
    createHmac("sha256", env.NEXTAUTH_SECRET).update(payload).digest()
  );
}

export function createImpersonationToken(
  adminId: string,
  targetId: string
): { value: string; token: ImpersonationToken } {
  const issuedAt = Math.floor(Date.now() / 1000);
  const token: ImpersonationToken = {
    adminId,
    targetId,
    issuedAt,
    expiresAt: issuedAt + IMPERSONATION_MAX_AGE_SECONDS,
  };

  const payload = base64url(JSON.stringify(token));
  return { value: `${payload}.${signPayload(payload)}`, token };
}

/**
 * Returns the token only if the signature is intact and it has not expired.
 * The caller still has to confirm the admin is a real admin *now* - a signature
 * proves the cookie was minted by us, not that the grant is still valid.
 */
export function verifyImpersonationToken(
  value: string | undefined
): ImpersonationToken | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");
  if (!payload || !signature) {
    return null;
  }

  const expected = signPayload(payload);
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return null;
  }

  let parsed: ImpersonationToken;
  try {
    parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as ImpersonationToken;
  } catch {
    return null;
  }

  if (
    typeof parsed.adminId !== "string" ||
    typeof parsed.targetId !== "string" ||
    typeof parsed.expiresAt !== "number"
  ) {
    return null;
  }

  if (parsed.expiresAt * 1000 <= Date.now()) {
    return null;
  }

  return parsed;
}
