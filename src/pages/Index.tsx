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
import { ArrowLeft, Download, LayoutDashboard, List, Loader2, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type Order } from "@/components/orders/OrderForm";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { StatsCards } from "@/components/orders/StatsCards";
import { dummyOrdersApi } from "@/lib/dummy-orders-api";
import { downloadInvoice } from "@/lib/invoice";

const fmt = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-BD")}`;
const fmtDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const Index = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("In Progress");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<"dashboard" | "orders">("dashboard");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const handleDownloadInvoice = async (order: Order) => {
    if (!order.id) return;
    setDownloadingId(order.id);
    try {
      await downloadInvoice(order);
      toast.success("Invoice downloaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not download invoice";
      toast.error(message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 sm:pb-8">
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
          <Button onClick={() => navigate("/new-order")} className="hidden h-11 rounded-2xl gap-2 px-4 font-bold sm:inline-flex">
            <Plus className="h-5 w-5" />
            New Order
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-3 py-4 sm:px-4 sm:py-5">
        {view === "dashboard" && (
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold uppercase text-muted-foreground">Order Summary</p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black leading-none text-foreground">{orders.length}</h2>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Total Orders</p>
              </div>
              <div className="rounded-2xl bg-success/10 px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase text-success/80">Active</p>
                <p className="text-2xl font-black text-success">{orders.filter((o) => ["Pending", "In Progress", "Ready"].includes(o.delivery_status)).length}</p>
              </div>
            </div>
          </section>
        )}

        {view === "dashboard" && (
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-1 shadow-[var(--shadow-card)]">
            <Button
              onClick={() => setView("dashboard")}
              variant="default"
              className="h-11 rounded-xl gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              onClick={() => setView("orders")}
              variant="ghost"
              className="h-11 rounded-xl gap-2"
            >
              <List className="h-4 w-4" />
              Orders
            </Button>
          </div>
        )}

        {view === "dashboard" ? (
          <StatsCards orders={orders} />
        ) : (
          <section className="space-y-4">
            <Card className="rounded-3xl border-border/70 p-3 shadow-[var(--shadow-card)] sm:p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_132px] gap-2 sm:grid-cols-[1fr_220px] sm:gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search order"
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
                  const hasTrouserDetails =
                    Boolean(order.trouser_type && order.trouser_type !== "None") ||
                    Boolean(order.trouser_gsm && order.trouser_gsm !== "None") ||
                    Number(order.trouser_quantity || 0) > 0 ||
                    Number(order.trouser_selling_price_per_pcs || 0) > 0 ||
                    Number(order.trouser_factory_cost_per_pcs || 0) > 0;
                  const designImages = order.designs?.length ? order.designs : order.design ? [order.design] : [];

                  return (
                    <Card key={order.id} className="overflow-hidden rounded-3xl border-border/70 p-3 shadow-[var(--shadow-card)] sm:p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">#{order.order_number}</p>
                          <h3 className="mt-1 break-words text-base font-bold leading-snug sm:text-lg">{order.customer_name}</h3>
                          <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{order.phone || "No phone"}</span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <StatusBadge status={order.delivery_status} />
                          <p className="mt-2 text-xs font-semibold text-muted-foreground">{fmtDate(order.order_date)}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Jersey</p>
                          <p className="truncate text-sm font-bold leading-tight">{order.jersey_type || "-"}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Jersey GSM</p>
                          <p className="truncate text-sm font-bold leading-tight">{order.gsm || "-"}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Jersey Quantity</p>
                          <p className="break-words font-bold">{order.quantity}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Jersey Selling Price</p>
                          <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.selling_price_per_pcs))}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Jersey Factory Cost</p>
                          <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.factory_cost_per_pcs))}</p>
                        </div>
                        {hasTrouserDetails && (
                          <>
                            <div className="min-w-0 rounded-2xl bg-secondary p-3">
                              <p className="text-xs text-muted-foreground">Trouser</p>
                              <p className="truncate text-sm font-bold leading-tight">{order.trouser_type || "-"}</p>
                            </div>
                            <div className="min-w-0 rounded-2xl bg-secondary p-3">
                              <p className="text-xs text-muted-foreground">Trouser GSM</p>
                              <p className="truncate text-sm font-bold leading-tight">{order.trouser_gsm || "-"}</p>
                            </div>
                            <div className="min-w-0 rounded-2xl bg-secondary p-3">
                              <p className="text-xs text-muted-foreground">Trouser Quantity</p>
                              <p className="break-words font-bold">{order.trouser_quantity || 0}</p>
                            </div>
                            <div className="min-w-0 rounded-2xl bg-secondary p-3">
                              <p className="text-xs text-muted-foreground">Trouser Selling Price</p>
                              <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.trouser_selling_price_per_pcs || 0))}</p>
                            </div>
                            <div className="min-w-0 rounded-2xl bg-secondary p-3">
                              <p className="text-xs text-muted-foreground">Trouser Factory Cost</p>
                              <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.trouser_factory_cost_per_pcs || 0))}</p>
                            </div>
                          </>
                        )}
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Total Amount</p>
                          <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.total_amount))}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Customer Advance</p>
                          <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.advance))}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Customer Due Amount</p>
                          <p className="break-words text-sm font-bold leading-tight text-destructive sm:text-base">{fmt(Number(order.due))}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Factory Advance</p>
                          <p className="break-words text-sm font-bold leading-tight sm:text-base">{fmt(Number(order.factory_advance))}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Factory Due Amount</p>
                          <p className={Number(order.factory_due) > 0 ? "break-words text-sm font-bold leading-tight text-warning sm:text-base" : "break-words text-sm font-bold leading-tight text-muted-foreground sm:text-base"}>{fmt(Number(order.factory_due))}</p>
                        </div>
                        <div className="min-w-0 rounded-2xl bg-secondary p-3">
                          <p className="text-xs text-muted-foreground">Profit</p>
                          <p className="break-words text-sm font-bold leading-tight text-success sm:text-base">{fmt(Number(order.profit))}</p>
                        </div>
                      </div>

                      {designImages.length > 0 && (
                        <div className={designImages.length === 1 ? "mt-4 grid grid-cols-1 gap-2" : "mt-4 grid grid-cols-2 gap-2"}>
                          {designImages.map((image, index) => (
                            <div key={`${image.slice(0, 24)}-${index}`} className="overflow-hidden rounded-2xl border border-border bg-secondary/40">
                              <img
                                src={image}
                                alt={`Design ${index + 1} for order ${order.order_number}`}
                                className={designImages.length === 1 ? "h-44 w-full object-contain p-2" : "h-36 w-full object-contain p-2"}
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 border-t border-border pt-3">
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end">
                          <Button variant="secondary" size="icon" onClick={() => handleDownloadInvoice(order)} disabled={downloadingId === order.id} className="h-11 w-full rounded-2xl sm:w-11" aria-label={`Download invoice for order ${order.order_number}`}>
                            {downloadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>
                          <Button variant="secondary" size="icon" onClick={() => openEdit(order)} disabled={editingId === order.id} className="h-11 w-full rounded-2xl sm:w-11" aria-label={`Edit order ${order.order_number}`}>
                            {editingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                          </Button>
                          <Button variant="secondary" size="icon" onClick={() => setDeleteId(order.id!)} disabled={deletingId === order.id} className="h-11 w-full rounded-2xl text-destructive hover:text-destructive sm:w-11" aria-label={`Delete order ${order.order_number}`}>
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

      <div className={view === "orders" ? "fixed inset-x-0 bottom-0 z-20 grid grid-cols-[96px_1fr] gap-2 bg-background/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden" : "fixed inset-x-0 bottom-0 z-20 bg-background/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:hidden"}>
        {view === "orders" && (
          <Button onClick={() => setView("dashboard")} variant="outline" className="h-12 rounded-2xl gap-2 font-bold hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground">
            <ArrowLeft className="h-5 w-5" />
            Back
          </Button>
        )}
        <Button onClick={() => navigate("/new-order")} className="h-12 w-full rounded-2xl gap-2 font-bold shadow-[var(--shadow-elegant)]">
          <Plus className="h-5 w-5" />
          New Order
        </Button>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-3xl border-border p-4 sm:p-6">
          <AlertDialogHeader className="space-y-2 text-left">
            <AlertDialogTitle className="break-words text-xl leading-tight">
              Delete order #{selectedOrder?.order_number}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed sm:text-sm">
              Are you sure you want to delete this order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-2 gap-2 pt-2 sm:flex sm:justify-end">
            <AlertDialogCancel className="mt-0 h-12 rounded-2xl font-bold hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-12 rounded-2xl bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
