import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
// internal
import { HeartTwo, CartTwo } from "@svg/index";
import { SocialShare } from "@components/social";
import ProductDetailsPrice from "./product-details-price";
import ProductQuantity from "./product-quantity";
import ProductDetailsCategories from "./product-details-categories";
import ProductDetailsTags from "./product-details-tags";
import { add_cart_product } from "src/redux/features/cartSlice";
import { add_to_wishlist } from "src/redux/features/wishlist-slice";

const ProductDetailsArea = ({ product }) => {
  const {
    _id,
    image,
    relatedImages,
    images,
    title,
    quantity,
    inStock,
    originalPrice,
    discount,
    tags,
    sku,
  } = product || {};
  
  // Garantir que a imagem principal existe, senão usar placeholder
  const mainImage = image && image.trim() !== '' 
    ? image 
    : (images && images.length > 0 ? images[0] : 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp');
  
  // Usar images se relatedImages não existir
  const productImages = relatedImages || images || [];
  
  const [activeImg, setActiveImg] = useState(mainImage);
  useEffect(() => {
    setActiveImg(mainImage);
  }, [mainImage]);

  const dispatch = useDispatch();
  const { wishlist } = useSelector((state) => state.wishlist);
  const isWishlistAdded = wishlist.some((item) => item._id === _id);

  // handle add product
  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };

  // handle add wishlist
  const handleAddWishlist = (prd) => {
    dispatch(add_to_wishlist(prd));
  };

  return (
    <section className="product__details-area pb-115">
      <div className="container">
        <div className="row">
          <div className="col-xl-7 col-lg-6">
            <div className="product__details-thumb-tab mr-70">
              <div className="product__details-thumb-content w-img product-main-image-container">
                <div>
                  <Image
                    src={activeImg || mainImage}
                    alt={title || "product details"}
                    width={960}
                    height={1125}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
              {productImages.length > 0 && (
                <div className="product__details-thumb-nav tp-tab">
                  <nav>
                    <div className="d-flex justify-content-start flex-wrap">
                      {productImages.map((img, i) => {
                        // Verificar se img existe e é uma string válida
                        if (!img || typeof img !== 'string' || img.trim() === '') {
                          return null;
                        }
                        return (
                          <button
                            key={i}
                            onClick={() => setActiveImg(img)}
                            className={activeImg === img ? "nav-link active" : ""}
                          >
                            <Image src={img} alt={`product image ${i + 1}`} width={110} height={110} />
                          </button>
                        );
                      })}
                    </div>
                  </nav>
                </div>
              )}
            </div>
          </div>
          <div className="col-xl-5 col-lg-6">
            <div className="product__details-wrapper">
              <div className="product__details-stock">
                <span className={inStock ? "in-stock" : "out-of-stock"}>
                  {inStock 
                    ? (quantity !== null && quantity !== undefined ? `${quantity} Em Estoque` : "Em Estoque")
                    : "Fora de Estoque"}
                </span>
              </div>
              <h3 className="product__details-title">{title}</h3>

              <p className="mt-20">
                Compre na N-1 Edições com os melhores preços. Frete grátis em pedidos
                acima de R$ 200 ou retire na loja física.
              </p>

              {/* Product Details Price */}
              <ProductDetailsPrice price={originalPrice} discount={discount} />
              {/* Product Details Price */}

              {/* quantity */}
              <ProductQuantity />
              {/* quantity */}

              <div className="product__details-action d-flex flex-wrap align-items-center">
                <button
                  onClick={() => handleAddProduct(product)}
                  type="button"
                  className="product-add-cart-btn product-add-cart-btn-3"
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
                  onClick={() => handleAddWishlist(product)}
                  type="button"
                  className={`product-action-btn ${
                    isWishlistAdded ? "active" : ""
                  }`}
                >
                  <HeartTwo />
                  <span className="product-action-tooltip">
                    Adicionar à Lista de Desejos
                  </span>
                </button>
              </div>
              <div className="product__details-sku product__details-more">
                <p>SKU:</p>
                <span>{sku}</span>
              </div>
              {/* ProductDetailsCategories */}
              <ProductDetailsCategories name={product?.category?.name} />
              {/* ProductDetailsCategories */}

              {/* Tags */}
              <ProductDetailsTags tag={tags} />
              {/* Tags */}

              <div className="product__details-share">
                <span>Compartilhar:</span>
                <SocialShare />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailsArea;
