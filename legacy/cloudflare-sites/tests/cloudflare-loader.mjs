const cloudflareShim = new URL(
  "./cloudflare-workers-shim.mjs",
  import.meta.url,
);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "cloudflare:workers") {
    return { url: cloudflareShim.href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
