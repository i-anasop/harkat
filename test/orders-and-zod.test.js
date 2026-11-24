import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { register } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const versionOf = (pkg) => JSON.parse(readFileSync(path.join(root, "node_modules", pkg, "package.json"), "utf8")).version;

test("zod is patched and the blob client still loads", async () => {
  assert.ok(versionOf("zod") >= "4.6.6", versionOf("zod"));
  assert.equal(versionOf("@vercel/cli-config"), "0.4.0");
  assert.equal(versionOf("@vercel/oidc"), "4.0.9");
  const blob = await import("@vercel/blob");
  assert.equal(typeof blob.put, "function");
  assert.equal(typeof blob.get, "function");
  assert.equal(typeof blob.list, "function");
  const oidc = await import("@vercel/oidc");
  assert.equal(typeof oidc.getVercelOidcToken, "function");
});

test("local order storage still writes and reads a private JSON file", async () => {
  await register("./stub-loader.mjs", { parentURL: import.meta.url });
  const dir = await mkdtemp(path.join(tmpdir(), "harkat-orders-"));
  const prev = process.cwd();
  process.chdir(dir);
  delete process.env.BLOB_READ_WRITE_TOKEN;
  try {
    const { saveOrder, getOrder, listOrders } = await import("../apps/web/lib/orders.ts");
    const order = {
      id: "2026-11-23-abcdef01",
      createdAt: "2026-11-23T12:00:00.000Z",
      plan: "launch",
      productName: "Northstar",
      productUrl: "https://northstar.example",
      ratio: "16:9",
      status: "awaiting-payment",
    };
    await saveOrder(order);
    const raw = await readFile(path.join(dir, "data/orders", `${order.id}.json`), "utf8");
    assert.match(raw, /Northstar/);
    assert.equal((await getOrder(order.id)).productName, "Northstar");
    assert.equal(await getOrder("nope"), null);
    const listed = await listOrders();
    assert.equal(listed.length, 1);
    assert.equal(listed[0].id, order.id);
  } finally {
    process.chdir(prev);
    await rm(dir, { recursive: true, force: true });
  }
});
