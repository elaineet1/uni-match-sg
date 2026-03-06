import proxySlugs from "@/data/igp-proxy-slugs.json";

const proxySlugSet = new Set<string>(proxySlugs);

// Strict mode is ON by default. Set NEXT_PUBLIC_IGP_STRICT_MODE=0 to disable masking.
export const IGP_STRICT_MODE = process.env.NEXT_PUBLIC_IGP_STRICT_MODE !== "0";

export function isProxyIgpSlug(slug: string): boolean {
  return proxySlugSet.has(slug);
}

export function shouldMaskProxyIgp(slug: string): boolean {
  return IGP_STRICT_MODE && isProxyIgpSlug(slug);
}

