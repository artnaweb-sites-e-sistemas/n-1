"use client";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Provider } from "react-redux";
import { store } from "src/redux/store";
if (typeof window !== "undefined") {
  require("bootstrap/dist/js/bootstrap");
}

// stripePromise - só inicializa se a chave estiver configurada
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY;
let stripePromise = null;

// Só inicializa o Stripe se a chave existir e não estiver vazia
if (stripeKey && typeof stripeKey === 'string' && stripeKey.trim() !== '') {
  try {
    stripePromise = loadStripe(stripeKey);
  } catch (error) {
    console.warn('Erro ao inicializar Stripe:', error);
    stripePromise = null;
  }
}

export default function MainProvider({ children }) {
  // Sempre renderiza Elements, mas pode ser null se não houver chave
  // Isso permite que os hooks do Stripe funcionem mesmo sem chave configurada
  return (
    <Provider store={store}>
      <Elements stripe={stripePromise}>{children}</Elements>
    </Provider>
  );
}
