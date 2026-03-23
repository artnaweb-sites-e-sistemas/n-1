import SingleOrderArea from "@components/order-area";

export const metadata = {
  title: "N-1 Edições - Pedido",
};

const OrderPage = async ({ params, searchParams }) => {
  const { id } = await params;
  const sp = searchParams && typeof searchParams.then === "function" ? await searchParams : searchParams;
  const orderKey = sp && typeof sp.key === "string" ? sp.key : "";
  return <SingleOrderArea orderId={id} orderKey={orderKey} />;
};

export default OrderPage;
