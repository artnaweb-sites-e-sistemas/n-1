import React, { useRef } from "react";
import { useSelector } from "react-redux";

const CouponForm = ({handleCouponCode,couponRef}) => {
  const { coupon_info } = useSelector((state) => state.coupon);
  return (
    <form onSubmit={handleCouponCode}>
      {coupon_info?.couponCode ? (
        <p>Cupom aplicado</p>
      ) : (
        <p className="checkout-coupon">
          <input ref={couponRef} type="text" placeholder="Código do Cupom" />
          <button className="tp-btn" type="submit">
            Aplicar Cupom
          </button>
        </p>
      )}
    </form>
  );
};

export default CouponForm;
