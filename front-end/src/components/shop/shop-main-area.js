'use client';
import { useState } from "react";
// internal
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import ShopCta from "@components/cta";
import Footer from "@layout/footer";
import ShopBreadcrumb from "@components/common/breadcrumb/shop-breadcrumb";
import ShopArea from "@components/shop/shop-area";
import ErrorMessage from "@components/error-message/error";
import { useGetShowingProductsQuery } from "src/redux/features/productApi";
import ShopLoader from "@components/loader/shop-loader";

export default function ShopMainArea({ Category, category, brand, priceMin, max, priceMax, color }) {
  const { data: products, isError, isLoading } = useGetShowingProductsQuery();
  const [shortValue,setShortValue] = useState("");

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

    if (Category) {
      product_items = product_items.filter((product) => {
        // Verificar se product.parent existe e é uma string
        if (!product?.parent || typeof product.parent !== 'string') {
          return false;
        }
        return product.parent.toLowerCase().replace("&", "").split(" ").join("-") === Category;
      });
    }
    if (category) {
      product_items = product_items.filter((product) => {
        // Verificar se product.children existe e é uma string
        if (!product?.children || typeof product.children !== 'string') {
          return false;
        }
        return product.children
          .toLowerCase()
          .replace("&", "")
          .split(" ")
          .join("-") === category;
      });
    }
    if (brand) {
      product_items = product_items.filter((product) => {
        // Verificar se product.brand e product.brand.name existem
        if (!product?.brand?.name || typeof product.brand.name !== 'string') {
          return false;
        }
        return product.brand.name.toLowerCase().replace("&", "").split(" ").join("-") === brand;
      });
    }
    if (color) {
      product_items = product_items.filter((product) => {
        // Verificar se product.colors existe e é um array
        if (!product?.colors || !Array.isArray(product.colors)) {
          return false;
        }
        return product.colors.includes(color);
      });
    }
    if (priceMin || max || priceMax) {
      product_items = product_items.filter((product) => {
        // Verificar se product.originalPrice existe
        if (product?.originalPrice === undefined || product.originalPrice === null) {
          return false;
        }
        const price = Number(product.originalPrice);
        const minPrice = Number(priceMin) || 0;
        const maxPrice = Number(max) || Infinity;
        if (!priceMax && priceMin && max) {
          return price >= minPrice && price <= maxPrice;
        }
        if (priceMax) {
          return price >= Number(priceMax);
        }
        return true;
      });
    }
    // selectShortHandler
    if (shortValue === "Ordenar" || shortValue === "Short Filtering") {
      product_items = all_products
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

  return (
    <Wrapper>
      <Header style_2={true} />
      <ShopBreadcrumb />
      {content}
      <ShopCta />
      <Footer />
    </Wrapper>
  );
}
