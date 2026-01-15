import Footer from "@layout/footer";
import Header from "@layout/header";
import Wrapper from "@layout/wrapper";
import CartBreadcrumb from "@components/cart/cart-breadcrumb";
import ShopCta from "@components/cta";
import WishlistArea from "@components/wishlist/wishlist-area";

export const metadata = {
  title: "Lista de Desejos - N-1 Edições",
};

export default function Wishlist() {
  return (
    <Wrapper>
      <Header style_2={true} />
      <CartBreadcrumb title="Minha Lista de Desejos" subtitle="Lista de Desejos" />
      <WishlistArea />
      <ShopCta />
      <Footer />
    </Wrapper>
  );
}
