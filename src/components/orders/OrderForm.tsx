import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { dummyOrdersApi } from "@/lib/dummy-orders-api";
import { cn } from "@/lib/utils";

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
  trouser_type: string | null;
  trouser_gsm: string | null;
  trouser_quantity: number;
  trouser_selling_price_per_pcs: number;
  selling_price_per_pcs: number;
  total_amount: number;
  advance: number;
  delivery_charge: number;
  due: number;
  factory_cost_per_pcs: number;
  trouser_factory_cost_per_pcs: number;
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
  source: "Known Person",
  jersey_type: "PP",
  gsm: "170 GSM",
  quantity: 0,
  gift: 0,
  trouser_type: "PP",
  trouser_gsm: "170 GSM",
  trouser_quantity: 0,
  trouser_selling_price_per_pcs: 0,
  selling_price_per_pcs: 0,
  total_amount: 0,
  advance: 0,
  delivery_charge: 0,
  due: 0,
  factory_cost_per_pcs: 0,
  trouser_factory_cost_per_pcs: 0,
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
  <div className="min-w-0 space-y-1.5">
    <Label className="break-words text-xs font-semibold uppercase leading-tight text-muted-foreground">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </Label>
    {children}
  </div>
);

const editableNumberValue = (value: number) => (Number(value || 0) === 0 ? "" : value);
const sourceOptions = [
  "Known Person",
  "Junior",
  "Friend",
  "Referral",
  "Repeat Customer",
  "Direct Call",
  "WhatsApp",
  "Facebook Page",
  "Instagram",
  "Other",
];
const statusOptions = ["Pending", "In Progress", "Ready", "Delivered", "Cancelled"];
const jerseyTypeOptions = [
  "None",
  "PP",
  "Box Mash",
  "Leaf Jacquard",
  "Spoon Jacquard",
  "Nike",
  "Honeycomb",
  "Dri-Fit",
  "Dot Knit",
  "Mesh",
  "Interlock",
  "Lycra",
  "Microfiber",
  "Polyester",
  "PK",
  "PC",
  "Cotton",
  "China Fabric",
  "Thai Fabric",
  "Sublimation",
  "Other",
];
const trouserTypeOptions = ["None", "PP", "Box Mash", "Dri-Fit", "Mesh", "Interlock", "Lycra", "Polyester", "Cotton", "Other"];
const gsmOptions = [
  "None",
  "120 GSM",
  "130 GSM",
  "140 GSM",
  "150 GSM",
  "160 GSM",
  "170 GSM",
  "180 GSM",
  "190 GSM",
  "200 GSM",
  "220 GSM",
  "240 GSM",
  "250 GSM",
  "260 GSM",
  "280 GSM",
  "300 GSM",
  "320 GSM",
  "350 GSM",
  "400 GSM",
];
const pad2 = (value: number | string) => String(value).padStart(2, "0");

const SearchableSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  searchPlaceholder = "Search option",
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 w-full justify-between rounded-2xl px-3 text-left text-base font-normal hover:!bg-background hover:!text-foreground sm:text-sm"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="text-base sm:text-sm" />
          <CommandList>
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "py-3 text-base sm:text-sm",
                    value === option && "bg-primary text-primary-foreground"
                  )}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === option ? "opacity-100" : "opacity-0")} />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const getDateParts = (value: string) => {
  const [year, month, day] = (value || new Date().toISOString().slice(0, 10)).split("-");
  return {
    year: year || String(new Date().getFullYear()),
    month: month || pad2(new Date().getMonth() + 1),
    day: day || pad2(new Date().getDate()),
  };
};

const getDaysInMonth = (year: string, month: string) => new Date(Number(year), Number(month), 0).getDate();

