"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

function loadMercadoPagoSdk() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://sdk.mercadopago.com/js/v2"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

/**
 * Campos seguros Mercado Pago (checkout transparente).
 * expõe ref.createToken({ cardholderName, identificationType, identificationNumber })
 */
const MercadoPagoSecureFields = forwardRef(function MercadoPagoSecureFields(
  { publicKey, disabled, amount = 0 },
  ref
) {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState("");
  const [bin, setBin] = useState("");
  const [installmentOptions, setInstallmentOptions] = useState([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const mpRef = useRef(null);
  const fieldsRef = useRef({ cardNumber: null, expirationDate: null, securityCode: null });
  const selectionRef = useRef({ installments: 1 });

  useEffect(() => {
    if (!publicKey) {
      setInitError("Chave pública do Mercado Pago não configurada (NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY).");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await loadMercadoPagoSdk();
        if (cancelled) return;
        const MercadoPago = window.MercadoPago;
        if (!MercadoPago) {
          setInitError("Não foi possível carregar o SDK do Mercado Pago.");
          return;
        }

        const mp = new MercadoPago(publicKey, { locale: "pt-BR" });
        mpRef.current = mp;

        const cardNumber = mp.fields
          .create("cardNumber", { placeholder: "Número do cartão" })
          .mount("mp-form-card-number");

        const expirationDate = mp.fields
          .create("expirationDate", { placeholder: "MM/AA" })
          .mount("mp-form-expiration");

        const securityCode = mp.fields
          .create("securityCode", { placeholder: "CVV" })
          .mount("mp-form-cvv");

        fieldsRef.current = { cardNumber, expirationDate, securityCode };
        try {
          cardNumber.on("binChange", (data) => {
            const nextBin = String(data?.bin || "").replace(/\D/g, "");
            setBin(nextBin.length >= 6 ? nextBin : "");
          });
        } catch (binError) {
          console.error("[MP] parcelas", binError);
        }
        setReady(true);
      } catch (e) {
        console.error("[MP] init", e);
        if (!cancelled) setInitError("Erro ao inicializar campos do cartão.");
      }
    })();

    return () => {
      cancelled = true;
      try {
        fieldsRef.current.cardNumber?.unmount?.();
        fieldsRef.current.expirationDate?.unmount?.();
        fieldsRef.current.securityCode?.unmount?.();
      } catch (_) {
        /* ignore */
      }
      fieldsRef.current = { cardNumber: null, expirationDate: null, securityCode: null };
      mpRef.current = null;
      setBin("");
    };
  }, [publicKey]);

  useEffect(() => {
    const mp = mpRef.current;
    const orderAmount = Number(amount);
    if (!ready || !mp || !bin || !(orderAmount > 0) || typeof mp.getInstallments !== "function") {
      setInstallmentOptions([]);
      selectionRef.current = { installments: 1 };
      setSelectedInstallments(1);
      return undefined;
    }

    let cancelled = false;
    setInstallmentsLoading(true);
    mp.getInstallments({
      amount: orderAmount.toFixed(2),
      bin,
      paymentTypeId: "credit_card",
    })
      .then((result) => {
        if (cancelled) return;
        const list = Array.isArray(result) ? result : [];
        const credit = list.find((item) => item?.payment_type_id === "credit_card") || list[0];
        const costs = Array.isArray(credit?.payer_costs) ? credit.payer_costs : [];
        setInstallmentOptions(costs);
        const current = Number(selectionRef.current.installments) || 1;
        const next = costs.find((cost) => Number(cost.installments) === current)
          || costs.find((cost) => Number(cost.installments) === 1)
          || costs[0];
        const count = Number(next?.installments) || 1;
        selectionRef.current = { installments: count };
        setSelectedInstallments(count);
      })
      .catch(() => {
        if (cancelled) return;
        setInstallmentOptions([]);
        selectionRef.current = { installments: 1 };
        setSelectedInstallments(1);
      })
      .finally(() => {
        if (!cancelled) setInstallmentsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, bin, amount]);

  useImperativeHandle(ref, () => ({
    async createToken({ cardholderName, identificationType = "CPF", identificationNumber }) {
      const mp = mpRef.current;
      if (!mp || !ready) {
        throw new Error("Campos do cartão ainda não estão prontos. Aguarde um instante.");
      }
      const name = String(cardholderName || "").trim();
      const doc = String(identificationNumber || "").replace(/\D/g, "");
      if (!name) throw new Error("Nome do titular do cartão é obrigatório.");
      if (doc.length < 11) throw new Error("CPF/CNPJ válido é obrigatório para pagamento com cartão.");

      let result;
      try {
        result = await mp.fields.createCardToken({
          cardholderName: name,
          identificationType: doc.length > 11 ? "CNPJ" : identificationType,
          identificationNumber: doc,
        });
      } catch (e) {
        const raw = e?.message || String(e);
        if (/not found public_key/i.test(raw)) {
          throw new Error(
            "Chave pública do Mercado Pago não é reconhecida (inválida, expirada ou copiada errado). " +
              "No painel: Suas integrações → Credenciais de teste → copie a Public Key e coloque o MESMO valor em " +
              "NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY (front) e MERCADO_PAGO_PUBLIC_KEY (backend). Reinicie os servidores."
          );
        }
        throw e;
      }

      if (!result || !result.id) {
        const msg =
          result?.message ||
          (Array.isArray(result?.cause) && result.cause[0]?.description) ||
          "Não foi possível tokenizar o cartão.";
        if (/not found public_key/i.test(String(msg))) {
          throw new Error(
            "Chave pública do Mercado Pago inválida. Copie de novo a Public Key no painel do Mercado Pago e atualize o .env do front e do backend."
          );
        }
        throw new Error(msg);
      }

      return { token: result.id };
    },
    getSelectedInstallment() {
      return { installments: Number(selectionRef.current.installments) || 1 };
    },
  }));

  if (initError) {
    return <p style={{ color: "#c00", fontSize: "14px" }}>{initError}</p>;
  }

  return (
    <div className="mercado-pago-secure-fields" style={{ maxWidth: 420 }}>
      <p style={{ fontSize: "14px", color: "#666", marginBottom: 16 }}>
        Pagamento seguro na loja: os dados do cartão são processados pelo Mercado Pago (campos
        protegidos). Não redirecionamos para outro site.
      </p>
      <div
        id="mp-form-card-number"
        style={{
          height: 48,
          marginBottom: 12,
          border: "1px solid #ddd",
          borderRadius: 6,
          padding: "0 8px",
        }}
      />
      <div style={{ display: "flex", gap: 12 }}>
        <div
          id="mp-form-expiration"
          style={{
            flex: 1,
            height: 48,
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "0 8px",
          }}
        />
        <div
          id="mp-form-cvv"
          style={{
            width: 120,
            height: 48,
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: "0 8px",
          }}
        />
      </div>
      {installmentsLoading && (
        <p style={{ fontSize: "13px", color: "#888", marginTop: 12 }}>Consultando parcelas…</p>
      )}
      {installmentOptions.length > 1 && (
        <label style={{ display: "block", marginTop: 16, fontSize: 14 }}>
          Parcelas
          <select
            value={selectedInstallments}
            disabled={disabled}
            onChange={(event) => {
              const count = Number(event.target.value) || 1;
              selectionRef.current = { installments: count };
              setSelectedInstallments(count);
            }}
            style={{
              display: "block",
              width: "100%",
              marginTop: 6,
              height: 48,
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: "0 8px",
              background: "#fff",
            }}
          >
            {installmentOptions.map((option) => (
              <option key={option.installments} value={option.installments}>
                {option.recommended_message || `${option.installments}x`}
              </option>
            ))}
          </select>
        </label>
      )}
      {!ready && !initError && (
        <p style={{ fontSize: "13px", color: "#888", marginTop: 12 }}>Carregando campos do cartão…</p>
      )}
      {disabled && ready && (
        <p style={{ fontSize: "12px", color: "#888", marginTop: 8 }}>Processando…</p>
      )}
    </div>
  );
});

export default MercadoPagoSecureFields;
