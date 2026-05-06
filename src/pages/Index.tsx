import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Search, Pencil, Trash2, Phone, Shirt, List, LayoutDashboard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OrderForm, type Order } from "@/components/orders/OrderForm";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { StatsCards } from "@/components/orders/StatsCards";

const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-BD")}`;

const Index = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
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
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        (o.phone ?? "").includes(search);
      const matchStatus = statusFilter === "all" || o.delivery_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeletingId(deleteId);
    const { error } = await supabase.from("orders").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else toast.success("Order deleted");
    setDeleteId(null);
    setDeletingId(null);
  };

  const openNew = () => {
    navigate("/new-order");
  };
  const openEdit = async (o: Order) => {
    navigate("/new-order", { state: { editOrder: o } });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-blue-900 to-black text-white shadow-[var(--shadow-elegant)]">
        <div className="container flex flex-col items-center gap-4 py-6">
          <div className="flex items-center gap-3">
            <img src="/js_main_logo_png.png" alt="JSBD Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Jersey Solutions Bangladesh</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            onClick={() => setView(view === "orders" ? "dashboard" : "orders")}
            size="lg"
            variant="secondary"
            className="gap-2 font-semibold"
          >
            {view === "orders" ? <LayoutDashboard className="h-5 w-5" /> : <List className="h-5 w-5" />}
            {view === "orders" ? "Dashboard" : "All Orders"}
          </Button>
          <Button onClick={openNew} size="lg" variant="secondary" className="gap-2 font-semibold">
            <Plus className="h-5 w-5" /> New Order
          </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-6 py-8">
        {view === "dashboard" ? (
          <StatsCards orders={orders} />
        ) : (
          <>
        {/* Filters */}
        <Card className="flex items-center gap-3 p-4 shadow-[var(--shadow-card)]">
          <div className="relative w-1/2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, order #, phone..."
              className="pl-9 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-1/2"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Ready">Ready</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Orders Table */}
        <Card className="overflow-hidden shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                <tr>
                  <th className="px-3 py-3">Order ID</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Customer Name</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Source</th>
                  <th className="px-3 py-3">Jersey Type</th>
                  <th className="px-3 py-3">GSM</th>
                  <th className="px-3 py-3 text-left">Qty (pcs)</th>
                  <th className="px-3 py-3 text-left">Gift</th>
                  <th className="px-3 py-3 text-left">Selling Price/pcs</th>
                  <th className="px-3 py-3 text-left">Total Revenue</th>
                  <th className="px-3 py-3 text-left">Total Amount</th>
                  <th className="px-3 py-3 text-left">Advance</th>
                  <th className="px-3 py-3 text-left">Delivery Charge</th>
                  <th className="px-3 py-3 text-left">Due</th>
                  <th className="px-3 py-3 text-left">Factory Cost</th>
                  <th className="px-3 py-3 text-left">Factory Total</th>
                  <th className="px-3 py-3 text-left">Factory Advance</th>
                  <th className="px-3 py-3 text-left">Factory Due</th>
                  <th className="px-3 py-3 text-left">Profit</th>
                  <th className="px-3 py-3">Delivery Status</th>
                  <th className="px-3 py-3">Design</th>
                  <th className="px-3 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {loading ? (
                  <tr><td colSpan={23} className="py-12 text-center text-muted-foreground">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={23} className="py-12 text-center text-muted-foreground">
                    No orders yet. Click "New Order" to add one.
                  </td></tr>
                ) : (
                  filtered.map((o) => {
                    const revenue = Number(o.quantity) * Number(o.selling_price_per_pcs);
                    return (
                    <tr key={o.id} className="hover:bg-muted/30">
                      <td className="px-3 py-3 font-semibold">#{o.order_number}</td>
                      <td className="px-3 py-3 font-semibold text-muted-foreground">{o.order_date}</td>
                      <td className="px-3 py-3 font-semibold">{o.customer_name}</td>
                      <td className="px-3 py-3 font-semibold text-muted-foreground">
                        {o.phone ? (
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{o.phone}</span>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3 font-semibold">{o.source || "-"}</td>
                      <td className="px-3 py-3 font-semibold">{o.jersey_type || "-"}</td>
                      <td className="px-3 py-3 font-semibold">{o.gsm || "-"}</td>
                      <td className="px-3 py-3 text-left font-semibold">{o.quantity}</td>
                      <td className="px-3 py-3 text-left font-semibold">{o.gift || 0}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.selling_price_per_pcs))}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(revenue)}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.total_amount))}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.advance))}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.delivery_charge))}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={Number(o.due) > 0 ? "font-semibold text-warning" : "text-muted-foreground"}>
                          {fmt(Number(o.due))}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.factory_cost_per_pcs))}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.factory_total))}</td>
                      <td className="px-3 py-3 text-left font-semibold">{fmt(Number(o.factory_advance))}</td>
                      <td className="px-3 py-3 text-left">
                        <span className={Number(o.factory_due) > 0 ? "font-semibold text-warning" : "text-muted-foreground"}>
                          {fmt(Number(o.factory_due))}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-left font-bold text-success">{fmt(Number(o.profit))}</td>
                      <td className="px-3 py-3"><StatusBadge status={o.delivery_status} /></td>
                      <td className="px-3 py-3">
                        {o.design ? (
                          <img 
                            src={o.design} 
                            alt="Design" 
                            className="h-12 w-12 object-cover rounded border border-gray-200" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground font-semibold">-</span>
                        )}
                        {(!o.design || o.design === '') && (
                          <span className="text-muted-foreground font-semibold">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEdit(o)} 
                            disabled={editingId === o.id}
                            className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                          >
                            {editingId === o.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteId(o.id!)} 
                            disabled={deletingId === o.id}
                            className="hover:bg-blue-600 hover:text-white transition-colors duration-200"
                          >
                            {deletingId === o.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
          </>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="max-w-lg mx-4 sm:max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this item?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white hover:shadow-lg transition-all duration-200 ease-in-out font-semibold">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