const DateSelect = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const parts = getDateParts(value);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, index) => String(currentYear - 5 + index));
  const months = Array.from({ length: 12 }, (_, index) => pad2(index + 1));
  const days = Array.from({ length: getDaysInMonth(parts.year, parts.month) }, (_, index) => pad2(index + 1));

  const updateDate = (next: Partial<typeof parts>) => {
    const nextParts = { ...parts, ...next };
    const maxDay = getDaysInMonth(nextParts.year, nextParts.month);
    const safeDay = pad2(Math.min(Number(nextParts.day), maxDay));
    onChange(`${nextParts.year}-${nextParts.month}-${safeDay}`);
  };

  return (
    <div className="grid grid-cols-[1fr_1fr_1.35fr] gap-2">
      <Select value={parts.day} onValueChange={(day) => updateDate({ day })}>
        <SelectTrigger className="h-12 min-w-0 rounded-2xl px-3 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {days.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={parts.month} onValueChange={(month) => updateDate({ month })}>
        <SelectTrigger className="h-12 min-w-0 rounded-2xl px-3 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {months.map((month) => <SelectItem key={month} value={month}>{month}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={parts.year} onValueChange={(year) => updateDate({ year })}>
        <SelectTrigger className="h-12 min-w-0 rounded-2xl px-3 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};

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
    const jerseyBillable = Math.max(0, (form.quantity || 0) - (form.gift || 0));
    const jerseyTotal = jerseyBillable * (form.selling_price_per_pcs || 0);
    const trouserTotal = (form.trouser_quantity || 0) * (form.trouser_selling_price_per_pcs || 0);
    const total_amount = jerseyTotal + trouserTotal;
    const due = total_amount + (form.delivery_charge || 0) - (form.advance || 0);
    const factory_total =
      (form.quantity || 0) * (form.factory_cost_per_pcs || 0) +
      (form.trouser_quantity || 0) * (form.trouser_factory_cost_per_pcs || 0);
    const factory_due = factory_total - (form.factory_advance || 0);
    const profit = total_amount - factory_total;
    setForm((f) => ({ ...f, total_amount, due, factory_total, factory_due, profit }));
  }, [
    form.quantity,
    form.gift,
    form.selling_price_per_pcs,
    form.trouser_quantity,
    form.trouser_selling_price_per_pcs,
    form.advance,
    form.delivery_charge,
    form.factory_cost_per_pcs,
    form.trouser_factory_cost_per_pcs,
    form.factory_advance,
  ]);

  const num = (v: string) => (v === "" ? 0 : Number(v));

  const handleTextChange = (field: keyof Order, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Accept local BD format (01...) or country-code format (+8801...).
    if (digitsOnly.startsWith('880')) {
      return digitsOnly.length === 13;
    } else if (digitsOnly.startsWith('01')) {
      return digitsOnly.length === 11;
    } else if (digitsOnly.startsWith('1')) {
      return digitsOnly.length === 10;
    }
    return false;
  };

  const handleNumberChange = (field: keyof Order, value: string) => {
    setForm((prev) => ({ ...prev, [field]: num(value) }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileName = file.name;
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      if (file.size > 1024 * 1024) {
        toast.error("Image must be 1MB or smaller for local storage");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, design: String(reader.result || "") }));
        setDesignFile(fileName);
        toast.success(`File "${fileName}" selected`);
      };
      reader.onerror = () => {
        toast.error("Could not read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.order_number.trim() || !form.customer_name.trim()) {
      toast.error("Please fill all required fields");
      return;
    }
    
    // Validate phone number if provided
    if (form.phone && !validatePhoneNumber(form.phone)) {
      toast.error("Please enter a valid Bangladeshi phone number");
      return;
    }
    
    setSaving(true);
    const payload = { ...form, phone: form.phone || null, design: form.design || null };
    try {
      if (form.id) await dummyOrdersApi.update(payload);
      else await dummyOrdersApi.create(payload);
      toast.success(form.id ? "Order updated" : "Order added");
      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save order";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <h3 className="mb-4 text-base font-bold leading-tight text-foreground">Customer Information</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-3 [&_button]:h-12 [&_button]:min-w-0 [&_button]:rounded-2xl [&_input]:h-12 [&_input]:min-w-0 [&_input]:rounded-2xl">
          <Field label="Order Number" required>
            <Input value={form.order_number} onChange={(e) => handleTextChange("order_number", e.target.value)} placeholder="Enter order number" className="placeholder:text-sm" />
          </Field>
          <Field label="Date" required>
            <DateSelect value={form.order_date} onChange={(value) => handleTextChange("order_date", value)} />
          </Field>
          <Field label="Customer Name" required>
            <Input value={form.customer_name} onChange={(e) => handleTextChange("customer_name", e.target.value)} placeholder="Enter customer name" className="placeholder:text-sm" />
          </Field>
          <Field label="Phone Number" required>
            <Input 
              value={form.phone ?? ""} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })} 
              placeholder="Enter phone number" 
              className={`placeholder:text-sm ${form.phone && !validatePhoneNumber(form.phone) ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </Field>
          <Field label="Source">
            <SearchableSelect value={form.source ?? ""} onChange={(v) => setForm({ ...form, source: v })} options={sourceOptions} searchPlaceholder="Search source" />
          </Field>
          <Field label="Delivery Status" required>
            <SearchableSelect value={form.delivery_status} onChange={(v) => setForm({ ...form, delivery_status: v })} options={statusOptions} searchPlaceholder="Search status" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <h3 className="mb-4 text-base font-bold leading-tight text-foreground">Jersey Details</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-4 [&_button]:h-12 [&_button]:min-w-0 [&_button]:rounded-2xl [&_input]:h-12 [&_input]:min-w-0 [&_input]:rounded-2xl">
          <Field label="Jersey Type">
            <SearchableSelect value={form.jersey_type ?? ""} onChange={(v) => setForm({ ...form, jersey_type: v })} options={jerseyTypeOptions} searchPlaceholder="Search jersey type" />
          </Field>
          <Field label="GSM">
            <SearchableSelect value={form.gsm ?? ""} onChange={(v) => setForm({ ...form, gsm: v })} options={gsmOptions} searchPlaceholder="Search GSM" />
          </Field>
          <Field label="Quantity (pcs)">
            <Input type="number" value={editableNumberValue(form.quantity)} onChange={(e) => handleNumberChange("quantity", e.target.value)} placeholder="Enter quantity" />
          </Field>
          <Field label="Selling Price / pcs">
            <Input type="number" value={editableNumberValue(form.selling_price_per_pcs)} onChange={(e) => handleNumberChange("selling_price_per_pcs", e.target.value)} placeholder="Enter selling price" />
          </Field>
          <Field label="Gift (pcs)">
            <Input type="number" value={editableNumberValue(form.gift)} onChange={(e) => handleNumberChange("gift", e.target.value)} placeholder="Enter gift quantity" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <h3 className="mb-4 text-base font-bold leading-tight text-foreground">Trouser Details</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-3 [&_button]:h-12 [&_button]:min-w-0 [&_button]:rounded-2xl [&_input]:h-12 [&_input]:min-w-0 [&_input]:rounded-2xl">
          <Field label="Trouser Type">
            <SearchableSelect value={form.trouser_type ?? "PP"} onChange={(v) => setForm({ ...form, trouser_type: v })} options={trouserTypeOptions} searchPlaceholder="Search trouser type" />
          </Field>
          <Field label="Trouser GSM">
            <SearchableSelect value={form.trouser_gsm ?? "170 GSM"} onChange={(v) => setForm({ ...form, trouser_gsm: v })} options={gsmOptions} searchPlaceholder="Search trouser GSM" />
          </Field>
          <Field label="Trouser Quantity">
            <Input type="number" value={editableNumberValue(form.trouser_quantity)} onChange={(e) => handleNumberChange("trouser_quantity", e.target.value)} placeholder="Enter trouser quantity" />
          </Field>
          <Field label="Selling Price / pcs">
            <Input type="number" value={editableNumberValue(form.trouser_selling_price_per_pcs)} onChange={(e) => handleNumberChange("trouser_selling_price_per_pcs", e.target.value)} placeholder="Enter selling price" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <h3 className="mb-4 text-base font-bold leading-tight text-foreground">Pricing & Payment</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-4 [&_input]:h-12 [&_input]:min-w-0 [&_input]:rounded-2xl">
          <Field label="Total Amount (auto)">
            <Input type="number" value={form.total_amount} readOnly className="bg-muted" />
          </Field>
          <Field label="Advance" required>
            <Input type="number" value={editableNumberValue(form.advance)} onChange={(e) => handleNumberChange("advance", e.target.value)} placeholder="Enter advance amount" />
          </Field>
          <Field label="Delivery Charge">
            <Input type="number" value={editableNumberValue(form.delivery_charge)} onChange={(e) => handleNumberChange("delivery_charge", e.target.value)} placeholder="Enter delivery charge" />
          </Field>
          <Field label="Due (auto)">
            <Input type="number" value={form.due} readOnly className="bg-muted" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <h3 className="mb-4 text-base font-bold leading-tight text-foreground">Factory Cost</h3>
        <div className="grid min-w-0 gap-4 md:grid-cols-4 [&_input]:h-12 [&_input]:min-w-0 [&_input]:rounded-2xl">
          <Field label="Jersey Cost / pcs" required>
            <Input type="number" value={editableNumberValue(form.factory_cost_per_pcs)} onChange={(e) => handleNumberChange("factory_cost_per_pcs", e.target.value)} placeholder="Enter jersey cost" />
          </Field>
          <Field label="Trouser Cost / pcs">
            <Input type="number" value={editableNumberValue(form.trouser_factory_cost_per_pcs)} onChange={(e) => handleNumberChange("trouser_factory_cost_per_pcs", e.target.value)} placeholder="Enter trouser cost" />
          </Field>
          <Field label="Factory Total (auto)">
            <Input type="number" value={form.factory_total} readOnly className="bg-muted" />
          </Field>
          <Field label="Factory Advance" required>
            <Input type="number" value={editableNumberValue(form.factory_advance)} onChange={(e) => handleNumberChange("factory_advance", e.target.value)} placeholder="Enter factory advance" />
          </Field>
          <Field label="Factory Due (auto)">
            <Input type="number" value={form.factory_due} readOnly className="bg-muted" />
          </Field>
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <Field label="Profit">
          <div className="rounded-3xl border border-success/20 bg-success/10 p-4">
            <p className="break-words text-2xl font-black leading-tight text-success">
              BDT {Number(form.profit || 0).toLocaleString("en-BD")}
            </p>
          </div>
        </Field>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <Field label="Design">
          <div className="cursor-pointer rounded-3xl border-2 border-dashed border-border bg-secondary/60 p-4 text-center transition-colors hover:border-primary sm:p-6">
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
              {!designFile && <p className="text-sm text-gray-600 mb-1">Tap to upload design</p>}
              {designFile && <p className="break-words text-xs text-blue-600 mb-1">Selected: {designFile}</p>}
              {!designFile && <p className="text-xs text-gray-500">PNG, JPG, GIF up to 1MB</p>}
            </label>
          </div>
          {form.design && (
            <div className="mt-4 flex justify-center rounded-2xl border-2 border-gray-200 p-3 sm:p-4">
              <img 
                src={form.design} 
                alt="Design preview" 
                className="h-40 max-w-full rounded-md object-contain sm:h-48"
              />
            </div>
          )}
        </Field>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter order notes" rows={3} className="rounded-2xl placeholder:text-sm" />
        </Field>
      </section>

      <div className="grid grid-cols-[96px_1fr] gap-2 rounded-3xl bg-background/95 p-2 shadow-[var(--shadow-elegant)] backdrop-blur sm:sticky sm:bottom-4 sm:grid-cols-[120px_1fr]">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="h-12 rounded-2xl font-bold hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground">Cancel</Button>
        <Button onClick={handleSave} disabled={saving} className="h-12 rounded-2xl gap-2 font-bold shadow-[var(--shadow-elegant)] sm:shadow-none">
          {!form.id && <Plus className="h-5 w-5" />}
          {form.id ? "Update Order" : "Add Order"}
        </Button>
      </div>
      
      {/* Page-level loader overlay */}
      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="flex w-full max-w-xs flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
            <p className="text-base font-semibold text-gray-800 sm:text-lg">
              {form.id ? "Updating Order..." : "Adding Order..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
