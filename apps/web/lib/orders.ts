import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { Order } from "./order";

// Orders are JSON files: Vercel Blob (private) in production, ./data/orders locally.
// A NOWPayments invoice: opened in the pay box, or sent as a link from admin.
export type Payment = {
  provider: "nowpayments"; createdAt: string; status?: string; paidAt?: string; payCurrency?: string; paidAmount?: number;
  invoiceId?: string; invoiceUrl?: string;
};
export type StoredOrder = Order & { id: string; createdAt: string; status?: "awaiting-payment" | "paid" | "in-progress" | "delivered"; termsAccepted?: string; pledge?: boolean; payment?: Payment };

export const isOrderId = (id: unknown): id is string => typeof id === "string" && /^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}$/.test(id);

const blobEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL = path.join(process.cwd(), "data", "orders");

export async function saveOrder(o: StoredOrder) {
  const body = JSON.stringify(o, null, 2);
  if (blobEnabled()) {
    const { put } = await import("@vercel/blob");
    await put(`orders/${o.id}.json`, body, { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true });
    return;
  }
  await fs.mkdir(LOCAL, { recursive: true });
  await fs.writeFile(path.join(LOCAL, `${o.id}.json`), body);
}

export async function getOrder(id: string): Promise<StoredOrder | null> {
  if (!isOrderId(id)) return null;
  if (blobEnabled()) {
    const { get } = await import("@vercel/blob");
    const r = await get(`orders/${id}.json`, { access: "private", useCache: false }).catch(() => null);
    return r && r.statusCode === 200 ? (JSON.parse(await new Response(r.stream).text()) as StoredOrder) : null;
  }
  return JSON.parse(await fs.readFile(path.join(LOCAL, `${id}.json`), "utf8").catch(() => "null"));
}

export async function listOrders(): Promise<StoredOrder[]> {
  let orders: StoredOrder[] = [];
  if (blobEnabled()) {
    const { list, get } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: "orders/", limit: 1000 });
    orders = await Promise.all(
      blobs.map(async (b) => {
        const r = await get(b.pathname, { access: "private", useCache: false });
        return r && r.statusCode === 200 ? (JSON.parse(await new Response(r.stream).text()) as StoredOrder) : null;
      })
    ).then((a) => a.filter((o): o is StoredOrder => !!o));
  } else {
    const files = await fs.readdir(LOCAL).catch(() => [] as string[]);
    orders = await Promise.all(files.filter((f) => f.endsWith(".json")).map(async (f) => JSON.parse(await fs.readFile(path.join(LOCAL, f), "utf8"))));
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
