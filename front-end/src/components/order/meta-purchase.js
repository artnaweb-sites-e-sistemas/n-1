"use client";

import { useEffect } from "react";
import { buildPurchasePayload, isPaidOrderStatus, trackMetaEvent } from "src/utils/meta-pixel";

const RETRY_MS = 500;
const MAX_ATTEMPTS = 20;

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (_) {
    /* navegador pode bloquear storage */
  }
}

/**
 * Envia Purchase ao pixel quando o pedido já está pago.
 * Uma vez por número de pedido neste navegador.
 */
export default function MetaPurchase({ order }) {
  const orderNumber = order?.invoice || order?.id || order?._id || "";
  const status = order?.status || "";
  const totalAmount = order?.totalAmount;

  useEffect(() => {
    if (!order || !isPaidOrderStatus(status)) return;

    const purchase = buildPurchasePayload(order);
    if (!purchase || storageGet(purchase.storageKey)) return;

    let cancelled = false;
    let attempts = 0;
    let timer = 0;

    const send = () => {
      if (cancelled || storageGet(purchase.storageKey)) return;
      const sent = trackMetaEvent("Purchase", purchase.params, purchase.eventId);
      if (sent) {
        storageSet(purchase.storageKey, "1");
        return;
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        timer = window.setTimeout(send, RETRY_MS);
      }
    };

    send();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [order, orderNumber, status, totalAmount]);

  return null;
}
