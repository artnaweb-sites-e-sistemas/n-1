import test from "node:test";
import assert from "node:assert/strict";
import { isCouponExpired, findAvailableCoupon } from "./coupon-expiry.mjs";

const now = Date.parse("2026-11-10T12:00:00-03:00");

test("respeita o instante e o fuso da expiração do WooCommerce", () => {
  assert.equal(isCouponExpired({ expiryDate: "2026-11-10T11:59:59-03:00" }, now), true);
  assert.equal(isCouponExpired({ expiryDate: "2026-11-10T15:00:01Z" }, now), false);
  assert.equal(isCouponExpired({ expiresAt: now / 1000 }, now), false);
  assert.equal(isCouponExpired({ expiresAt: now / 1000 }, now + 1), true);
});

test("preserva cupons sem expiração e reconhece cupons salvos antigos", () => {
  assert.equal(isCouponExpired({ expiryDate: null }, now), false);
  assert.equal(isCouponExpired({ endTime: "2026-11-09" }, now), true);
});

test("rejeita cupom expirado, removido ou ausente da resposta atualizada", () => {
  const response = { coupons: [{ code: "teste", expiryDate: "2026-11-09" }] };
  assert.equal(findAvailableCoupon(response, "TESTE", now), undefined);
  assert.equal(findAvailableCoupon({ coupons: [] }, "teste", now), undefined);
});

test("localiza cupom ativo com espaços e diferenças de maiúsculas", () => {
  const coupon = { code: "teste", expiryDate: null };
  assert.equal(findAvailableCoupon({ coupons: [coupon] }, " TESTE ", now), coupon);
});
