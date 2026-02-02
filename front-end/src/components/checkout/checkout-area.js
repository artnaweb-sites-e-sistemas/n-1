'use client';
import React, { useState } from "react";
// internal
import BillingDetails from "./billing-details";
import OrderArea from "./order-area";

const CheckoutArea = ({handleSubmit,submitHandler,watch,isCalculatingShipping,setValue,isDirectCheckout,onDirectProductRemove,...others}) => {
  return (
    <section className="checkout-area pb-85">
      <div className="container">
        <form onSubmit={handleSubmit(submitHandler)}>
          <div className="row">
            <div className="col-lg-6">
              <div className="checkbox-form">
                <h3>Detalhes de Cobrança</h3>
                {/* billing details start*/}
                <BillingDetails {...others} watch={watch} isCalculatingShipping={isCalculatingShipping} setValue={setValue} />
                {/* billing details end*/}
              </div>
            </div>
            <div className="col-lg-6">
              {/* order area start */}
              <OrderArea
                {...others}
                isDirectCheckout={isDirectCheckout}
                onDirectProductRemove={onDirectProductRemove}
              />
              {/* order area end */}
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CheckoutArea;
