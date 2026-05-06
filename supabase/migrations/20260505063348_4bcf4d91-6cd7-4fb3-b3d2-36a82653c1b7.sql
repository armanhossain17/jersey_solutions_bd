
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_name TEXT NOT NULL,
  phone TEXT,
  source TEXT,
  jersey_type TEXT,
  gsm TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  gift INTEGER NOT NULL DEFAULT 0,
  selling_price_per_pcs NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  advance NUMERIC NOT NULL DEFAULT 0,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  due NUMERIC NOT NULL DEFAULT 0,
  factory_cost_per_pcs NUMERIC NOT NULL DEFAULT 0,
  factory_total NUMERIC NOT NULL DEFAULT 0,
  factory_advance NUMERIC NOT NULL DEFAULT 0,
  factory_due NUMERIC NOT NULL DEFAULT 0,
  profit NUMERIC NOT NULL DEFAULT 0,
  delivery_status TEXT NOT NULL DEFAULT 'Pending',
  design TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Public can delete orders" ON public.orders FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
