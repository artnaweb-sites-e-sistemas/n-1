import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
// internal
import useCartInfo from "@hooks/use-cart-info";
import ErrorMessage from "@components/error-message/error";

const OrderDetails = ({
  register,
  errors,
  handleShippingCost,
  cartTotal,
  shippingCost,
  discountAmount,
  shippingOptions = [],
  selectedShippingId,
  isCalculatingShipping = false,
}) => {
  const { total } = useCartInfo();

  return (
    <React.Fragment>
      <tr className="cart-subtotal">
        <th>Subtotal do Carrinho</th>
        <td className="text-end">
          <span className="amount text-end">R$ {total.toFixed(2).replace('.', ',')}</span>
        </td>
      </tr>
      <tr className="shipping">
        <th>Frete</th>
        <td className="text-end">
          {isCalculatingShipping ? (
            <p style={{ color: '#666', fontStyle: 'italic' }}>
              <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Calculando frete...
            </p>
          ) : shippingOptions.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {shippingOptions.map((option, index) => {
                const optionId = `shipping_${option.id}_${index}`;
                const isFree = option.cost === 0;
                const costText = isFree ? 'Grátis' : `R$ ${option.cost.toFixed(2).replace('.', ',')}`;
                const isSelected = selectedShippingId === option.id;
                
                return (
                  <li key={option.id || index} style={{ marginBottom: '8px' }}>
                    <label
                      htmlFor={optionId}
                      style={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: '8px 12px',
                        border: isSelected ? '2px solid #000' : '1px solid #ddd',
                        borderRadius: '4px',
                        backgroundColor: isSelected ? '#f9f9f9' : 'white'
                      }}
                    >
                      <input
                        {...register(`shippingOption`, {
                          required: `Opção de frete é obrigatória!`,
                        })}
                        id={optionId}
                        type="radio"
                        name="shippingOption"
                        value={option.id}
                        checked={isSelected}
                        onChange={() => handleShippingCost(option.cost, option.id)}
                        style={{ marginRight: '10px' }}
                      />
                      <span className="amount" style={{ fontWeight: isFree ? 'bold' : 'normal', color: isFree ? '#28a745' : 'inherit' }}>
                        {option.title} - {costText}
                      </span>
                    </label>
                  </li>
                );
              })}
              <ErrorMessage message={errors?.shippingOption?.message} />
            </ul>
          ) : (
            <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
              Digite o CEP e clique em "Calcular Frete"
            </p>
          )}
        </td>
      </tr>

      <tr className="shipping">
        <th>Subtotal</th>
        <td className="text-end">
          <strong>
            <span className="amount">R$ {total.toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>

      <tr className="shipping">
        <th>Custo do Frete</th>
        <td className="text-end">
          <strong>
            <span className="amount">R$ {shippingCost.toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>

      <tr className="shipping">
        <th>Desconto</th>
        <td className="text-end">
          <strong>
            <span className="amount">R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>

      <tr className="order-total">
        <th>Total do Pedido</th>
        <td className="text-end">
          <strong>
            <span className="amount">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>
    </React.Fragment>
  );
};

export default OrderDetails;
