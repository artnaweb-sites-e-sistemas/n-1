import { findAvailableCoupon } from "./coupon-expiry.mjs";

// Temporary compatibility only when WordPress explicitly lacks the new route.
// Remove after every environment runs plugin 1.1.0+. This preserves old behavior
// during deployment; complete restrictions require the new plugin.
export function legacyCouponQuote(response, request) {
  const coupon = findAvailableCoupon(response, request.couponInfo?.couponCode);
  if (!coupon) throw new Error("Cupom inválido ou expirado.");
  const subtotal = request.cart.reduce((sum, item) => {
    const price = Number(item.originalPrice ?? item.price ?? 0);
    return sum + price * (1 - Number(item.discount || 0) / 100) * Number(item.orderQuantity || 1);
  }, 0);
  if (subtotal < Number(coupon.minimumAmount || 0)) {
    throw new Error("O carrinho não atingiu o valor mínimo do cupom.");
  }
  const percent = ["percent", "percent_product"].includes(coupon.discountType);
  const discount = Math.min(subtotal, percent ? subtotal * Number(coupon.amount) / 100 : Number(coupon.amount));
  return {
    couponCode: coupon.code || coupon.couponCode,
    discountValue: Number(discount.toFixed(2)),
    subTotal: Number(subtotal.toFixed(2)),
    totalAmount: Number((subtotal - discount + Number(request.shippingCost || 0)).toFixed(2)),
    expiresAt: coupon.expiresAt,
    endTime: coupon.expiryDate || coupon.endTime || null,
    legacy: true,
  };
}
