import React from "react";

const CouponUpdateCart = () => {
  return (
    <div className="coupon-all">
      <div className="coupon">
        <input
          id="coupon_code"
          className="input-text"
          name="coupon_code"
          placeholder="Código do cupom"
          type="text"
        />
        <button
          className="tp-btn tp-btn-black"
          name="apply_coupon"
          type="submit"
        >
          Aplicar cupom
        </button>
      </div>
      <div className="coupon2">
        <button
          className="tp-btn tp-btn-black"
          name="update_cart"
          type="submit"
        >
          Atualizar carrinho
        </button>
      </div>
    </div>
  );
};

export default CouponUpdateCart;
