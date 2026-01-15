import React from "react";
import Image from "next/image";
import Link from "next/link";
// internal
import { CartTwo, Compare, Eye, HeartTwo } from "@svg/index";
import { RatingFull, RatingHalf } from "./rating";
import { useDispatch } from "react-redux";
import { initialOrderQuantity } from "src/redux/features/cartSlice";
import { setProduct } from "src/redux/features/productSlice";
import { getProductUrl } from "src/utils/product-url";

const SingleListProduct = ({ product }) => {
  const { _id, image, title, price, discount, inStock } = product || {};
  const productUrl = getProductUrl(product, _id);
  // handle dispatch
  const dispatch = useDispatch();
  
  // Garantir que a imagem existe, senão usar placeholder
  const productImage = image && image.trim() !== '' 
    ? image 
    : 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp';

  // handle quick view
  const handleQuickView = (prd) => {
    dispatch(initialOrderQuantity())
    dispatch(setProduct(prd))
  };

  return (
    <React.Fragment>
      <div className="product__list-item mb-30">
        <div className="row">
          <div className="col-xl-5 col-lg-5">
            <div className="product__thumb product__list-thumb p-relative fix m-img">
              <Link href={productUrl}>
                <Image
                  src={productImage}
                  alt={title || "product image"}
                  width={335}
                  height={325}
                  style={{
                    width: "335px",
                    height: "325px",
                    objectFit: "cover",
                  }}
                />
              </Link>
              {discount > 0 && (
                <div className="product__badge d-flex flex-column flex-wrap">
                  <span className={`product__badge-item has-new`}>promoção</span>
                </div>
              )}
            </div>
          </div>
          <div className="col-xl-7 col-lg-7">
            <div className="product__list-content">
              <div className="product__rating product__rating-2 d-flex">
                <RatingFull />
                <RatingFull />
                <RatingFull />
                <RatingFull />
                <RatingHalf />
              </div>

              <h3 className="product__list-title">
                <Link href={productUrl}>{title}</Link>
              </h3>
              <div className="product__list-price">
                <span className="product__list-ammount">${price}</span>
              </div>
              <p>
                Compre na N-1 Edições com os melhores preços. Frete grátis em pedidos
                acima de R$ 200 ou retire na loja física.
              </p>

              <div className="product__list-action d-flex flex-wrap align-items-center">
                <button
                  type="button"
                  className="product-add-cart-btn product-add-cart-btn-2"
                  disabled={!inStock}
                  style={{
                    opacity: inStock ? 1 : 0.5,
                    cursor: inStock ? 'pointer' : 'not-allowed'
                  }}
                >
                  <CartTwo />
                  {inStock ? 'Adicionar ao Carrinho' : 'Fora de Estoque'}
                </button>
                <button
                  type="button"
                  className="product-action-btn product-action-btn-2"
                >
                  <HeartTwo />
                  <span className="product-action-tooltip">
                    Adicionar à Lista de Desejos
                  </span>
                </button>
                <button
                  onClick={() => handleQuickView(product)}
                  type="button"
                  className="product-action-btn"
                >
                  <Eye />
                  <span className="product-action-tooltip">Visualização Rápida</span>
                </button>

                <Link href={productUrl}>
                  <button
                    type="button"
                    className="product-action-btn product-action-btn-2"
                  >
                    <i className="fa-solid fa-link"></i>
                    <span className="product-action-tooltip">
                      Detalhes do Produto
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SingleListProduct;
