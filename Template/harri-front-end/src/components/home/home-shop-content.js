'use client';
import React, { useState } from "react";
// internal
import ShopArea from "@components/shop/shop-area";
import ErrorMessage from "@components/error-message/error";
import { useGetShowingProductsQuery } from "src/redux/features/productApi";
import ShopLoader from "@components/loader/shop-loader";

const HomeShopContent = () => {
  const { data: products, isError, isLoading } = useGetShowingProductsQuery();
  const [shortValue, setShortValue] = useState("");

  // selectShortHandler
  const selectShortHandler = (e) => {
    setShortValue(e.value);
  };

  // decide what to render
  let content = null;
  if (isLoading) {
    content = <ShopLoader loading={isLoading} />;
  }

  if (!isLoading && isError) {
    content = <ErrorMessage message="Ocorreu um erro" />;
  }

  if (!isLoading && !isError && products?.products?.length === 0) {
    content = <ErrorMessage message="Nenhum produto encontrado!" />;
  }

  if (!isLoading && !isError && products?.products?.length > 0) {
    let all_products = products.products;
    let product_items = all_products;

    // selectShortHandler
    if (shortValue === "Ordenar" || shortValue === "Short Filtering") {
      product_items = all_products;
    }
    // Latest Product / Produto Mais Recente
    if (shortValue === "Latest Product" || shortValue === "Produto Mais Recente") {
      product_items = all_products.filter(
        (product) => product.itemInfo === "latest-product"
      );
    }
    // Price low to high / Preço: menor para maior
    if (shortValue === "Price low to high" || shortValue === "Preço: menor para maior") {
      product_items = all_products
        .slice()
        .sort((a, b) => Number(a.originalPrice) - Number(b.originalPrice));
    }
    // Price high to low / Preço: maior para menor
    if (shortValue === "Price high to low" || shortValue === "Preço: maior para menor") {
      product_items = all_products
        .slice()
        .sort((a, b) => Number(b.originalPrice) - Number(a.originalPrice));
    }

    content = (
      <ShopArea
        products={product_items}
        all_products={all_products}
        shortHandler={selectShortHandler}
      />
    );
  }

  return content;
};

export default HomeShopContent;


