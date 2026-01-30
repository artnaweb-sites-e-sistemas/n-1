import SingleOrderArea from "@components/order-area";


export const metadata = {
  title: "N-1 Edições - Pedido",
};

const OrderPage = async ({ params }) => {
  const { id } = await params;
  return <SingleOrderArea orderId={id} />;
};

export default OrderPage;
