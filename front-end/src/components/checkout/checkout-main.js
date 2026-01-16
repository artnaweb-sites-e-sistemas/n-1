"use client";
import Link from "next/link";
import { useSelector } from "react-redux";
// internal
import Header from "@layout/header";
import CartBreadcrumb from "@components/cart/cart-breadcrumb";
import Wrapper from "@layout/wrapper";
import CouponArea from "@components/checkout/coupon-area";
import CheckoutArea from "@components/checkout/checkout-area";
import Footer from "@layout/footer";
import ShopCta from "@components/cta";
import useCheckoutSubmit from "@hooks/use-checkout-submit";

export default function CheckoutMainArea() {
  const checkout_data = useCheckoutSubmit();
  const { cart_products } = useSelector((state) => state.cart);
  return (
    <Wrapper>
      <Header style_2={true} />
      <CartBreadcrumb title="Finalizar Compra" subtitle="Finalizar Compra" />
      {cart_products.length === 0 ? (
        <div className="text-center pt-80 pb-80">
          <h3 className="py-2">Nenhum item encontrado no carrinho para finalizar compra</h3>
          <Link href="/shop" className="tp-btn">
            Voltar para a loja
          </Link>
        </div>
      ) : (
        <>
          <CouponArea {...checkout_data} onUserLoggedIn={checkout_data.fillCheckoutFields} />
          <CheckoutArea {...checkout_data} />
        </>
      )}
      <ShopCta />
      <Footer />
    </Wrapper>
  );
}
