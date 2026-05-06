import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calculator, Factory, Loader2, Save, Shirt, Upload, UserRound, WalletCards, X } from "lucide-react";

export type Order = {
  id?: string;
  order_number: string;
  order_date: string;
  customer_name: string;
  phone: string | null;
  source: string | null;
  jersey_type: string | null;
  gsm: string | null;
  quantity: number;
  gift: number;
  selling_price_per_pcs: number;
  total_amount: number;
  advance: number;
  delivery_charge: number;
  due: number;
  factory_cost_per_pcs: number;
  factory_total: number;
  factory_advance: number;
  factory_due: number;
  profit: number;
  delivery_status: string;
  design: string | null;
};

const empty: Order = {
  order_number: "",
  order_date: new Date().toISOString().slice(0, 10),
  customer_name: "",
  phone: "",
  source: "Facebook Page",
  jersey_type: "PP",
  gsm: "170 GSM",
  quantity: 0,
  gift: 0,
  selling_price_per_pcs: 0,
  total_amount: 0,
  advance: 0,
  delivery_charge: 0,
  due: 0,
  factory_cost_per_pcs: 0,
  factory_total: 0,
  factory_advance: 0,
  factory_due: 0,
  profit: 0,
  delivery_status: "Pending",
  design: "",
};

interface Props {
  initial?: Order | null;
  onSaved: () => void;
  onCancel: () => void;
}

