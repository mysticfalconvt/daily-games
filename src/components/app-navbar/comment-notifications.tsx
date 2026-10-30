"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Bell } from "lucide-react";

import { getPrettyGameType } from "@/utils/get-pretty-game-type";

type Item = {
  id: string;
  readAt: string | null;
  scoreId: string;
  gameType: string;
  author: string | null;
};

export function CommentNotifications() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
        setUnread(data.unread);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(refresh, 30000);
    const onVisibility = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  const openItem = async (item: Item) => {
    if (!item.readAt) {
      try {
        const response = await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: item.id }),
        });
        if (response.ok) void refresh();
      } catch (error) {
        console.error("Failed to mark notification read:", error);
      }
    }
    setOpen(false);
    router.push(`/scores/${encodeURIComponent(item.scoreId)}` as Route);
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Comment notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (!open) void refresh();
        }}
        className="relative rounded-lg p-2 hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 text-xs font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 max-w-[90vw] rounded-lg border bg-background p-2 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="px-2 py-1 font-semibold">Notifications</h2>
            {unread > 0 && (
              <button
                type="button"
                className="px-2 text-xs text-primary"
                onClick={async () => {
                  try {
                    const response = await fetch("/api/notifications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ all: true }),
                    });
                    if (response.ok) void refresh();
                  } catch (error) {
                    console.error("Failed to mark notifications read:", error);
                  }
                }}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-2 text-sm text-muted-foreground">
                No comment notifications.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void openItem(item)}
                  className={`block w-full rounded p-2 text-left text-sm hover:bg-muted ${!item.readAt ? "font-semibold" : "text-muted-foreground"}`}
                >
                  {item.author || "Someone"} commented on your{" "}
                  {getPrettyGameType(item.gameType)} score
                  {!item.readAt ? " •" : ""}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
