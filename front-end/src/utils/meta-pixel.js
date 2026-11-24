const PAID_ORDER_STATUSES = new Set(["processing", "completed"]);

export function isPaidOrderStatus(status) {
  if (!status) return false;
  const normalized = String(status).toLowerCase().replace(/^wc-/, "");
  return PAID_ORDER_STATUSES.has(normalized);
}

function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100) / 100;
}

/**
 * Monta o Purchase a partir do pedido já carregado na página.
 * value é o total pago (frete e desconto inclusos).
 */
export function buildPurchasePayload(order) {
  const orderNumber = String(order?.invoice || order?.id || order?._id || "").trim();
  const value = Number(order?.totalAmount);
  if (!orderNumber || !Number.isFinite(value)) return null;

  const cart = Array.isArray(order.cart) ? order.cart : [];
  const productLines = cart.filter((item) => Number(item?.id) > 0);
  const contentIds = productLines.map((item) => String(item.id));
  const contents = productLines.map((item) => ({
    id: String(item.id),
    quantity: Math.max(1, Number(item.orderQuantity) || 1),
    item_price: money(item.price ?? item.originalPrice ?? 0),
  }));
  const numItems = cart.reduce(
    (sum, item) => sum + Math.max(0, Number(item?.orderQuantity) || 0),
    0
  );

  const params = {
    value: money(value),
    currency: "BRL",
    num_items: numItems > 0 ? numItems : productLines.length || 1,
    order_id: orderNumber,
  };

  if (contentIds.length > 0) {
    params.content_ids = contentIds;
    params.content_type = "product";
    params.contents = contents;
  }

  return {
    storageKey: `meta_purchase_${orderNumber}`,
    eventId: `purchase_${orderNumber}`,
    params,
  };
}

/** Dispara um evento do pixel já carregado no layout. Não reinicializa o pixel. */
export function trackMetaEvent(event, params, eventId) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return false;
  }
  if (eventId) {
    window.fbq("track", event, params, { eventID: eventId });
  } else {
    window.fbq("track", event, params);
  }
  return true;
}
