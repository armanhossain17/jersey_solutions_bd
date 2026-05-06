import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { OrderForm, type Order } from "@/components/orders/OrderForm";

const NewOrder = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editOrder = location.state?.editOrder as Order | null;
  const isEditing = !!editOrder;

  const handleSaved = () => {
    navigate("/");
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-blue-900 to-black text-white shadow-[var(--shadow-elegant)]">
        <div className="container flex items-center gap-4 py-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCancel}
            className="text-white border-white bg-transparent hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Order" : "Create New Order"}</h1>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card className="max-w-4xl mx-auto p-6 shadow-[var(--shadow-card)]">
          <OrderForm
            initial={editOrder}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </Card>
      </main>
    </div>
  );
};

export default NewOrder;
