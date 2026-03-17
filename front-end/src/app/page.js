import React from "react";
// internal
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import HeroBanner from "@components/hero-banner";
import HomeShopContentInfinite from "@components/home/home-shop-content-infinite";
import ShopCta from "@components/cta";
import Footer from "@layout/footer";

export const metadata = {
  title: "Loja - N-1 Edições"
};

const HomeShop = () => {
  return (
    <Wrapper>
      <Header style_2={true} />
      {/* HeroBanner ocultado - para reativar, descomente a linha abaixo */}
      {/* <HeroBanner /> */}
      <HomeShopContentInfinite />
      <ShopCta />
      <Footer />
    </Wrapper>
  );
};

export default HomeShop;