const fmt = (n: number) => `BDT ${Number(n || 0).toLocaleString("en-BD")}`;
const num = (v: string) => (v === "" ? 0 : Number(v));

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold uppercase text-muted-foreground">
      {label}
      {required && <span className="ml-1 text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

const SectionTitle = ({ icon: Icon, title, iconClass }: { icon: React.ElementType; title: string; iconClass: string }) => (
  <div className="mb-4 flex items-center gap-2">
    <div className={`flex h-9 w-9 items-center justify-center rounded-md ${iconClass}`}>
      <Icon className="h-4 w-4" />
    </div>
    <h3 className="text-sm font-bold uppercase text-foreground">{title}</h3>
  </div>
);

const SummaryItem = ({ label, value, tone }: { label: string; value: string; tone?: string }) => (
  <div className="flex items-center justify-between gap-3 border-b border-border/70 py-3 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-right text-sm font-bold ${tone ?? "text-foreground"}`}>{value}</span>
  </div>
);

export const OrderForm = ({ initial, onSaved, onCancel }: Props) => {
  const [form, setForm] = useState<Order>(initial ?? empty);
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ?? empty);
  }, [initial]);

  useEffect(() => {
    const billable = Math.max(0, (form.quantity || 0) - (form.gift || 0));
    const total_amount = billable * (form.selling_price_per_pcs || 0);
    const due = total_amount + (form.delivery_charge || 0) - (form.advance || 0);
    const factory_total = (form.quantity || 0) * (form.factory_cost_per_pcs || 0);
    const factory_due = factory_total - (form.factory_advance || 0);
    const profit = total_amount - factory_total;
    setForm((f) => ({ ...f, total_amount, due, factory_total, factory_due, profit }));
  }, [
    form.quantity,
    form.gift,
    form.selling_price_per_pcs,
    form.advance,
    form.delivery_charge,
    form.factory_cost_per_pcs,
    form.factory_advance,
  ]);

  const validatePhoneNumber = (phone: string) => {
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.startsWith("880")) return digitsOnly.length === 13;
    if (digitsOnly.startsWith("01")) return digitsOnly.length === 11;
    if (digitsOnly.startsWith("1")) return digitsOnly.length === 10;
    return false;
  };

  const handleTextChange = (field: keyof Order, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Order, value: string) => {
    setForm((prev) => ({ ...prev, [field]: num(value) }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, design: fileUrl }));
    setDesignFile(file.name);
    toast.success(`File "${file.name}" selected`);
  };

  const handleSave = async () => {
    if (!form.order_number.trim() || !form.customer_name.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.phone && !validatePhoneNumber(form.phone)) {
      toast.error("Please enter a valid Bangladeshi phone number");
      return;
    }

    setSaving(true);
    const payload = { ...form, phone: form.phone || null, design: form.design || null };
    const { error } = form.id
      ? await supabase.from("orders").update(payload).eq("id", form.id)
      : await supabase.from("orders").insert([payload]);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(form.id ? "Order updated" : "Order added");
    onSaved();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/80 border-l-4 border-l-primary bg-card p-4 shadow-[var(--shadow-card)]">
          <SectionTitle icon={UserRound} title="Customer" iconClass="bg-primary/10 text-primary" />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Order Number" required>
              <Input value={form.order_number} onChange={(e) => handleTextChange("order_number", e.target.value)} placeholder="01" />
            </Field>
            <Field label="Date" required>
              <Input type="date" value={form.order_date} onChange={(e) => handleTextChange("order_date", e.target.value)} />
            </Field>
            <Field label="Customer Name" required>
              <Input value={form.customer_name} onChange={(e) => handleTextChange("customer_name", e.target.value)} placeholder="Name or company" />
            </Field>
            <Field label="Phone Number" required>
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+880 1XXX-XXXXXX"
                className={form.phone && !validatePhoneNumber(form.phone) ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </Field>
            <Field label="Source">
              <Select value={form.source ?? ""} onValueChange={(v) => setForm({ ...form, source: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facebook Page">Facebook Page</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Delivery Status" required>
              <Select value={form.delivery_status} onValueChange={(v) => setForm({ ...form, delivery_status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Ready">Ready</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border/80 border-l-4 border-l-info bg-card p-4 shadow-[var(--shadow-card)]">
          <SectionTitle icon={Shirt} title="Jersey Details" iconClass="bg-info/10 text-info" />
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Jersey Type" required>
              <Select value={form.jersey_type ?? ""} onValueChange={(v) => setForm({ ...form, jersey_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PP">PP</SelectItem>
                  <SelectItem value="Box Mash">Box Mash</SelectItem>
                  <SelectItem value="Leaf Jacquard">Leaf Jacquard</SelectItem>
                  <SelectItem value="Spoon Jacquard">Spoon Jacquard</SelectItem>
                  <SelectItem value="Nike">Nike</SelectItem>
                  <SelectItem value="Honeycomb">Honeycomb</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="GSM">
              <Select value={form.gsm ?? ""} onValueChange={(v) => setForm({ ...form, gsm: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="140 GSM">140 GSM</SelectItem>
                  <SelectItem value="160 GSM">160 GSM</SelectItem>
                  <SelectItem value="170 GSM">170 GSM</SelectItem>
                  <SelectItem value="180 GSM">180 GSM</SelectItem>
                  <SelectItem value="200 GSM">200 GSM</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantity" required>
              <Input type="number" value={form.quantity} onChange={(e) => handleNumberChange("quantity", e.target.value)} />
            </Field>
            <Field label="Gift">
              <Input type="number" value={form.gift} onChange={(e) => handleNumberChange("gift", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border/80 border-l-4 border-l-success bg-card p-4 shadow-[var(--shadow-card)]">
          <SectionTitle icon={WalletCards} title="Pricing & Payment" iconClass="bg-success/10 text-success" />
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Selling Price / pcs" required>
              <Input type="number" value={form.selling_price_per_pcs} onChange={(e) => handleNumberChange("selling_price_per_pcs", e.target.value)} />
            </Field>
            <Field label="Total Amount">
              <Input type="number" value={form.total_amount} readOnly className="bg-muted font-semibold" />
            </Field>
            <Field label="Advance" required>
              <Input type="number" value={form.advance} onChange={(e) => handleNumberChange("advance", e.target.value)} />
            </Field>
            <Field label="Delivery Charge">
              <Input type="number" value={form.delivery_charge} onChange={(e) => handleNumberChange("delivery_charge", e.target.value)} />
            </Field>
            <Field label="Due">
              <Input type="number" value={form.due} readOnly className="bg-muted font-semibold" />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border/80 border-l-4 border-l-warning bg-card p-4 shadow-[var(--shadow-card)]">
          <SectionTitle icon={Factory} title="Factory Cost" iconClass="bg-warning/10 text-warning" />
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Factory Cost / pcs" required>
              <Input type="number" value={form.factory_cost_per_pcs} onChange={(e) => handleNumberChange("factory_cost_per_pcs", e.target.value)} />
            </Field>
            <Field label="Factory Total">
              <Input type="number" value={form.factory_total} readOnly className="bg-muted font-semibold" />
            </Field>
            <Field label="Factory Advance" required>
              <Input type="number" value={form.factory_advance} onChange={(e) => handleNumberChange("factory_advance", e.target.value)} />
            </Field>
            <Field label="Factory Due">
              <Input type="number" value={form.factory_due} readOnly className="bg-muted font-semibold" />
            </Field>
            <Field label="Profit">
              <Input type="number" value={form.profit} readOnly className="bg-success/10 font-bold text-success" />
            </Field>
          </div>
        </section>

        <section className="rounded-lg border border-border/80 border-l-4 border-l-primary bg-card p-4 shadow-[var(--shadow-card)]">
          <SectionTitle icon={Upload} title="Design" iconClass="bg-primary/10 text-primary" />
          <Input type="file" accept="image/*" className="hidden" id="design-upload" onChange={handleFileUpload} />
          <label
            htmlFor="design-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/35 p-6 text-center transition hover:border-primary hover:bg-secondary"
          >
            <Upload className="mb-3 h-8 w-8 text-primary" />
            <span className="text-sm font-semibold">{designFile ? designFile : "Upload design image"}</span>
            <span className="mt-1 text-xs text-muted-foreground">PNG, JPG, or GIF</span>
          </label>
          {form.design && (
            <div className="mt-4 rounded-lg border border-border bg-white p-3">
              <img src={form.design} alt="Design preview" className="mx-auto h-48 max-w-full rounded-md object-contain" />
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-[var(--shadow-card)]">
          <div className="border-b border-border bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Order Summary</h3>
            </div>
          </div>
          <div className="p-4">
          <div className="rounded-md bg-secondary/60 px-3">
          <SummaryItem label="Billable pcs" value={`${Math.max(0, form.quantity - form.gift)} pcs`} />
          <SummaryItem label="Customer total" value={fmt(form.total_amount)} />
          <SummaryItem label="Customer due" value={fmt(form.due)} tone={form.due > 0 ? "text-warning" : "text-muted-foreground"} />
          <SummaryItem label="Factory total" value={fmt(form.factory_total)} />
          <SummaryItem label="Factory due" value={fmt(form.factory_due)} tone={form.factory_due > 0 ? "text-warning" : "text-muted-foreground"} />
          <SummaryItem label="Profit" value={fmt(form.profit)} tone="text-success" />
          </div>

          <div className="mt-5 grid gap-2">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {form.id ? "Update Order" : "Add Order"}
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={saving} className="w-full">
              <X className="h-4 w-4" />
              Cancel
            </Button>
          </div>
          </div>
        </div>
      </aside>

      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45">
          <div className="flex min-w-[220px] flex-col items-center gap-4 rounded-lg bg-card p-6 shadow-[var(--shadow-elegant)]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-semibold">{form.id ? "Updating order..." : "Adding order..."}</p>
          </div>
        </div>
      )}
    </div>
  );
};
