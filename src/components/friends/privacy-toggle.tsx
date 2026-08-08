"use client";

import { useEffect, useState } from "react";

import { Switch } from "@nextui-org/react";

type PrivacySettings = {
  isPrivate: boolean;
  interactionsPrivate: boolean;
};

const FIELDS: Array<{
  key: keyof PrivacySettings;
  label: string;
  on: string;
  off: string;
}> = [
  {
    key: "isPrivate",
    label: "Private scores",
    on: "Only friends can see the scores you post",
    off: "Anyone signed in can see the scores you post",
  },
  {
    key: "interactionsPrivate",
    label: "Private activity",
    on: "Only friends can see your comments and reactions",
    off: "Your comments and reactions are visible to anyone who can see the score",
  },
];

export function PrivacyToggle() {
  const [settings, setSettings] = useState<PrivacySettings>({
    isPrivate: false,
    interactionsPrivate: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [pending, setPending] = useState<keyof PrivacySettings | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/user/privacy");
        if (response.ok) {
          setSettings(await response.json());
        }
      } catch (loadError) {
        console.error("Error fetching privacy settings:", loadError);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const update = async (key: keyof PrivacySettings, value: boolean) => {
    const previous = settings;
    setPending(key);
    setError("");
    // Optimistic, but reverted below if the request fails - the old version
    // left the switch showing a setting that never saved.
    setSettings({ ...settings, [key]: value });

    try {
      const response = await fetch("/api/user/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setSettings(previous);
        setError(body.message ?? "Could not save that. Try again.");
        return;
      }

      setSettings(await response.json());
    } catch (updateError) {
      console.error("Error updating privacy settings:", updateError);
      setSettings(previous);
      setError("Could not save that. Try again.");
    } finally {
      setPending(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {FIELDS.map((field) => (
          <div
            key={field.key}
            className="flex items-center justify-between rounded-lg bg-default-100 p-3"
          >
            <div className="flex-1">
              <div className="mb-1 h-4 w-28 animate-pulse rounded bg-default-300" />
              <div className="h-3 w-48 animate-pulse rounded bg-default-200" />
            </div>
            <div className="h-6 w-10 animate-pulse rounded-full bg-default-300" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">Privacy</h3>
      {FIELDS.map((field) => (
        <div
          key={field.key}
          className="flex items-center justify-between gap-4 rounded-lg bg-default-100 p-3"
        >
          <div>
            <p className="text-sm font-medium">{field.label}</p>
            <p className="text-xs text-default-500">
              {settings[field.key] ? field.on : field.off}
            </p>
          </div>
          <Switch
            isSelected={settings[field.key]}
            onValueChange={(value) => update(field.key, value)}
            isDisabled={pending !== null}
            size="sm"
            color="primary"
            aria-label={field.label}
          />
        </div>
      ))}
      <p className="text-xs text-default-400">
        Private scores stay hidden from non-friends, but your name still appears
        to anyone who can see a score you comment on unless you also turn on
        private activity.
      </p>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
