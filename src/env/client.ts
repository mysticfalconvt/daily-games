import { createEnv } from "@t3-oss/env-nextjs";
import { ZodError, z } from "zod";

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },
  shared: {
    NODE_ENV: z.enum(["development", "production"]),
  },
  onValidationError: (error: ZodError) => {
    console.error(
      "❌ Invalid client environment variables:",
      error.flatten().fieldErrors
    );
    throw new Error("Invalid client environment variables");
  },
  emptyStringAsUndefined: true,
  experimental__runtimeEnv: {
    // eslint-disable-next-line n/no-process-env
    NODE_ENV: process.env.NODE_ENV,
    // eslint-disable-next-line n/no-process-env
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
});
