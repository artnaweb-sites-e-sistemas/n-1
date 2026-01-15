import Link from "next/link";
import React from "react";
// internal
import useCartInfo from "@hooks/use-cart-info";

const CartTotal = () => {
  const { total } = useCartInfo();
  return (
    <div className="cart-page-total">
      <h2>Total do Carrinho</h2>
      <ul className="mb-20">
        <li>
          Subtotal <span>R$ {total.toFixed(2).replace('.', ',')}</span>
        </li>
        <li>
          Total <span>R$ {total.toFixed(2).replace('.', ',')}</span>
        </li>
      </ul>
      <Link href="/checkout" className="tp-btn cursor-pointer">
        Finalizar Compra
      </Link>
    </div>
  );
};

export default CartTotal;
