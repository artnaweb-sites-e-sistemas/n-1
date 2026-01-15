import React from "react";
// internal
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import HeroBanner from "@components/hero-banner";
import HomeShopContent from "@components/home/home-shop-content";
import ShopFeature from "@components/shop-feature";
import ShopCta from "@components/cta";
import Footer from "@layout/footer";

export const metadata = {
  title: "Loja - N-1 Edições"
};

const HomeShop = () => {
  return (
    <Wrapper>
      <Header />
      <HeroBanner />
      <HomeShopContent />
      <ShopFeature />
      <ShopCta />
      <Footer />
    </Wrapper>
  );
};

export default HomeShop;
