import Image from "next/image";
import React from "react";
import Link from "next/link";
// internal
import empty_img from "@assets/img/product/cartmini/empty-cart.png";

const EmptyCart = ({ search_prd = false }) => {
  return (
    <div className="cartmini__empty text-center">
      <Image src={empty_img} alt="empty img" />
      <p>{search_prd ? `Desculpe,😥 não conseguimos encontrar este produto` : `Seu carrinho está vazio`}</p>
      {!search_prd && (
        <Link href="/shop" className="tp-btn">
          Ir para a Loja
        </Link>
      )}
    </div>
  );
};

export default EmptyCart;
