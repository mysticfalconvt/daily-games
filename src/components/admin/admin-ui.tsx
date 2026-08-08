import { ReactNode } from "react";

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-default-200 bg-content1 p-3">
      <p className="text-xs uppercase tracking-wide text-default-500">
        {label}
      </p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-default-400">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-default-200 bg-content1">
      <header className="flex items-start justify-between gap-4 border-b border-default-200 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && (
            <p className="text-xs text-default-500">{description}</p>
          )}
        </div>
        {action}
      </header>
      {/* Wide tables scroll inside the panel rather than the page. */}
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const tones = {
    default: "bg-default-200 text-default-700",
    warning: "bg-warning-100 text-warning-700",
    danger: "bg-danger-100 text-danger-700",
    success: "bg-success-100 text-success-700",
  } as const;

  return (
    <span
      className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-6 text-center text-sm text-default-400"
      >
        {children}
      </td>
    </tr>
  );
}

export const th =
  "whitespace-nowrap px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-default-500";
export const td = "whitespace-nowrap px-3 py-2 text-sm";
