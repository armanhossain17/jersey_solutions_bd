import type { Order } from "@/components/orders/OrderForm";

const storageKey = "jersey-solutions-bd-orders";

const wait = () => new Promise((resolve) => setTimeout(resolve, 250));

const readOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
};

const writeOrders = (orders: Order[]) => {
  localStorage.setItem(storageKey, JSON.stringify(orders));
};

const sortOrders = (orders: Order[]) =>
  [...orders].sort((a, b) => {
    const dateCompare = String(b.order_date || "").localeCompare(String(a.order_date || ""));
    if (dateCompare !== 0) return dateCompare;
    return String(a.order_number || "").localeCompare(String(b.order_number || ""));
  });

const createId = () => {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const dummyOrdersApi = {
  async list(): Promise<Order[]> {
    await wait();
    return sortOrders(readOrders());
  },

  async create(order: Order): Promise<Order> {
    await wait();
    const savedOrder = { ...order, id: createId() };
    writeOrders([savedOrder, ...readOrders()]);
    return savedOrder;
  },

  async update(order: Order): Promise<Order> {
    await wait();
    if (!order.id) throw new Error("Missing order ID");

    const orders = readOrders();
    const index = orders.findIndex((item) => item.id === order.id);
    if (index === -1) throw new Error("Order not found");

    const savedOrder = { ...orders[index], ...order };
    orders[index] = savedOrder;
    writeOrders(orders);
    return savedOrder;
  },

  async delete(id: string): Promise<void> {
    await wait();
    writeOrders(readOrders().filter((order) => order.id !== id));
  },
};
