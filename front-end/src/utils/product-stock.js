export const SOLD_OUT_LABEL = "Produto esgotado";

/** Estoque explícito do WooCommerce. Ausência do campo não significa esgotado. */
export function isProductSoldOut(product) {
  return product?.inStock === false;
}
