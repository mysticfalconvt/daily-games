"use client";

import { useState } from "react";

import { Button } from "@nextui-org/react";

export function ImpersonateButton({
  userId,
  label = "Impersonate",
  size = "sm",
}: {
  userId: string;
  label?: string;
  size?: "sm" | "md";
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.message ?? "Could not start impersonating");
        setIsLoading(false);
        return;
      }

      // Land on the home feed - that is what you usually want to inspect.
      window.location.href = "/";
    } catch (startError) {
      console.error("Failed to impersonate:", startError);
      setError("Could not start impersonating");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        size={size}
        variant="flat"
        color="warning"
        onPress={start}
        isLoading={isLoading}
      >
        {label}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
