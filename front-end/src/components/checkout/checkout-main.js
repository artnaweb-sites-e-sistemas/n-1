"use client";
import Link from "next/link";
import Image from "next/image";
import { useSelector } from "react-redux";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
// internal
import Header from "@layout/header";
import CartBreadcrumb from "@components/cart/cart-breadcrumb";
import Wrapper from "@layout/wrapper";
import CouponArea from "@components/checkout/coupon-area";
import CheckoutArea from "@components/checkout/checkout-area";
import Footer from "@layout/footer";
import ShopCta from "@components/cta";
import useCheckoutSubmit from "@hooks/use-checkout-submit";
import empty_img from "@assets/img/product/cartmini/empty-cart.png";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const isDirectCheckout = searchParams.get('direct') === 'true';
  const [directProduct, setDirectProduct] = useState(null);
  const checkout_data = useCheckoutSubmit(directProduct);
  const { cart_products } = useSelector((state) => state.cart);
  
  // Verificar se há produto direto no sessionStorage
  useEffect(() => {
    if (isDirectCheckout) {
      const storedProduct = sessionStorage.getItem('directCheckoutProduct');
      if (storedProduct) {
        try {
          const product = JSON.parse(storedProduct);
          setDirectProduct(product);
        } catch (error) {
          console.error('Erro ao parsear produto direto:', error);
        }
      }
    }
    
    // Limpar sessionStorage quando sair da página (cleanup)
    return () => {
      if (isDirectCheckout) {
        // Não limpar aqui, apenas quando o pedido for concluído
      }
    };
  }, [isDirectCheckout]);

  // Callback para quando remover produto direto
  const handleDirectProductRemove = () => {
    setDirectProduct(null);
    sessionStorage.removeItem('directCheckoutProduct');
  };

  // Determinar quais produtos usar
  const productsToCheckout = directProduct ? [directProduct] : cart_products;
  const hasProducts = productsToCheckout.length > 0;

  return (
    <>
      <Header style_2={true} />
      <CartBreadcrumb title="Finalizar Compra" subtitle="Finalizar Compra" />
      {!hasProducts ? (
        <section className="checkout-empty-area pt-120 pb-120">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-xl-8 col-lg-10">
                <div className="checkout-empty text-center" style={{
                  padding: '60px 30px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div className="checkout-empty__icon mb-30" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Image 
                      src={empty_img} 
                      alt="Carrinho vazio" 
                      width={200} 
                      height={200}
                      style={{
                        maxWidth: '100%',
                        height: 'auto',
                        opacity: 0.8
                      }}
                    />
                  </div>
                  <h3 className="checkout-empty__title mb-15" style={{
                    fontSize: '32px',
                    fontWeight: '600',
                    color: 'var(--tp-common-black)',
                    letterSpacing: '-0.02em',
                    marginBottom: '20px'
                  }}>
                    Seu carrinho está vazio
                  </h3>
                  <p className="checkout-empty__text mb-35" style={{
                    fontSize: '16px',
                    color: '#666',
                    lineHeight: '1.7',
                    maxWidth: '500px',
                    margin: '0 auto 35px',
                    padding: '0 20px'
                  }}>
                    Não há itens no seu carrinho para finalizar a compra. Adicione produtos à sua escolha e retorne para concluir seu pedido.
                  </p>
                  <Link 
                    href="/shop" 
                    className="tp-btn tp-btn-black"
                    style={{
                      padding: '14px 40px',
                      fontSize: '15px',
                      fontWeight: '600',
                      display: 'inline-block',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Continuar Comprando
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          <CouponArea {...checkout_data} onUserLoggedIn={checkout_data.fillCheckoutFields} />
          <CheckoutArea 
            {...checkout_data} 
            isDirectCheckout={isDirectCheckout}
            onDirectProductRemove={handleDirectProductRemove}
          />
        </>
      )}
      <ShopCta />
      <Footer />
    </>
  );
}

export default function CheckoutMainArea() {
  return (
    <Wrapper>
      <Suspense fallback={<div className="text-center pt-80 pb-80">Carregando...</div>}>
        <CheckoutContent />
      </Suspense>
    </Wrapper>
  );
}
