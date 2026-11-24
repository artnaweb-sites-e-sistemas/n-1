import Link from "next/link";
import React from "react";
import { useSelector } from "react-redux";
// internal
import useCartInfo from "@hooks/use-cart-info";
import { isProductSoldOut, SOLD_OUT_LABEL } from "src/utils/product-stock";

const CartTotal = () => {
  const { total } = useCartInfo();
  const { cart_products } = useSelector((state) => state.cart);
  const soldOutItems = (cart_products || []).filter(isProductSoldOut);
  return (
    <div className="cart-page-total">
      <h2>Total do Carrinho de livros</h2>
      <ul className="mb-20">
        <li>
          Subtotal <span>R$ {total.toFixed(2).replace('.', ',')}</span>
        </li>
        <li>
          Total <span>R$ {total.toFixed(2).replace('.', ',')}</span>
        </li>
      </ul>
      {soldOutItems.length > 0 ? (
        <p role="status" style={{ color: "#721c24", marginBottom: 12 }}>
          {SOLD_OUT_LABEL}: remova {soldOutItems.map((item) => item.title).filter(Boolean).join(", ")} para finalizar a compra.
        </p>
      ) : (
        <Link href="/checkout" className="tp-btn cursor-pointer">
          Finalizar Compra
        </Link>
      )}
    </div>
  );
};

export default CartTotal;
