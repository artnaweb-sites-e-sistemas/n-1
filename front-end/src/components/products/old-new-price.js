import React from "react";

const OldNewPrice = ({originalPrice,discount}) => {
  return (
    <div className="product__price">
      <del className="product__ammount old-price">
        R${originalPrice.toFixed(2).replace('.', ',')}
      </del>
      <span className="product__ammount new-price">
        {" "}
        R$
        {(
          Number(originalPrice) -
          (Number(originalPrice) * Number(discount)) / 100
        ).toFixed(2).replace('.', ',')}
      </span>
    </div>
  );
};

export default OldNewPrice;
