/**
 * Generate a URL-friendly slug from a product name and optional product_code.
 * Prefers product_code if available, otherwise slugifies the English name.
 */
export function productSlug(product: { product_code?: string | null; name_en: string; id: string }): string {
  if (product.product_code) {
    return encodeURIComponent(product.product_code);
  }
  // Slugify the English name
  const slug = product.name_en
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || product.id;
}

/**
 * Check if a string looks like a UUID.
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
