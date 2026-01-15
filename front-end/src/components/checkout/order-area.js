import React from "react";
import { useSelector } from "react-redux";
// internal
import OrderDetails from "./order-details";
import PaymentCardElement from "@components/order/pay-card-element";
import OrderSingleCartItem from "./order-single-cart-item";

const OrderArea = ({
  stripe,
  error,
  register,
  errors,
  discountAmount,
  shippingCost,
  cartTotal,
  handleShippingCost,
  setClientSecret,
  isCheckoutSubmit,
  shippingOptions,
  selectedShippingId,
  isCalculatingShipping,
  paymentMethod,
  setPaymentMethod,
}) => {
  const { cart_products } = useSelector((state) => state.cart);
  return (
    <div className="your-order mb-30 ">
      <h3>Seu pedido</h3>
      <div className="your-order-table table-responsive">
        <table>
          <thead>
            <tr>
              <th className="product-name">Produto</th>
              <th className="product-total text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart_products?.map((item, i) => (
              <OrderSingleCartItem
                key={i}
                title={item.title}
                quantity={item.quantity}
                price={item.originalPrice}
              />
            ))}
          </tbody>
          <tfoot>
            <OrderDetails
              register={register}
              errors={errors}
              discountAmount={discountAmount}
              cartTotal={cartTotal}
              shippingCost={shippingCost}
              handleShippingCost={handleShippingCost}
              setClientSecret={setClientSecret}
              shippingOptions={shippingOptions}
              selectedShippingId={selectedShippingId}
              isCalculatingShipping={isCalculatingShipping}
            />
          </tfoot>
        </table>
      </div>

      <div className="payment-method faq__wrapper tp-accordion">
        <h3 style={{ marginBottom: '20px' }}>Método de Pagamento</h3>
        <div className="accordion" id="checkoutAccordion">
          {/* Cartão de Crédito */}
          <div className="accordion-item" style={{ 
            border: paymentMethod === 'card' ? '2px solid #000' : '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '10px',
            backgroundColor: paymentMethod === 'card' ? '#f9f9f9' : 'white'
          }}>
            <h2 className="accordion-header" id="checkoutCard" style={{ listStyle: 'none' }}>
              <button
                className={`accordion-button ${paymentMethod === 'card' ? '' : 'collapsed'}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#cardPayment"
                aria-expanded={paymentMethod === 'card'}
                aria-controls="cardPayment"
                onClick={() => setPaymentMethod('card')}
                style={{ 
                  fontWeight: paymentMethod === 'card' ? 'bold' : 'normal',
                  backgroundColor: paymentMethod === 'card' ? '#f0f0f0' : 'transparent',
                  listStyle: 'none',
                  paddingLeft: '15px',
                  paddingRight: '40px'
                }}
              >
                <i className="fa fa-credit-card" style={{ marginRight: '10px', color: paymentMethod === 'card' ? '#000' : '#666' }}></i>
                Cartão de Crédito
                {paymentMethod === 'card' && (
                  <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '14px' }}>
                    <i className="fa fa-check-circle"></i> Selecionado
                  </span>
                )}
                <span className="accordion-btn" style={{ marginLeft: 'auto', paddingRight: '10px', right: '11px' }}></span>
              </button>
            </h2>
            <div
              id="cardPayment"
              className={`accordion-collapse collapse ${paymentMethod === 'card' ? 'show' : ''}`}
              aria-labelledby="checkoutCard"
              data-bs-parent="#checkoutAccordion"
            >
              <div className="accordion-body">
                <PaymentCardElement
                  stripe={stripe}
                  cardError={error}
                  cart_products={cart_products}
                  isCheckoutSubmit={isCheckoutSubmit}
                />
              </div>
            </div>
          </div>

          {/* PIX - TEMPORARIAMENTE OCULTO */}
          {false && (
          <div className="accordion-item" style={{ 
            border: paymentMethod === 'pix' ? '2px solid #000' : '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '10px',
            backgroundColor: paymentMethod === 'pix' ? '#f9f9f9' : 'white'
          }}>
            <h2 className="accordion-header" id="checkoutPix" style={{ listStyle: 'none' }}>
              <button
                className={`accordion-button ${paymentMethod === 'pix' ? '' : 'collapsed'}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#pixPayment"
                aria-expanded={paymentMethod === 'pix'}
                aria-controls="pixPayment"
                onClick={() => setPaymentMethod('pix')}
                style={{ 
                  fontWeight: paymentMethod === 'pix' ? 'bold' : 'normal',
                  backgroundColor: paymentMethod === 'pix' ? '#f0f0f0' : 'transparent',
                  listStyle: 'none',
                  paddingLeft: '15px',
                  paddingRight: '40px'
                }}
              >
                <i className="fa fa-qrcode" style={{ marginRight: '10px', color: paymentMethod === 'pix' ? '#000' : '#666' }}></i>
                PIX
                {paymentMethod === 'pix' && (
                  <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '14px' }}>
                    <i className="fa fa-check-circle"></i> Selecionado
                  </span>
                )}
                <span className="accordion-btn" style={{ marginLeft: 'auto', paddingRight: '10px', right: '11px' }}></span>
              </button>
            </h2>
            <div
              id="pixPayment"
              className={`accordion-collapse collapse ${paymentMethod === 'pix' ? 'show' : ''}`}
              aria-labelledby="checkoutPix"
              data-bs-parent="#checkoutAccordion"
            >
              <div className="accordion-body">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{
                    backgroundColor: '#e8f5e9',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                  }}>
                    <i className="fa fa-qrcode" style={{ fontSize: '40px', color: '#00D4AA', marginBottom: '10px', display: 'block' }}></i>
                    <p style={{ marginBottom: '10px', fontWeight: '500', color: '#2e7d32' }}>
                      Pagamento instantâneo via PIX
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '0' }}>
                      Ao clicar em "Gerar QR Code PIX", você será redirecionado para a página de pagamento com o QR Code para escanear.
                    </p>
                  </div>
                  
                  
                  <div className="order-button-payment">
                    <button
                      type="submit"
                      className="tp-btn"
                      disabled={cart_products.length === 0 || isCheckoutSubmit}
                      style={{ backgroundColor: '#00D4AA', minWidth: '250px' }}
                    >
                      {isCheckoutSubmit ? (
                        <>
                          <i className="fa fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                          Gerando QR Code...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-qrcode" style={{ marginRight: '10px' }}></i>
                          Gerar QR Code PIX
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Boleto */}
          <div className="accordion-item" style={{ 
            border: paymentMethod === 'boleto' ? '2px solid #000' : '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '10px',
            backgroundColor: paymentMethod === 'boleto' ? '#f9f9f9' : 'white'
          }}>
            <h2 className="accordion-header" id="checkoutBoleto" style={{ listStyle: 'none' }}>
              <button
                className={`accordion-button ${paymentMethod === 'boleto' ? '' : 'collapsed'}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#boletoPayment"
                aria-expanded={paymentMethod === 'boleto'}
                aria-controls="boletoPayment"
                onClick={() => setPaymentMethod('boleto')}
                style={{ 
                  fontWeight: paymentMethod === 'boleto' ? 'bold' : 'normal',
                  backgroundColor: paymentMethod === 'boleto' ? '#f0f0f0' : 'transparent',
                  listStyle: 'none',
                  paddingLeft: '15px',
                  paddingRight: '40px'
                }}
              >
                <i className="fa fa-file-invoice" style={{ marginRight: '10px', color: paymentMethod === 'boleto' ? '#000' : '#666' }}></i>
                Boleto Bancário
                {paymentMethod === 'boleto' && (
                  <span style={{ marginLeft: '10px', color: '#28a745', fontSize: '14px' }}>
                    <i className="fa fa-check-circle"></i> Selecionado
                  </span>
                )}
                <span className="accordion-btn" style={{ marginLeft: 'auto', paddingRight: '10px', right: '11px' }}></span>
              </button>
            </h2>
            <div
              id="boletoPayment"
              className={`accordion-collapse collapse ${paymentMethod === 'boleto' ? 'show' : ''}`}
              aria-labelledby="checkoutBoleto"
              data-bs-parent="#checkoutAccordion"
            >
              <div className="accordion-body">
                <div style={{ padding: '20px' }}>
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: '20px',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}>
                    <i className="fa fa-barcode" style={{ fontSize: '40px', color: '#1a237e', marginBottom: '10px', display: 'block' }}></i>
                    <p style={{ marginBottom: '10px', fontWeight: '500', color: '#1565c0' }}>
                      Pagamento via Boleto Bancário
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '0' }}>
                      Ao clicar em "Gerar Boleto", você será redirecionado para a página com o código de barras e opção de imprimir o boleto. Vencimento em 3 dias.
                    </p>
                  </div>
                  
                  {/* Campo CPF obrigatório para Boleto */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '8px', 
                      fontWeight: '500',
                      color: '#333',
                    }}>
                      CPF/CNPJ <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      {...register("cpf", { 
                        required: paymentMethod === 'boleto' ? "CPF/CNPJ é obrigatório para boleto" : false,
                        pattern: {
                          value: /^(\d{11}|\d{14}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/,
                          message: "CPF ou CNPJ inválido"
                        }
                      })}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: errors?.cpf ? '2px solid #dc3545' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        outline: 'none',
                      }}
                    />
                    {errors?.cpf && (
                      <p style={{ color: '#dc3545', fontSize: '13px', marginTop: '5px' }}>
                        {errors.cpf.message}
                      </p>
                    )}
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      O CPF/CNPJ é obrigatório para gerar boletos bancários.
                    </p>
                  </div>

                  <div className="order-button-payment text-center">
                    <button
                      type="submit"
                      className="tp-btn"
                      disabled={cart_products.length === 0 || isCheckoutSubmit}
                      style={{ backgroundColor: '#1a237e', minWidth: '250px' }}
                    >
                      {isCheckoutSubmit ? (
                        <>
                          <i className="fa fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                          Gerando Boleto...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-barcode" style={{ marginRight: '10px' }}></i>
                          Gerar Boleto
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderArea;
