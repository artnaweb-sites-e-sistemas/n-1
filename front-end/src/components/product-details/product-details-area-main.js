'use client';
import { useEffect, useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
// internal
import ShopCta from "@components/cta";
import Footer from "@layout/footer";
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import { useGetProductQuery } from "src/redux/features/productApi";
import ProductDetailsArea from "@components/product-details/product-details-area";
import ErrorMessage from "@components/error-message/error";
import ProductDetailsTabArea from "@components/product-details/product-details-tab-area";
import RelatedProducts from "@components/product-details/related-products";
import { initialOrderQuantity } from "src/redux/features/cartSlice";
import PrdDetailsLoader from "@components/loader/details-loader";
import { handleModalShow } from "src/redux/features/productSlice";
// internal

export default function ShopDetailsMainArea({ id, product: preloadedProduct = null }) {
  // Produto já pronto (preview, catálogo local, ou objeto passado pelo pai)
  const isObjectProduct =
    id &&
    typeof id === "object" &&
    (id.source === "catalog" || id.id != null || id._id != null);
  const readyProduct = preloadedProduct || (isObjectProduct ? id : null);

  const {
    data: wooCommerceProduct,
    isLoading: isLoadingWooCommerce,
    isError: isErrorWooCommerce,
  } = useGetProductQuery(readyProduct ? null : id, {
    skip: !!readyProduct || id == null || id === "",
  });

  const product = readyProduct || wooCommerceProduct;
  const isLoading = readyProduct ? false : isLoadingWooCommerce;
  const isError = readyProduct ? false : isErrorWooCommerce;

  const router = useRouter();
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(initialOrderQuantity());
  }, [dispatch]);
  // remove backdrop
  useLayoutEffect(() => {
    dispatch(handleModalShow());
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
