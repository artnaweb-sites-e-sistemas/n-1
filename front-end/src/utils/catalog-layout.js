/**
 * Produtos com layout editorial do catálogo (estático ou migrados para WooCommerce).
 * Use em vez de `product.source === "catalog"` para comportamentos de página interna.
 */
export function hasCatalogLayout(product) {
  return Boolean(product?.catalogContent && String(product.catalogContent).trim());
}
