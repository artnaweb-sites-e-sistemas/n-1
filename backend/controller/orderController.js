const crypto = require("crypto");
const { secret } = require("../config/secret");
const stripe = require("stripe")(secret.stripe_key);
const Order = require("../models/Order");

/**
 * Resolve payment_method_id a partir do token do cartão (bin).
 */
async function resolveCardPaymentMethodId(tokenId, accessToken, publicKey) {
  if (!publicKey) {
    return { payment_method_id: "visa", issuer_id: null };
  }
  const tokenRes = await fetch(
    `https://api.mercadopago.com/v1/card_tokens/${encodeURIComponent(tokenId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!tokenRes.ok) {
    return { payment_method_id: "visa", issuer_id: null };
  }
  const tokenData = await tokenRes.json();
  const bin =
    tokenData.first_six_digits ||
    tokenData.first_six_digit ||
    (tokenData.id && String(tokenData.id).substring(0, 6)) ||
    null;
  if (!bin) {
    return { payment_method_id: "visa", issuer_id: null };
  }
  const searchRes = await fetch(
    `https://api.mercadopago.com/v1/payment_methods/search?public_key=${encodeURIComponent(
      publicKey
    )}&bins=${encodeURIComponent(bin)}`
  );
  const searchData = await searchRes.json();
  const pm = Array.isArray(searchData.results) ? searchData.results[0] : null;
  const issuer =
    pm && Array.isArray(pm.issuer_list) && pm.issuer_list.length > 0
      ? pm.issuer_list[0]
      : null;
  return {
    payment_method_id: pm?.id || "visa",
    issuer_id: issuer?.id || null,
  };
}

// create-payment-intent
module.exports.paymentIntent = async (req, res) => {
  try {
    const product = req.body;
    const price = Number(product.price);
    const amount = price * 100;
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: amount,
      payment_method_types: ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.createMercadoPagoPreference = async (req, res) => {
  try {
    const accessToken = secret.mercado_pago_access_token;
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "MERCADO_PAGO_ACCESS_TOKEN não configurado no backend.",
      });
    }

    const {
      orderId,
      items = [],
      shippingCost = 0,
      discount = 0,
      totalAmount = 0,
      payer = {},
    } = req.body || {};

    const mappedItems = (Array.isArray(items) ? items : [])
      .map((item) => {
        const title = item?.title || "Produto";
        const quantity = Number(item?.orderQuantity || item?.quantity || 1);
        const unitPrice = Number(item?.price || item?.originalPrice || 0);
        if (!unitPrice || quantity <= 0) return null;
        return {
          id: String(item?._id || item?.id || title),
          title,
          quantity,
          currency_id: "BRL",
          unit_price: Number(unitPrice.toFixed(2)),
        };
      })
      .filter(Boolean);

    if (shippingCost > 0) {
      mappedItems.push({
        id: "shipping",
        title: "Frete",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number(Number(shippingCost).toFixed(2)),
      });
    }

    if (discount > 0) {
      mappedItems.push({
        id: "discount",
        title: "Desconto",
        quantity: 1,
        currency_id: "BRL",
        unit_price: Number((-Math.abs(discount)).toFixed(2)),
      });
    }

    const frontendUrl = secret.client_url || "http://localhost:3005";
    const externalReference = String(orderId || `order-${Date.now()}`);
    const notificationUrl = process.env.MERCADO_PAGO_NOTIFICATION_URL;

    const preferencePayload = {
      items: mappedItems,
      payer: {
        email: payer?.email,
        name: payer?.name,
      },
      external_reference: externalReference,
      back_urls: {
        success: `${frontendUrl}/order/${externalReference}`,
        failure: `${frontendUrl}/checkout`,
        pending: `${frontendUrl}/order/${externalReference}`,
      },
      auto_return: "approved",
      statement_descriptor: "N1 EDICOES",
      metadata: {
        order_id: externalReference,
        total_amount: Number(totalAmount || 0),
      },
    };

    if (notificationUrl) {
      preferencePayload.notification_url = notificationUrl;
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpRes.json();
    if (!mpRes.ok) {
      return res.status(mpRes.status).json({
        success: false,
        message: "Falha ao criar preferência no Mercado Pago.",
        error: mpData,
      });
    }

    return res.status(200).json({
      success: true,
      preferenceId: mpData.id,
      initPoint: mpData.init_point,
      sandboxInitPoint: mpData.sandbox_init_point,
    });
  } catch (error) {
    console.log("Erro createMercadoPagoPreference:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar preferência do Mercado Pago.",
    });
  }
};

/**
 * Checkout transparente (cartão): token gerado no frontend com MercadoPago.js + pagamento na API.
 */
module.exports.createMercadoPagoTransparentPayment = async (req, res) => {
  try {
    const accessToken = secret.mercado_pago_access_token;
    const publicKey = secret.mercado_pago_public_key;
    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "MERCADO_PAGO_ACCESS_TOKEN não configurado no backend.",
      });
    }

    const {
      token,
      transaction_amount,
      installments = 1,
      payer_email,
      payer_first_name,
      payer_last_name,
      identification_type = "CPF",
      identification_number,
      description = "Compra N-1 Edições",
      metadata = {},
    } = req.body || {};

    if (!token || transaction_amount == null) {
      return res.status(400).json({
        success: false,
        message: "token e transaction_amount são obrigatórios.",
      });
    }

    const cleanDoc = String(identification_number || "").replace(/\D/g, "");
    if (!payer_email || !cleanDoc || cleanDoc.length < 11) {
      return res.status(400).json({
        success: false,
        message: "E-mail e CPF/CNPJ válidos são obrigatórios para pagamento com cartão.",
      });
    }

    const { payment_method_id, issuer_id } = await resolveCardPaymentMethodId(
      token,
      accessToken,
      publicKey
    );

    const amount = Number(Number(transaction_amount).toFixed(2));
    const idempotencyKey = crypto.randomUUID();

    const paymentBody = {
      transaction_amount: amount,
      token,
      description: String(description).slice(0, 255),
      installments: Math.min(Math.max(Number(installments) || 1, 1), 12),
      payment_method_id,
      payer: {
        email: String(payer_email).trim(),
        first_name: String(payer_first_name || "Cliente").slice(0, 255),
        last_name: String(payer_last_name || "").slice(0, 255),
        identification: {
          type: cleanDoc.length > 11 ? "CNPJ" : identification_type,
          number: cleanDoc,
        },
      },
      metadata:
        typeof metadata === "object" && metadata !== null ? metadata : {},
    };

    if (issuer_id) {
      paymentBody.issuer_id = Number(issuer_id);
    }

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      const msg =
        mpData?.message ||
        mpData?.cause?.[0]?.description ||
        "Falha ao processar pagamento no Mercado Pago.";
      return res.status(mpRes.status >= 400 && mpRes.status < 600 ? mpRes.status : 502).json({
        success: false,
        message: msg,
        error: mpData,
      });
    }

    const status = mpData.status;
    const approved = status === "approved";

    return res.status(200).json({
      success: true,
      approved,
      status,
      status_detail: mpData.status_detail,
      payment_id: mpData.id,
      payment: {
        id: mpData.id,
        status: mpData.status,
        status_detail: mpData.status_detail,
        transaction_amount: mpData.transaction_amount,
        payment_method_id: mpData.payment_method_id,
        date_approved: mpData.date_approved,
      },
    });
  } catch (error) {
    console.log("Erro createMercadoPagoTransparentPayment:", error);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao processar pagamento Mercado Pago.",
    });
  }
};

module.exports.addOrder = async (req, res) => {
  try {
    const orderItems = req.body;
    const payload = { ...orderItems };
    if (
      !payload.user ||
      payload.user === "undefined" ||
      payload.user === "null"
    ) {
      payload.user = null;
    }
    const newOrders = new Order(payload);
    const order = await newOrders.save();

    res.status(200).send({
      success: true,
      message: "Order added successfully",
      order: order,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message || "Erro ao salvar pedido",
    });
  }
};

// get Orders
exports.getSingleOrder = async (req, res, next) => {
  try {
    const orderItem = await Order.findById(req.params.id).populate('user');
    res.status(200).json(orderItem);
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};
// updateOrderStatus
exports.updateOrderStatus = async (req, res) => {
  const newStatus = req.body.status;
  console.log('newStatus',newStatus)
  try {
    await Order.updateOne(
      {
        _id: req.params.id,
      },
      {
        $set: {
          status: newStatus,
        },
      }, { new: true })
    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
    });
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};

// get Orders
exports.getOrders = async (req, res, next) => {
  try {
    const orderItems = await Order.find({}).sort({ createdAt: -1 }).populate('user');
    res.status(200).json({
      success: true,
      data: orderItems,
    });
  }
  catch (error) {
    console.log(error);
    next(error)
  }
};