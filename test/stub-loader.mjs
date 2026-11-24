import { pathToFileURL } from "node:url";

const stub = new URL("./server-only-stub.mjs", import.meta.url);

export async function resolve(specifier, context, next) {
  if (specifier === "server-only") return { url: stub.href, shortCircuit: true };
  return next(specifier, context);
}
