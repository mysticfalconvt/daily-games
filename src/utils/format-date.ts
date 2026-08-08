const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const DATE_ONLY = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

export function formatDateTime(
  value: Date | string | null | undefined
): string {
  if (!value) {
    return "—";
  }
  return DATE_TIME.format(new Date(value));
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return DATE_ONLY.format(new Date(value));
}

/** Short relative age, e.g. "3d ago". Falls back to "—" for missing values. */
export function formatRelative(
  value: Date | string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }

  return `${Math.round(months / 12)}y ago`;
}
