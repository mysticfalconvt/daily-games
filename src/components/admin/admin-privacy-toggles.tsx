"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Switch } from "@nextui-org/react";

type Settings = {
  isPrivate: boolean;
  interactionsPrivate: boolean;
};

const LABELS: Array<{ key: keyof Settings; label: string; title: string }> = [
  {
    key: "isPrivate",
    label: "Scores",
    title: "On: only friends can see the scores this user posts",
  },
  {
    key: "interactionsPrivate",
    label: "Activity",
    title: "On: only friends can see this user's comments and reactions",
  },
];

/**
 * Lets an admin flip another user's privacy switches.
 *
 * Optimistic, but reverted on failure - leaving a switch showing a setting that
 * never saved would be worse here than anywhere else, since the whole point is
 * knowing what a user's privacy actually is.
 */
export function AdminPrivacyToggles({
  userId,
  initial,
  layout = "row",
}: {
  userId: string;
  initial: Settings;
  layout?: "row" | "stacked";
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(initial);
  const [pending, setPending] = useState<keyof Settings | null>(null);
  const [error, setError] = useState("");

  const update = async (key: keyof Settings, value: boolean) => {
    const previous = settings;
    setPending(key);
    setError("");
    setSettings({ ...settings, [key]: value });

    try {
      const response = await fetch(`/api/admin/users/${userId}/privacy`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setSettings(previous);
        setError(body.message ?? "Could not save");
        return;
      }

      setSettings(await response.json());
      // Refresh so the audit log panel picks up the new entry.
      router.refresh();
    } catch (updateError) {
      console.error("Failed to update privacy:", updateError);
      setSettings(previous);
      setError("Could not save");
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      className={
        layout === "row"
          ? "flex items-center gap-3"
          : "flex flex-col items-start gap-2"
      }
    >
      {LABELS.map((field) => (
        <Switch
          key={field.key}
          size="sm"
          color="warning"
          isSelected={settings[field.key]}
          isDisabled={pending !== null}
          onValueChange={(value) => update(field.key, value)}
          title={field.title}
          aria-label={`${field.label} private`}
        >
          <span className="text-xs">{field.label}</span>
        </Switch>
      ))}
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
