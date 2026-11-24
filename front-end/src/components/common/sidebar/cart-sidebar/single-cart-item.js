import React from "react";
import Image from "next/image";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { remove_product } from "src/redux/features/cartSlice";
import { getProductUrl } from "src/utils/product-url";
import { isProductSoldOut, SOLD_OUT_LABEL } from "src/utils/product-stock";

const SingleCartItem = ({ item }) => {
  const { _id, image, originalPrice, title, orderQuantity, discount } =
    item || {};
  const productUrl = getProductUrl(item, _id);
  const soldOut = isProductSoldOut(item);
  const dispatch = useDispatch();

  // handle remove cart
  const handleRemoveProduct = (prd) => {
    dispatch(remove_product(prd));
  };
  return (
    <div className="cartmini__widget-item">
      {image && (
        <div className="cartmini__thumb">
          <Link href={productUrl}>
            <Image src={image} alt="cart img" width={70} height={90} />
          </Link>
        </div>
      )}
      <div className="cartmini__content">
        <h5>
          <Link href={productUrl}>{title}</Link>
        </h5>
        {soldOut && (
          <p role="status" style={{ color: "#721c24", fontSize: 12, margin: "4px 0 0" }}>
            {SOLD_OUT_LABEL}
          </p>
        )}
        <div className="cartmini__price-wrapper">
          {!discount && (
            <span className="cartmini__price">R${Number(originalPrice).toFixed(2).replace('.', ',')}</span>
          )}
          {discount > 0 && (
            <span className="cartmini__price">
              R$
              {((originalPrice - (originalPrice * discount) / 100) *
                orderQuantity).toFixed(2).replace('.', ',')}
            </span>
          )}
          <span className="cartmini__quantity">x{orderQuantity}</span>
        </div>
      </div>
      <button
        className="cartmini__del"
        onClick={() => handleRemoveProduct(item)}
      >
        <i className="fal fa-times"></i>
      </button>
    </div>
  );
};

export default SingleCartItem;
