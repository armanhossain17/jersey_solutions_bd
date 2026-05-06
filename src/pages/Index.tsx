import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpRight, ImageIcon, LayoutDashboard, List, Loader2, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type Order } from "@/components/orders/OrderForm";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { StatsCards } from "@/components/orders/StatsCards";

const fmt = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-BD")}`;

const statuses = ["Pending", "In Progress", "Ready", "Delivered", "Cancelled"];

const Index = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<"dashboard" | "orders">("dashboard");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_date", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch =
        !query ||
        o.customer_name.toLowerCase().includes(query) ||
        o.order_number.toLowerCase().includes(query) ||
        (o.phone ?? "").includes(query);
      const matchStatus = statusFilter === "all" || o.delivery_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        count: orders.filter((order) => order.delivery_status === status).length,
      })),
    [orders],
  );

  const selectedOrder = orders.find((order) => order.id === deleteId);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeletingId(deleteId);
    const { error } = await supabase.from("orders").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Order deleted");
    setDeleteId(null);
    setDeletingId(null);
  };

  const openEdit = (order: Order) => {
    setEditingId(order.id ?? null);
    navigate("/new-order", { state: { editOrder: order } });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border bg-white">
              <img src="/js_main_logo_png.png" alt="Jersey Solutions Bangladesh" className="max-h-10 w-auto" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Order management</p>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Jersey Solutions Bangladesh</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setView(view === "orders" ? "dashboard" : "orders")}
              variant="outline"
              className="gap-2"
            >
              {view === "orders" ? <LayoutDashboard className="h-4 w-4" /> : <List className="h-4 w-4" />}
              {view === "orders" ? "Dashboard" : "All Orders"}
            </Button>
            <Button onClick={() => navigate("/new-order")} className="gap-2">
              <Plus className="h-4 w-4" /> New Order
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-6">
        <section className="rounded-lg border border-border bg-[var(--gradient-hero)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-primary">Production desk</p>
              <h2 className="mt-1 max-w-3xl text-2xl font-bold text-foreground sm:text-3xl">
                Orders, payments, factory dues, and delivery status in one place.
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium text-muted-foreground">
                Use the status cards to jump into active work and keep cash collection visible.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[390px]">
              {statusCounts.slice(0, 3).map((item) => (
                <button
                  key={item.status}
                  onClick={() => {
                    setView("orders");
                    setStatusFilter(item.status);
                  }}
                  className="group rounded-md border border-border bg-card px-4 py-3 text-left shadow-[var(--shadow-card)] transition hover:border-primary/40 hover:bg-secondary/60"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-2xl font-bold text-foreground">{item.count}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
                  </span>
                  <span className="mt-1 block truncate text-xs font-semibold uppercase text-muted-foreground">{item.status}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {view === "dashboard" ? (
          <StatsCards orders={orders} />
        ) : (
          <>
            <Card className="border-border/80 bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Orders</h2>
                  <p className="text-sm text-muted-foreground">
                    Showing {filtered.length} of {orders.length} orders
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(240px,1fr)_220px] lg:w-[560px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search customer, order, phone"
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-border/80 shadow-[var(--shadow-card)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1180px] text-sm">
                  <thead className="bg-slate-100 text-left text-xs font-bold uppercase text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Jersey</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Due</th>
                      <th className="px-4 py-3 text-right">Factory Due</th>
                      <th className="px-4 py-3 text-right">Profit</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Design</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={11} className="py-14 text-center text-muted-foreground">
                          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                          Loading orders
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-14 text-center text-muted-foreground">
                          No orders match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((order) => (
                        <tr key={order.id} className="bg-card transition hover:bg-muted/35">
                          <td className="px-4 py-3">
                            <p className="font-semibold">#{order.order_number}</p>
                            <p className="text-xs text-muted-foreground">{order.order_date}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{order.customer_name}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {order.phone || "No phone"} - {order.source || "No source"}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{order.jersey_type || "-"}</p>
                            <p className="text-xs text-muted-foreground">{order.gsm || "GSM not set"}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {order.quantity}
                            {Number(order.gift) > 0 && <span className="ml-1 text-xs text-muted-foreground">+{order.gift}</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">{fmt(Number(order.total_amount))}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={Number(order.due) > 0 ? "font-semibold text-warning" : "text-muted-foreground"}>
                              {fmt(Number(order.due))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={Number(order.factory_due) > 0 ? "font-semibold text-warning" : "text-muted-foreground"}>
                              {fmt(Number(order.factory_due))}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-success">{fmt(Number(order.profit))}</td>
                          <td className="px-4 py-3"><StatusBadge status={order.delivery_status} /></td>
                          <td className="px-4 py-3">
                            {order.design ? (
                              <img
                                src={order.design}
                                alt={`Design for order ${order.order_number}`}
                                className="h-11 w-11 rounded-md border border-border object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                                <ImageIcon className="h-4 w-4" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEdit(order)} disabled={editingId === order.id}>
                                {editingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(order.id!)} disabled={deletingId === order.id}>
                                {deletingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order #{selectedOrder?.order_number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the order for {selectedOrder?.customer_name ?? "this customer"} from the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
