"use client";
import Image from "next/image";
import dayjs from "dayjs";
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';

export default function InvoiceArea({innerRef,info}) {
    const { 
      name = '', 
      country = 'BR', 
      city = '', 
      contact = '', 
      invoice = '', 
      createdAt = '', 
      cart = [], 
      cardInfo = {}, 
      shippingCost = 0, 
      discount = 0, 
      totalAmount = 0 
    } = info || {};
    
    const cartItems = Array.isArray(cart) ? cart : [];
    const discountValue = typeof discount === 'number' ? discount : 0;
    const shippingValue = typeof shippingCost === 'number' ? shippingCost : 0;
    const totalValue = typeof totalAmount === 'number' ? totalAmount : 0;
    
  return (
    <div ref={innerRef} className="invoice__wrapper grey-bg-15 pt-40 pb-40 pl-40 pr-40 tp-invoice-print-wrapper">
      {/* <!-- invoice header --> */}
      <div className="invoice__header-wrapper border-2 border-bottom border-white mb-40">
        <div className="row">
          <div className="col-xl-12">
            <div className="invoice__header pb-20">
              <div className="row align-items-end">
                <div className="col-md-4 col-sm-6">
                  <div className="invoice__left">
                    <Image className="mb-15" priority src="/assets/img/logo/logo-n-1-black.png" alt="logo" width={80} height={28} />
                    <p>
                      Rua 7 de Abril, 235, Conjunto 105 <br /> República, São Paulo - SP
                    </p>
                  </div>
                </div>
                <div className="col-md-8 col-sm-6">
                  <div className="invoice__right mt-15 mt-sm-0 text-sm-end">
                    <h3 className="text-uppercase font-70 mb-20">Fatura</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <!-- invoice customer details --> */}
      <div className="invoice__customer mb-30">
        <div className="row">
          <div className="col-md-6 col-sm-8">
            <div className="invoice__customer-details">
              <h4 className="mb-10 text-uppercase">{name || 'Cliente'}</h4>
              <p className="mb-0 text-uppercase">{country || 'BR'}</p>
              <p className="mb-0 text-uppercase">{city}</p>
              <p className="mb-0">{contact}</p>
            </div>
          </div>
          <div className="col-md-6 col-sm-4">
            <div className="invoice__details mt-md-0 mt-20 text-md-end">
              <p className="mb-0">
                <strong>Nº do Pedido:</strong> #{invoice}
              </p>
              <p className="mb-0">
                <strong>Data:</strong> {createdAt ? dayjs(createdAt).format("DD/MM/YYYY") : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* <!-- invoice order table --> */}
      <div className="invoice__order-table pt-30 pb-30 pl-40 pr-40 bg-white  mb-30">
        <Table className="table">
          <Thead className="table-light">
            <Tr>
              <Th scope="col">#</Th>
              <Th scope="col">Produto</Th>
              <Th scope="col">Qtd</Th>
              <Th scope="col">Preço Unit.</Th>
              <Th scope="col">Total</Th>
            </Tr>
          </Thead>
          <Tbody className="table-group-divider">
            {cartItems.map((item, i) => {
              const itemPrice = item?.price || item?.originalPrice || 0;
              const quantity = item?.orderQuantity || 1;
              return (
                <Tr key={i}>
                  <Td>{i + 1}</Td>
                  <Td>{item?.title || 'Produto'}</Td>
                  <Td>{quantity}</Td>
                  <Td>R$ {Number(itemPrice).toFixed(2)}</Td>
                  <Td>R$ {(Number(itemPrice) * quantity).toFixed(2)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </div>

      {/* <!-- invoice total --> */}
      <div className="invoice__total pt-40 pb-10 alert-success pl-40 pr-40 mb-30">
        <div className="row">
          <div className="col-lg-3 col-md-4">
            <div className="invoice__payment-method mb-30">
              <h5 className="mb-0">Método de Pagamento</h5>
              <p className="tp-font-medium text-uppercase">{cardInfo?.type || 'Cartão de Crédito'}</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-4">
            <div className="invoice__shippint-cost mb-30">
              <h5 className="mb-0">Frete</h5>
              <p className="tp-font-medium">R$ {Number(shippingValue).toFixed(2)}</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-4">
            <div className="invoice__discount-cost mb-30">
              <h5 className="mb-0">Desconto</h5>
              <p className="tp-font-medium">R$ {Number(discountValue).toFixed(2)}</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-4">
            <div className="invoice__total-ammount mb-30">
              <h5 className="mb-0">Total</h5>
              <p className="tp-font-medium text-danger">
                <strong>R$ {Number(totalValue).toFixed(2)}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
