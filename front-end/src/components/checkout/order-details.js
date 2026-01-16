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
  shippingError = false,
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
        <th style={{ 
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          verticalAlign: 'middle'
        }}>Frete</th>
        <td className="text-end">
          <div style={{
            border: shippingError ? '1px solid #fca5a5' : 'none',
            borderRadius: '4px',
            padding: shippingError ? '12px' : '0',
            backgroundColor: shippingError ? '#fef2f2' : 'transparent'
          }}>
            {isCalculatingShipping ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>
                <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Calculando frete...
              </p>
            ) : shippingOptions.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, width: '100%' }}>
                {shippingOptions.map((option, index) => {
                  const optionId = `shipping_${option.id}_${index}`;
                  const isFree = option.cost === 0;
                  const costText = isFree ? 'Grátis' : `R$ ${option.cost.toFixed(2).replace('.', ',')}`;
                  const isSelected = selectedShippingId === option.id;
                  
                  return (
                    <li key={option.id || index} style={{ marginBottom: '10px', width: '100%' }}>
                      <label
                        htmlFor={optionId}
                        style={{ 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          border: isSelected ? '1px solid #10b981' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: isSelected ? '#f9fafb' : '#ffffff',
                          transition: 'all 0.2s ease',
                          width: '100%',
                          boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                            e.currentTarget.style.backgroundColor = '#ffffff';
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
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
                            style={{ 
                              marginRight: '12px',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ 
                            fontSize: '14px', 
                            color: '#374151',
                            fontWeight: isSelected ? '600' : '400'
                          }}>
                            {option.title}
                          </span>
                        </div>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: isFree ? '700' : '600',
                          color: isFree ? '#10b981' : '#111827',
                          marginLeft: '12px'
                        }}>
                          {costText}
                        </span>
                      </label>
                    </li>
                  );
                })}
                <ErrorMessage message={errors?.shippingOption?.message} />
              </ul>
            ) : (
              <div>
                <p style={{ 
                  fontSize: '14px', 
                  color: shippingError ? '#ef4444' : '#666', 
                  fontStyle: 'italic',
                  fontWeight: shippingError ? '500' : 'normal',
                  marginBottom: '0'
                }}>
                  {shippingError ? (
                    <>
                      <i className="fa fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                      Por favor, calcule o frete.
                    </>
                  ) : (
                    'Digite o CEP e clique em "Calcular Frete"'
                  )}
                </p>
              </div>
            )}
          </div>
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
