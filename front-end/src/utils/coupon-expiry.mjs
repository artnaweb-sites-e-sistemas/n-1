// WooCommerce usa o instante de expiração, incluindo o fuso configurado na loja.
export function isCouponExpired(coupon, now = Date.now()) {
  const expiry = coupon?.expiresAt != null
    ? Number(coupon.expiresAt) * 1000
    : Date.parse(coupon?.expiryDate || coupon?.endTime || "");
  return Number.isFinite(expiry) && now > expiry;
}

export function findAvailableCoupon(response, code, now = Date.now()) {
  const coupons = Array.isArray(response)
    ? response
    : response?.coupons || response?.data?.coupons || [];
  return coupons.find((coupon) =>
    String(coupon.code || coupon.couponCode || "").toLowerCase() === String(code).trim().toLowerCase()
    && !isCouponExpired(coupon, now)
  );
}
