import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { isAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/orders";
import { cryptoEnabled } from "@/lib/nowpayments";
import Dashboard from "./Dashboard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// proxy.ts already 404s anyone without the session cookie; this is a second check.
async function Orders() {
  await connection();
  if (!(await isAdmin())) notFound();
  return <Dashboard orders={await listOrders()} cryptoReady={cryptoEnabled()} />;
}

export default function Admin() {
  return (
    <Suspense fallback={null}>
      <Orders />
    </Suspense>
  );
}
