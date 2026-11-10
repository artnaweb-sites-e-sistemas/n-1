import React from "react";
import { useSelector } from "react-redux";

const CouponForm = ({handleCouponCode,couponRef,clearCoupon,isCouponVerified,isValidatingCoupon,isCheckoutSubmit}) => {
  const { coupon_info } = useSelector((state) => state.coupon);
  return (
    <form onSubmit={handleCouponCode}>
      {coupon_info?.couponCode ? (
        <div>
          <p>{isCouponVerified ? "Cupom aplicado" : "Preencha seu e-mail e aguarde a validação do cupom."}</p>
          <button type="button" onClick={clearCoupon} disabled={isCheckoutSubmit}>
            Remover cupom
          </button>
        </div>
      ) : (
        <p className="checkout-coupon">
          <input ref={couponRef} type="text" placeholder="Código do Cupom" />
          <button className="tp-btn" type="submit" disabled={isValidatingCoupon || isCheckoutSubmit}>
            {isValidatingCoupon ? "Validando..." : "Aplicar Cupom"}
          </button>
        </p>
      )}
    </form>
  );
};

export default CouponForm;
