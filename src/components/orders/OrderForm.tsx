import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  design: ""
};

interface Props {
  initial?: Order | null;
  onSaved: () => void;
  onCancel: () => void;
}

const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium text-muted-foreground">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
  </div>
);

export const OrderForm = ({ initial, onSaved, onCancel }: Props) => {
  const [form, setForm] = useState<Order>(initial ?? empty);
  const [designFile, setDesignFile] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initial ?? empty);
  }, [initial]);

  // Auto-calculate derived fields
  useEffect(() => {
    const billable = Math.max(0, (form.quantity || 0) - (form.gift || 0));
    const total_amount = billable * (form.selling_price_per_pcs || 0);
    const due = total_amount + (form.delivery_charge || 0) - (form.advance || 0);
    const factory_total = (form.quantity || 0) * (form.factory_cost_per_pcs || 0);
    const factory_due = factory_total - (form.factory_advance || 0);
    const profit = total_amount - factory_total;
    setForm((f) => ({ ...f, total_amount, due, factory_total, factory_due, profit }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.quantity,
    form.gift,
    form.selling_price_per_pcs,
    form.advance,
    form.delivery_charge,
    form.factory_cost_per_pcs,
    form.factory_advance,
  ]);

  const num = (v: string) => (v === "" ? 0 : Number(v));

  const handleTextChange = (field: keyof Order, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it starts with +880 or 01
    if (digitsOnly.startsWith('880')) {
      return digitsOnly.length === 13; // +880 1XXX-XXXXXX (13 digits with country code)
    } else if (digitsOnly.startsWith('1')) {
      return digitsOnly.length === 10; // 1XXX-XXXXXX (10 digits)
    }
    return false;
  };

  const handleNumberChange = (field: keyof Order, value: string) => {
    setForm((prev) => ({ ...prev, [field]: num(value) }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just store the filename. In production, you'd upload to cloud storage
      const fileName = file.name;
      const fileUrl = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, design: fileUrl }));
      setDesignFile(fileName);
      toast.success(`File "${fileName}" selected`);
    }
  };

  const handleSave = async () => {
    if (!form.order_number.trim() || !form.customer_name.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // Validate phone number if provided
    if (form.phone && !validatePhoneNumber(form.phone)) {
      toast.error("Please enter a valid Bangladeshi phone number (e.g., +880 1XXX-XXXXXX or 01XXX-XXXXXX)");
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
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Customer Information</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Order Number" required>
            <Input value={form.order_number} onChange={(e) => handleTextChange("order_number", e.target.value)} placeholder="01" className="placeholder:text-sm" />
          </Field>
          <Field label="Date" required>
            <Input type="date" value={form.order_date} onChange={(e) => handleTextChange("order_date", e.target.value)} className="text-sm" />
          </Field>
          <Field label="Customer Name" required>
            <Input value={form.customer_name} onChange={(e) => handleTextChange("customer_name", e.target.value)} placeholder="Name (Company)" className="placeholder:text-sm" />
          </Field>
          <Field label="Phone Number" required>
            <Input 
              value={form.phone ?? ""} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              placeholder="+880 1XXX-XXXXXX" 
              className={`placeholder:text-sm ${form.phone && !validatePhoneNumber(form.phone) ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </Field>
          <Field label="Source">
            <Select value={form.source ?? ""} onValueChange={(v) => setForm({ ...form, source: v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Jersey Details</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Jersey Type" required>
            <Select value={form.jersey_type} onValueChange={(v) => setForm({ ...form, jersey_type: v })}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
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
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="140 GSM">140 GSM</SelectItem>
                <SelectItem value="160 GSM">160 GSM</SelectItem>
                <SelectItem value="170 GSM">170 GSM</SelectItem>
                <SelectItem value="180 GSM">180 GSM</SelectItem>
                <SelectItem value="200 GSM">200 GSM</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Quantity (pcs)" required>
            <Input type="number" value={form.quantity} onChange={(e) => handleNumberChange("quantity", e.target.value)} />
          </Field>
          <Field label="Gift (pcs)">
            <Input type="number" value={form.gift} onChange={(e) => handleNumberChange("gift", e.target.value)} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Pricing & Payment</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Selling Price / pcs" required>
            <Input type="number" value={form.selling_price_per_pcs} onChange={(e) => handleNumberChange("selling_price_per_pcs", e.target.value)} />
          </Field>
          <Field label="Total Amount (auto)">
            <Input type="number" value={form.total_amount} readOnly className="bg-muted" />
          </Field>
          <Field label="Advance" required>
            <Input type="number" value={form.advance} onChange={(e) => handleNumberChange("advance", e.target.value)} />
          </Field>
          <Field label="Delivery Charge">
            <Input type="number" value={form.delivery_charge} onChange={(e) => handleNumberChange("delivery_charge", e.target.value)} />
          </Field>
          <Field label="Due (auto)">
            <Input type="number" value={form.due} readOnly className="bg-muted" />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Factory Cost</h3>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Factory Cost / pcs" required>
            <Input type="number" value={form.factory_cost_per_pcs} onChange={(e) => handleNumberChange("factory_cost_per_pcs", e.target.value)} />
          </Field>
          <Field label="Factory Total (auto)">
            <Input type="number" value={form.factory_total} readOnly className="bg-muted" />
          </Field>
          <Field label="Factory Advance" required>
            <Input type="number" value={form.factory_advance} onChange={(e) => handleNumberChange("factory_advance", e.target.value)} />
          </Field>
          <Field label="Factory Due (auto)">
            <Input type="number" value={form.factory_due} readOnly className="bg-muted" />
          </Field>
          <Field label="Profit (auto)">
            <Input type="number" value={form.profit} readOnly className="bg-success/10 font-semibold text-success" />
          </Field>
        </div>
      </section>

      <section>
        <Field label="Design">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <Input 
              type="file" 
              accept="image/*" 
              className="hidden"
              id="design-upload"
              onChange={handleFileUpload}
            />
            <label htmlFor="design-upload" className="cursor-pointer">
              <svg className="w-8 h-8 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {!designFile && <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>}
              {designFile && <p className="text-xs text-blue-600 mb-1">Selected: {designFile}</p>}
              {!designFile && <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>}
            </label>
          </div>
          {form.design && (
            <div className="mt-4 border-2 border-gray-200 rounded-lg p-4 flex justify-center">
              <img 
                src={form.design} 
                alt="Design preview" 
                className="max-w-full h-48 object-contain rounded-md"
              />
            </div>
          )}
        </Field>
      </section>

      <section>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." rows={2} className="placeholder:text-sm" />
        </Field>
      </section>

      <div className="flex justify-center gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white hover:shadow-lg transition-all duration-200 ease-in-out">Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-blue-900 to-black text-white hover:from-blue-800 hover:to-gray-900">
          {form.id ? "Update Order" : "Add Order"}
        </Button>
      </div>
      
      {/* Page-level loader overlay */}
      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            <p className="text-lg font-semibold text-gray-800">
              {form.id ? "Updating Order..." : "Adding Order..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};