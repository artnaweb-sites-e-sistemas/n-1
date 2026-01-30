'use client';
import { useEffect, useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
// internal
import ShopCta from "@components/cta";
import Footer from "@layout/footer";
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import ProductDetailsBreadcrumb from "@components/product-details/breadcrumb";
import { useGetProductQuery } from "src/redux/features/productApi";
import ProductDetailsArea from "@components/product-details/product-details-area";
import ErrorMessage from "@components/error-message/error";
import ProductDetailsTabArea from "@components/product-details/product-details-tab-area";
import RelatedProducts from "@components/product-details/related-products";
import { initialOrderQuantity } from "src/redux/features/cartSlice";
import PrdDetailsLoader from "@components/loader/details-loader";
import { handleModalShow } from "src/redux/features/productSlice";
// internal

export default function ShopDetailsMainArea({ id }) {
  // Se id é um objeto (produto do catálogo local), usar diretamente
  // Se id é string/number (ID do WooCommerce), buscar via API
  const isCatalogProduct = id && typeof id === 'object' && id.source === 'catalog';
  
  const { data: wooCommerceProduct, isLoading: isLoadingWooCommerce, isError: isErrorWooCommerce } = useGetProductQuery(
    isCatalogProduct ? null : id,
    { skip: isCatalogProduct }
  );
  
  // Produto final: catálogo local ou WooCommerce
  const product = isCatalogProduct ? id : wooCommerceProduct;
  const isLoading = isCatalogProduct ? false : isLoadingWooCommerce;
  const isError = isCatalogProduct ? false : isErrorWooCommerce;
  
  const router = useRouter();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(initialOrderQuantity());
  }, [dispatch]);
  // remove backdrop
  useLayoutEffect(() => {
    dispatch(handleModalShow())
  }, [dispatch, router]);
  // decide what to render
  let content = null;

  if (isLoading) {
    content = <PrdDetailsLoader loading={isLoading} />;
  }

  if (!isLoading && isError) {
    content = <ErrorMessage message="There was an error" />;
  }

  if (!isLoading && !isError && product) {
    content = (
      <>
        <ProductDetailsBreadcrumb title={product.title} />
        <ProductDetailsArea product={product} />
        <ProductDetailsTabArea product={product} />
        <RelatedProducts product={product} />
      </>
    );
  }

  return (
    <Wrapper>
      <Header style_2={true} />
      {content}
      <ShopCta />
      <Footer />
    </Wrapper>
  );
}
