import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { LayoutDashboard, List, Loader2, Pencil, Phone, Plus, Search, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type Order } from "@/components/orders/OrderForm";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { StatsCards } from "@/components/orders/StatsCards";
import { dummyOrdersApi } from "@/lib/dummy-orders-api";

const fmt = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-BD")}`;

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
    try {
      setOrders(await dummyOrdersApi.list());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load orders";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchSearch =
        !query ||
        order.customer_name.toLowerCase().includes(query) ||
        order.order_number.toLowerCase().includes(query) ||
        (order.phone ?? "").includes(query);
      const matchStatus = statusFilter === "all" || order.delivery_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const selectedOrder = orders.find((order) => order.id === deleteId);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeletingId(deleteId);
    try {
      await dummyOrdersApi.delete(deleteId);
      setOrders((current) => current.filter((order) => order.id !== deleteId));
      toast.success("Order deleted");
      setDeleteId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete order";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (order: Order) => {
    if (!order.id) return;
    setEditingId(order.id);
    navigate("/new-order", { state: { editOrder: order } });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 text-foreground shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white">
              <img src="/js_main_logo_png.png" alt="JSBD Logo" className="max-h-9 w-auto" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Order Management</p>
              <h1 className="truncate text-lg font-bold leading-tight">Jersey Solutions BD</h1>
            </div>
          </div>
          <Button onClick={() => navigate("/new-order")} size="icon" className="h-11 w-11 rounded-2xl">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase text-muted-foreground">Today&apos;s desk</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black leading-none text-foreground">{orders.length}</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Total saved orders</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase text-primary/80">Active</p>
              <p className="text-2xl font-black text-primary">{orders.filter((o) => ["Pending", "In Progress", "Ready"].includes(o.delivery_status)).length}</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
          <Button
            onClick={() => setView("dashboard")}
            variant={view === "dashboard" ? "default" : "ghost"}
            className="h-11 rounded-xl gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            onClick={() => setView("orders")}
            variant={view === "orders" ? "default" : "ghost"}
            className="h-11 rounded-xl gap-2"
          >
            <List className="h-4 w-4" />
            Orders
          </Button>
        </div>

        {view === "dashboard" ? (
          <StatsCards orders={orders} />
        ) : (
          <section className="space-y-4">
            <Card className="rounded-3xl border-border/70 p-4 shadow-[var(--shadow-card)]">
              <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search customer, order, phone"
                    className="h-12 rounded-2xl pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Ready">Ready</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {loading ? (
              <Card className="rounded-3xl p-10 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
                Loading orders
              </Card>
            ) : filtered.length === 0 ? (
              <Card className="rounded-3xl p-10 text-center text-muted-foreground">
                No orders yet. Tap New Order to add one.
              </Card>
            ) : (
              <div className="grid gap-3">
                {filtered.map((order) => {
                  const revenue = Number(order.quantity) * Number(order.selling_price_per_pcs);
                  return (
                    <Card key={order.id} className="rounded-3xl border-border/70 p-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">#{order.order_number}</p>
                          <h3 className="mt-1 truncate text-lg font-bold">{order.customer_name}</h3>
                          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {order.phone || "No phone"}
                          </p>
                        </div>
                        <StatusBadge status={order.delivery_status} />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <div className="rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Qty</p>
                          <p className="font-bold">{order.quantity}</p>
                        </div>
                        <div className="rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold">{fmt(Number(order.total_amount))}</p>
                        </div>
                        <div className="rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Due</p>
                          <p className={Number(order.due) > 0 ? "font-bold text-warning" : "font-bold text-muted-foreground"}>{fmt(Number(order.due))}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                        <div className="min-w-0 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Shirt className="h-4 w-4" />
                            {order.jersey_type || "-"} - {fmt(revenue)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(order)} disabled={editingId === order.id} className="rounded-2xl">
                            {editingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(order.id!)} disabled={deletingId === order.id} className="rounded-2xl text-destructive hover:text-destructive">
                            {deletingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <Button onClick={() => navigate("/new-order")} className="h-12 w-full rounded-2xl gap-2 font-bold shadow-[var(--shadow-elegant)]">
          <Plus className="h-5 w-5" />
          New Order
        </Button>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="mx-4 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order #{selectedOrder?.order_number}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the order from local storage.</AlertDialogDescription>
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
