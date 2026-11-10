import test from "node:test";
import assert from "node:assert/strict";
import { legacyCouponQuote } from "./legacy-coupon-quote.mjs";

const request = { couponInfo: { couponCode: "teste" }, cart: [{ originalPrice: 50, orderQuantity: 2, discount: 20 }], shippingCost: 7 };
test("mantém percentual sobre preço promocional e frete sem desconto no plugin antigo", () => {
  const result = legacyCouponQuote({ coupons: [{ code: "teste", amount: 10, discountType: "percent" }] }, request);
  assert.equal(result.discountValue, 8);
  assert.equal(result.totalAmount, 79);
  assert.equal(result.legacy, true);
});
test("mantém desconto fixo e validações antigas durante a atualização", () => {
  assert.equal(legacyCouponQuote({ coupons: [{ code: "teste", amount: 5, discountType: "fixed_cart" }] }, request).totalAmount, 82);
  assert.throws(() => legacyCouponQuote({ coupons: [] }, request));
  assert.throws(() => legacyCouponQuote({ coupons: [{ code: "teste", expiryDate: "2000-01-01" }] }, request));
  assert.throws(() => legacyCouponQuote({ coupons: [{ code: "teste", minimumAmount: 100 }] }, request));
});
