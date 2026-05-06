import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-background pb-6">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 text-foreground shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={goHome}
            className="h-11 w-11 rounded-2xl"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Order workspace</p>
            <h1 className="truncate text-lg font-bold">{isEditing ? `Edit #${editOrder.order_number}` : "Create New Order"}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        <OrderForm initial={editOrder} onSaved={goHome} onCancel={goHome} />
      </main>
    </div>
  );
};

export default NewOrder;
