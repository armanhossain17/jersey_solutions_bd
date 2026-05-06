import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Delivered: "bg-success/15 text-success border-success/30",
  "In Progress": "bg-info/15 text-info border-info/30",
  Ready: "bg-primary/15 text-primary border-primary/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles[status] ?? styles.Pending)}>
    {status}
  </span>
);
