import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { OrderForm, type Order } from "@/components/orders/OrderForm";

const NewOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editOrder = location.state?.editOrder as Order | null;
  const isEditing = !!editOrder;

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container flex items-center justify-between gap-4 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="outline" size="icon" onClick={goHome} aria-label="Back to dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-muted-foreground">Order workspace</p>
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                {isEditing ? `Edit order #${editOrder.order_number}` : "Create new order"}
              </h1>
            </div>
          </div>
          <div className="hidden h-11 w-11 items-center justify-center rounded-md bg-primary/10 sm:flex">
            <ClipboardList className="h-5 w-5 text-primary" />
          </div>
        </div>
      </header>

      <main className="container py-6">
        <Card className="mx-auto max-w-6xl border-border/80 bg-card p-4 shadow-[var(--shadow-card)] sm:p-6">
          <OrderForm initial={editOrder} onSaved={goHome} onCancel={goHome} />
        </Card>
      </main>
    </div>
  );
};

export default NewOrder;
