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
  subtotalOverride = null,
}) => {
  const { total: cartTotalFromHook } = useCartInfo();
  // Se houver subtotalOverride (checkout direto), usar ele, senão usar o do carrinho
  const total = subtotalOverride !== null ? subtotalOverride : cartTotalFromHook;

  return (
    <React.Fragment>
      <tr className="cart-subtotal">
        <th>Subtotal do Carrinho de livros</th>
        <td className="text-end">
          <span className="amount text-end">R$ {total.toFixed(2).replace('.', ',')}</span>
        </td>
      </tr>
      <tr className="shipping">
        <th style={{ verticalAlign: 'middle' }}>Frete</th>
        <td className="text-end">
          {isCalculatingShipping ? (
            <span style={{ color: '#666', fontStyle: 'italic' }}>
              <i className="fa fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Calculando frete...
            </span>
          ) : shippingOptions.length === 0 ? (
            <span style={{
              fontSize: '13px',
              color: shippingError ? '#ef4444' : '#666',
              fontStyle: 'italic',
              fontWeight: shippingError ? '500' : 'normal'
            }}>
              {shippingError ? (
                <>
                  <i className="fa fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                  Informe um CEP válido e aguarde as opções de frete.
                </>
              ) : (
                'Informe o CEP completo — calculado automaticamente.'
              )}
            </span>
          ) : null}
        </td>
      </tr>

      {!isCalculatingShipping && shippingOptions.length > 0 && (
        <tr className="shipping shipping-options-row">
          <td
            colSpan={2}
            style={{
              padding: '4px 0 12px',
              border: 'none',
              backgroundColor: 'transparent'
            }}
          >
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              border: shippingError ? '1px solid #fca5a5' : 'none',
              borderRadius: '6px',
              padding: shippingError ? '10px' : '0',
              backgroundColor: shippingError ? '#fef2f2' : 'transparent'
            }}>
              {shippingOptions.map((option, index) => {
                const optionId = `shipping_${option.id}_${index}`;
                const isFree = option.cost === 0;
                const costText = isFree ? 'Grátis' : `R$ ${option.cost.toFixed(2).replace('.', ',')}`;
                const isSelected = selectedShippingId === option.id;

                return (
                  <label
                    key={option.id || index}
                    htmlFor={optionId}
                    style={{
                      flex: '1 1 0',
                      minWidth: '160px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      border: isSelected ? '1px solid #10b981' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#f9fafb' : '#ffffff',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                      marginBottom: 0
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
                    <span style={{ position: 'relative', flexShrink: 0, lineHeight: 0 }}>
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
                          position: 'absolute',
                          inset: 0,
                          margin: 0,
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      <span
                        aria-hidden="true"
                        style={{
                          display: 'inline-block',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          border: isSelected ? '2px solid #10b981' : '2px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          transition: 'border-color 0.15s ease',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <span
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        )}
                      </span>
                    </span>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      flex: 1,
                      minWidth: 0
                    }}>
                      <span style={{
                        fontSize: '14px',
                        color: '#374151',
                        fontWeight: isSelected ? '600' : '500',
                        lineHeight: 1.2
                      }}>
                        {option.title}
                      </span>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: isFree ? '700' : '600',
                        color: isFree ? '#10b981' : '#111827',
                        lineHeight: 1.2
                      }}>
                        {costText}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
            <ErrorMessage message={errors?.shippingOption?.message} />
          </td>
        </tr>
      )}

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
            <span className="amount">R$ {Number(shippingCost || 0).toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>

      <tr className="shipping">
        <th>Desconto</th>
        <td className="text-end">
          <strong>
            <span className="amount">R$ {Number(discountAmount || 0).toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>

      <tr className="order-total">
        <th>Total do Pedido</th>
        <td className="text-end">
          <strong>
            <span className="amount">R$ {Number(cartTotal || 0).toFixed(2).replace('.', ',')}</span>
          </strong>
        </td>
      </tr>
    </React.Fragment>
  );
};

export default OrderDetails;
