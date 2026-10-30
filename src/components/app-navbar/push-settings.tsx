"use client";

import { useEffect, useState } from "react";

function applicationKey(key: string): Uint8Array {
  const bytes = atob(
    (key + "=".repeat((4 - (key.length % 4)) % 4))
      .replace(/-/g, "+")
      .replace(/_/g, "/")
  );
  return Uint8Array.from(bytes, (char) => char.charCodeAt(0));
}

export function PushSettings() {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/push")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setPublicKey(data?.publicKey || null))
      .catch(() => setPublicKey(null));
  }, []);

  const change = async (enable: boolean) => {
    setBusy(true);
    setMessage(null);
    try {
      if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
      ) {
        throw new Error(
          "Push is not available here. On iPhone or iPad, add this site to your Home Screen and open it from there."
        );
      }
      if (enable) {
        if (!publicKey)
          throw new Error(
            "Push notifications have not been configured by the server administrator."
          );
        const permission = await Notification.requestPermission();
        if (permission !== "granted")
          throw new Error(
            "Notification permission was not granted. Check your browser settings."
          );
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription =
          (await registration.pushManager.getSubscription()) ||
          (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationKey(publicKey),
          }));
        const response = await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
        if (!response.ok)
          throw new Error(
            (await response.json()).message || "Could not enable notifications."
          );
        setMessage("Push notifications enabled on this device.");
      } else {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        if (subscription) {
          const response = await fetch("/api/push", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          if (!response.ok)
            throw new Error(
              "Could not disable notifications. Please try again."
            );
          await subscription.unsubscribe();
        }
        setMessage("Push notifications disabled on this device.");
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not change push settings."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 border-t p-2 text-xs">
      <p className="mb-2 text-muted-foreground">Device notifications</p>
      <div className="flex gap-4">
        <button
          disabled={busy}
          type="button"
          className="text-primary disabled:opacity-50"
          onClick={() => void change(true)}
        >
          Enable
        </button>
        <button
          disabled={busy}
          type="button"
          className="text-primary disabled:opacity-50"
          onClick={() => void change(false)}
        >
          Disable
        </button>
      </div>
      {message && (
        <p role="status" className="mt-2">
          {message}
        </p>
      )}
    </div>
  );
}
