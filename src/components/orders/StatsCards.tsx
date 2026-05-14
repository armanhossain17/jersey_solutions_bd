import { Card } from "@/components/ui/card";
import { Clock, Package, TrendingUp } from "lucide-react";
import type { Order } from "./OrderForm";

const fmt = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-BD")}`;

export const StatsCards = ({ orders }: { orders: Order[] }) => {
  const totalOrders = orders.length;
  const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
  const profit = orders.reduce((sum, order) => sum + Number(order.profit || 0), 0);
  const totalDue = orders.reduce((sum, order) => sum + Number(order.due || 0), 0);

  const items = [
    { label: "Orders", value: totalOrders.toString(), icon: Package, tone: "bg-primary/10 text-primary", border: "border-l-primary" },
    { label: "Revenue", value: fmt(revenue), icon: null, symbol: "৳", tone: "bg-info/10 text-info", border: "border-l-info" },
    { label: "Profit", value: fmt(profit), icon: TrendingUp, tone: "bg-success/10 text-success", border: "border-l-success" },
    { label: "Due", value: fmt(totalDue), icon: Clock, tone: "bg-warning/10 text-warning", border: "border-l-warning" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {items.map((item) => (
        <Card key={item.label} className={`min-w-0 rounded-3xl border-border/70 border-l-4 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4 ${item.border}`}>
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${item.tone}`}>
            {item.icon ? <item.icon className="h-5 w-5" /> : <span className="text-xl font-black leading-none">{item.symbol}</span>}
          </div>
          <p className="text-xs font-bold uppercase text-muted-foreground">{item.label}</p>
          <p className="mt-1 break-words text-lg font-black leading-tight text-foreground sm:text-xl">{item.value}</p>
        </Card>
      ))}
    </div>
  );
};
