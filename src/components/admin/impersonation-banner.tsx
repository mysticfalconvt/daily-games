"use client";

import { useState } from "react";

import { Button } from "@nextui-org/react";
import { useSession } from "next-auth/react";

/**
 * Fixed banner shown whenever the session is impersonated. It is deliberately
 * loud and always present: the single worst failure mode here is an admin
 * forgetting whose account they are looking at.
 */
export function ImpersonationBanner() {
  const { data: session } = useSession();
  const [isStopping, setIsStopping] = useState(false);

  const impersonation = session?.impersonation;
  if (!impersonation) {
    return null;
  }

  const stop = async () => {
    setIsStopping(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      // Full reload so every server component re-renders as the real admin.
      window.location.href = "/admin";
    } catch (error) {
      console.error("Failed to stop impersonating:", error);
      setIsStopping(false);
    }
  };

  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-warning-500 px-4 py-2 text-black">
      <p className="text-sm font-medium">
        Viewing as{" "}
        <span className="font-bold">
          {session.user.name ?? session.user.email}
        </span>{" "}
        &middot; read-only &middot; signed in as {impersonation.adminEmail}
      </p>
      <Button
        size="sm"
        color="default"
        variant="solid"
        onPress={stop}
        isLoading={isStopping}
      >
        Stop impersonating
      </Button>
    </div>
  );
}
