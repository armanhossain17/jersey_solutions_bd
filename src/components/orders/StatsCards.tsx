import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, DollarSign, Package, TrendingUp, WalletCards } from "lucide-react";
import type { Order } from "./OrderForm";

const fmt = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-BD")}`;

export const StatsCards = ({ orders }: { orders: Order[] }) => {
  const totalOrders = orders.length;
  const revenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const profit = orders.reduce((s, o) => s + Number(o.profit || 0), 0);
  const totalDue = orders.reduce((s, o) => s + Number(o.due || 0), 0);
  const factoryDue = orders.reduce((s, o) => s + Number(o.factory_due || 0), 0);
  const inProduction = orders.filter((o) => ["Pending", "In Progress", "Ready"].includes(o.delivery_status)).length;
  const delivered = orders.filter((o) => o.delivery_status === "Delivered").length;
  const avgProfit = totalOrders ? Math.round(profit / totalOrders) : 0;

  const items = [
    { label: "Total Orders", value: totalOrders.toString(), detail: `${inProduction} active`, icon: Package, tone: "text-primary", bg: "bg-primary/10", border: "border-l-primary" },
    { label: "Revenue", value: fmt(revenue), detail: `${delivered} delivered`, icon: DollarSign, tone: "text-info", bg: "bg-info/10", border: "border-l-info" },
    { label: "Profit", value: fmt(profit), detail: `${fmt(avgProfit)} avg/order`, icon: TrendingUp, tone: "text-success", bg: "bg-success/10", border: "border-l-success" },
    { label: "Customer Due", value: fmt(totalDue), detail: `${fmt(factoryDue)} factory due`, icon: WalletCards, tone: "text-warning", bg: "bg-warning/10", border: "border-l-warning" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((it) => (
          <Card key={it.label} className={`border-border/80 border-l-4 bg-card shadow-[var(--shadow-card)] ${it.border}`}>
            <div className="flex min-h-[132px] items-start justify-between gap-4 p-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-muted-foreground">{it.label}</p>
                <p className="mt-3 break-words text-2xl font-bold leading-tight text-foreground">{it.value}</p>
                <p className="mt-1 text-sm font-medium text-muted-foreground">{it.detail}</p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${it.bg}`}>
                <it.icon className={`h-5 w-5 ${it.tone}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden border-0 bg-card shadow-[var(--shadow-card)]">
        <div className="grid gap-0 divide-y divide-border/70 md:grid-cols-3 md:divide-x md:divide-y-0">
          <div className="flex items-center gap-3 bg-card p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Active production</p>
              <p className="text-sm font-medium text-muted-foreground">{inProduction} orders need follow-up</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Fulfillment rate</p>
              <p className="text-sm font-medium text-muted-foreground">{totalOrders ? Math.round((delivered / totalOrders) * 100) : 0}% of orders delivered</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-card p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Cash to collect</p>
              <p className="text-sm font-medium text-muted-foreground">{fmt(totalDue)} outstanding from customers</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
