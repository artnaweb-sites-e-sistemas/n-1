const express = require("express");
const {
  paymentIntent,
  createMercadoPagoPreference,
  createMercadoPagoTransparentPayment,
  addOrder,
  getSingleOrder,
  updateOrderStatus,
  getOrders,
} = require("../controller/orderController");

// router
const router = express.Router();

// get orders
router.get("/orders", getOrders);
// add a create payment intent
router.post("/create-payment-intent", paymentIntent);
router.post("/create-mercadopago-preference", createMercadoPagoPreference);
router.post("/create-mercadopago-payment", createMercadoPagoTransparentPayment);
router.post("/addOrder", addOrder);
// single order
router.get("/:id", getSingleOrder);

// update status
router.patch("/update-status/:id", updateOrderStatus);

module.exports = router;
