"use client";

import React, { forwardRef } from "react";
import MercadoPagoSecureFields from "@components/checkout/mercado-pago-secure-fields";

const publicKey = (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || "").trim();

const PaymentCardElement = forwardRef(function PaymentCardElement(
  { cardError, cart_products, isCheckoutSubmit, register, errors, paymentMethod = "card" },
  ref
) {
  return (
    <div className="my-2">
      <MercadoPagoSecureFields
        ref={ref}
        publicKey={publicKey}
        disabled={isCheckoutSubmit}
      />

      <div className="checkout-form-list mt-20">
        <label>
          Nome impresso no cartão <span className="required">*</span>
        </label>
        <input
          type="text"
          {...register("cardholderName", {
            required:
              paymentMethod === "card"
                ? "Informe o nome como está no cartão"
                : false,
          })}
          placeholder="Ex.: Maria Silva"
          style={{
            width: "100%",
            padding: "12px 15px",
            border: errors?.cardholderName ? "2px solid #dc3545" : "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        {errors?.cardholderName && (
          <p style={{ color: "#dc3545", fontSize: 13, marginTop: 6 }}>
            {errors.cardholderName.message}
          </p>
        )}
      </div>

      <div className="order-button-payment mt-25">
        <button
          type="submit"
          className="tp-btn"
          disabled={cart_products.length === 0 || isCheckoutSubmit || !publicKey}
        >
          {isCheckoutSubmit ? "Processando…" : "Finalizar pagamento"}
        </button>
      </div>
      {!publicKey && (
        <p className="mt-15" style={{ color: "red", fontSize: 14 }}>
          Configure NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY no front-end (.env.local).
        </p>
      )}
      {cardError && (
        <p className="mt-15" style={{ color: "red" }}>
          {cardError}
        </p>
      )}
    </div>
  );
});

export default PaymentCardElement;
