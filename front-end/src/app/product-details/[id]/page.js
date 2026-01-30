
import ShopDetailsMainArea from "@components/product-details/product-details-area-main";


export const metadata = {
  title: "N-1 Edições - Detalhes do Produto",
};

const ProductDetailsPage = async ({ params }) => {
  const { id } = await params;
  return <ShopDetailsMainArea id={id} />;
};

export default ProductDetailsPage;
