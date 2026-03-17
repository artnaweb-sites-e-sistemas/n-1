import React from "react";

const ProductDetailsPrice = ({ price, discount }) => {
  const formatPrice = (value) => {
    return Number(value).toFixed(2).replace('.', ',');
  };

  return (
    <div
      className="product__details-price"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {discount > 0 ? (
        <>
          <span
            className="product__details-ammount old-ammount"
            style={{ verticalAlign: "middle" }}
          >
            R${formatPrice(price)}
          </span>
          <span
            className="product__details-ammount new-ammount"
            style={{ verticalAlign: "middle" }}
          >
            R$
            {formatPrice(
              Number(price) - (Number(price) * Number(discount)) / 100
            )}
          </span>
          <span
            className="product__details-offer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              transform: "none",
              lineHeight: 1,
            }}
          >
            -{discount}%
          </span>
        </>
      ) : (
        <>
          <span className="product__details-ammount new-ammount">
            R${formatPrice(price)}
          </span>
        </>
      )}
    </div>
  );
};

export default ProductDetailsPrice;
