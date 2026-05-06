import { Card } from "@/components/ui/card";
import { Package, DollarSign, TrendingUp, Clock } from "lucide-react";
import type { Order } from "./OrderForm";

const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;

export const StatsCards = ({ orders }: { orders: Order[] }) => {
  const totalOrders = orders.length;
  const revenue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const profit = orders.reduce((s, o) => s + Number(o.profit || 0), 0);
  const totalDue = orders.reduce((s, o) => s + Number(o.due || 0), 0);

  const items = [
    { label: "Total Orders", value: totalOrders.toString(), icon: Package, color: "from-blue-600 to-blue-400" },
    { label: "Revenue", value: fmt(revenue), icon: DollarSign, color: "from-purple-600 to-purple-400" },
    { label: "Profit", value: fmt(profit), icon: TrendingUp, color: "from-green-600 to-green-400" },
    { label: "Pending Due", value: fmt(totalDue), icon: Clock, color: "from-orange-600 to-orange-400" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} className={`overflow-hidden border-border/60 shadow-[var(--shadow-card)] bg-gradient-to-br ${it.color}`}>
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/80">{it.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{it.value}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <it.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};