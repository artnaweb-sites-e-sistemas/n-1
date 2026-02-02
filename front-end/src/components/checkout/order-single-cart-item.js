import React from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { remove_product } from "src/redux/features/cartSlice";
import { notifySuccess } from "@utils/toast";

const OrderSingleCartItem = ({ item, onRemove, isDirectCheckout = false }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { title, orderQuantity = 1, originalPrice, _id, quantity } = item || {};
  const qty = orderQuantity || quantity || 1;
  const price = originalPrice || 0;

  // handle remove product
  const handleRemoveProduct = () => {
    if (isDirectCheckout) {
      // Se for checkout direto, limpar sessionStorage
      sessionStorage.removeItem('directCheckoutProduct');
      notifySuccess(`${title} removido`);
      // Chamar callback para atualizar estado
      if (onRemove) {
        onRemove();
      }
      // Redirecionar para a loja após um pequeno delay
      setTimeout(() => {
        router.push('/shop');
      }, 500);
    } else {
      // Remover do carrinho normal
      dispatch(remove_product(item));
      notifySuccess(`${title} removido do carrinho`);
    }
  };

  return (
    <tr className="cart_item">
      <td className="product-name">
        {title} <strong className="product-quantity"> × {qty}</strong>
        <button
          onClick={handleRemoveProduct}
          type="button"
          className="product-remove"
          style={{
            marginLeft: '10px',
            background: 'none',
            border: 'none',
            color: '#dc3545',
            cursor: 'pointer',
            fontSize: '18px',
            padding: '0 5px',
            lineHeight: '1',
            fontWeight: 'bold'
          }}
          title="Remover produto"
        >
          ×
        </button>
      </td>
      <td className="product-total text-end">
        <span className="amount">R${Number(price * qty).toFixed(2).replace('.', ',')}</span>
      </td>
    </tr>
  );
};

export default OrderSingleCartItem;
