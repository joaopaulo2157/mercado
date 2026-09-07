export const env = new Proxy(
  {},
  {
    get(_target, property) {
      return globalThis.__CLOUDFLARE_ENV__?.[property];
    },
  },
);
