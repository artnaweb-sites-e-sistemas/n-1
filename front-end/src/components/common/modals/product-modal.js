'use client'
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
// internal
import { Compare, CartTwo, Times, HeartTwo } from "@svg/index";
import SocialLinks from "@components/social";
import OldNewPrice from "@components/products/old-new-price";
import Quantity from "@components/products/quantity";
import ProductCategories from "@components/products/product-categories";
import ProductTags from "@components/products/product-tags";
import { add_cart_product, initialOrderQuantity } from "src/redux/features/cartSlice";
import Link from "next/link";
import { add_to_wishlist } from "src/redux/features/wishlist-slice";
import { Modal } from "react-bootstrap";
import { handleModalShow } from "src/redux/features/productSlice";

const ProductModal = () => {
  const { product, isShow } = useSelector((state) => state.product);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { _id, image, relatedImages, images, title, tags, SKU, price, discount, originalPrice, sku, inStock } = product || {};
  
  // Garantir que a imagem principal existe, senão usar placeholder
  const mainImage = image && image.trim() !== '' 
    ? image 
    : (images && images.length > 0 ? images[0] : 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp');
  
  // Usar images se relatedImages não existir
  const productImages = (relatedImages && Array.isArray(relatedImages) && relatedImages.length > 0) 
    ? relatedImages 
    : (images && Array.isArray(images) && images.length > 0 ? images : [mainImage]);
  
  const [activeImg, setActiveImg] = useState(mainImage);
  const dispatch = useDispatch();
  const isWishlistAdded = wishlist.some((item) => item._id === _id);
  
  if(!product) return null;
  
  // Atualizar activeImg quando mainImage mudar
  useEffect(() => {
    setActiveImg(mainImage);
  }, [mainImage]);

  // handle add product
  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };
  // initial Order Quantity
  // handle add wishlist
  const handleAddWishlist = (prd) => {
    dispatch(add_to_wishlist(prd));
  };
  // handle modal close 
  const handleModalClose = () => {
    dispatch(handleModalShow())
    dispatch(initialOrderQuantity())
  }

  return (
    <Modal
      show={isShow}
      onHide={() => dispatch(handleModalShow())}
      className="product__modal"
      centered={true}
    >
      <div className="product__modal-wrapper">
        <div className="product__modal-close">
          <button
            className="product__modal-close-btn"
            type="button"
            onClick={() => handleModalClose()}
          >
            <Times />
          </button>
        </div>
        <div className="row">
          <div className="col-lg-6">
            <div className="product__modal-thumb-wrapper">
              <div className="product__details-thumb-tab mr-40">
                <div className="product__details-thumb-content w-img">
                  <div className="tab-content" id="nav-tabContent">
                    <div className="active-img">
                      <Image
                        priority
                        src={activeImg || mainImage}
                        alt="image"
                        width={510}
                        height={485}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  </div>
                </div>
                {productImages && productImages.length > 1 && (
                  <div className="product__details-thumb-nav tp-tab">
                    <nav>
                      <div className="nav nav-tabs justify-content-sm-between">
                        {productImages.map((img, i) => (
                          <button
                            key={i}
                            className={`nav-link ${img === activeImg ? "active" : ""
                              }`}
                            onClick={() => setActiveImg(img)}
                          >
                            <Image
                              priority
                              src={img}
                              alt="image"
                              width={90}
                              height={90}
                              style={{ width: "100%", height: "100%" }}
                            />
                          </button>
                        ))}
                      </div>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="product__details-wrapper">
              <h3 className="product__details-title">{title}</h3>
              <p className="mt-20">
                Compre na N-1 Edições com os melhores preços. Frete grátis em pedidos
                acima de R$ 200 ou retire na loja física.
              </p>
              {/* Price */}
              <OldNewPrice
                originalPrice={originalPrice}
                discount={discount}
              />
              {/* Price */}

              {/* quantity */}
              <Quantity />
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
                  className={`product-action-btn ${isWishlistAdded ? "active" : ""
                    }`}
                >
                  <HeartTwo />
                  <span className="product-action-tooltip">
                    Adicionar à Lista de Desejos
                  </span>
                </button>
                <Link href={product?.slug ? `/livros/${product.slug}` : `/product-details/${_id}`}>
                  <button type="button" className="product-action-btn">
                    <i className="fa-solid fa-link"></i>
                    <span className="product-action-tooltip">
                      Detalhes do Produto
                    </span>
                  </button>
                </Link>
              </div>
              <div className="product__details-sku product__details-more">
                <p>SKU:</p>
                <span>{sku}</span>
              </div>
              {/* Product Categories */}
              <ProductCategories />
              {/* Product Categories */}

              {/* Tags */}
              <ProductTags tag={tags} />
              {/* Tags */}
              <div className="product__details-share">
                <span>Share:</span>
                <SocialLinks />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ProductModal;
