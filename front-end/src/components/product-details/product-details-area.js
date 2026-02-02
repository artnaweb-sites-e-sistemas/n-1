import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
// internal
import { HeartTwo, CartTwo, RightArrow, Payment } from "@svg/index";
import { SocialShare } from "@components/social";
import ProductDetailsPrice from "./product-details-price";
import ProductQuantity from "./product-quantity";
import ProductDetailsCategories from "./product-details-categories";
import ProductDetailsTags from "./product-details-tags";
import ProductDetailsMetadata from "./product-details-metadata";
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
  // Priorizar o campo 'image' que é a capa principal
  let mainImage = '';
  
  if (product?.image && product.image.trim() !== '') {
    // Usar o campo image primeiro (capa principal)
    mainImage = product.image;
  } else if (image && image.trim() !== '') {
    // Se product.image não existir, usar o image desestruturado
    mainImage = image;
  } else if (images && images.length > 0) {
    // Se não tiver image, usar a primeira do array
    mainImage = images[0];
  } else {
    // Fallback para placeholder
    mainImage = 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp';
  }
  

  // Usar images se relatedImages não existir
  let productImages = relatedImages || images || [];
  
  // Para produtos do catálogo, incluir todas as imagens (capa + imagens internas)
  if (product?.source === 'catalog') {
    const catalogImages = product?.catalogImages || [];
    // Começar com todas as imagens do array images (inclui capa + outras)
    const allImages = images && images.length > 0 ? images : (image ? [image] : []);
    // Filtrar imagens válidas do array images
    const validImages = allImages.filter(img => img && typeof img === 'string' && img.trim() !== '');
    // Adicionar imagens internas do catálogo (evitar duplicatas exatas)
    const uniqueCatalogImages = catalogImages.filter(img => {
      if (!img || typeof img !== 'string' || img.trim() === '') return false;
      // Verificar se a imagem não está já no array validImages (comparação exata)
      return !validImages.includes(img);
    });
    // Combinar todas as imagens: primeiro a capa, depois as outras de images, depois catalogImages
    productImages = [...validImages, ...uniqueCatalogImages];
  }

  const [activeImg, setActiveImg] = useState(mainImage);
  useEffect(() => {
    // Atualizar imagem ativa quando mainImage mudar
    if (mainImage) {
      setActiveImg(mainImage);
    }
  }, [mainImage]);

  const dispatch = useDispatch();
  const router = useRouter();
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart_products } = useSelector((state) => state.cart);
  const isWishlistAdded = wishlist.some((item) => item._id === _id);
  const isAddedToCart = cart_products.some((item) => item._id === _id);

  // handle add product
  const handleAddProduct = (prd) => {
    dispatch(add_cart_product(prd));
  };

  // handle go to cart
  const handleGoToCart = () => {
    router.push('/cart');
  };

  // handle go to checkout with single product (direct checkout)
  const handleAddToCartAndCheckout = (prd) => {
    // Salvar produto no sessionStorage para checkout direto
    // Garantir que tem orderQuantity
    const productForCheckout = {
      ...prd,
      orderQuantity: prd.orderQuantity || 1
    };
    sessionStorage.setItem('directCheckoutProduct', JSON.stringify(productForCheckout));
    // Redirecionar direto para checkout sem adicionar ao carrinho
    router.push('/checkout?direct=true');
  };

  // handle add wishlist
  const handleAddWishlist = (prd) => {
    dispatch(add_to_wishlist(prd));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .product-cart-btn-hover svg {
          display: inline-block;
          vertical-align: middle;
          transform: translateY(-1px);
          transition: transform 0.3s ease-in-out;
        }
        .product-cart-btn-hover:hover svg {
          transform: translateY(-1px) translateX(5px);
        }
        .product-cart-btn-hover {
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease !important;
        }
        .product-cart-btn-hover:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4) !important;
          background-color: #059669 !important;
        }
        .product-cart-btn-hover:active {
          transform: translateY(0) !important;
        }
        .product-cart-btn-hover:active svg {
          transform: translateY(-1px) translateX(2px);
        }
        .product-checkout-btn-hover svg {
          display: inline-block;
          vertical-align: middle;
          transform: translateY(-1px);
          transition: transform 0.3s ease-in-out;
        }
        .product-checkout-btn-hover:hover svg {
          transform: translateY(-1px) translateX(5px);
        }
        .product-checkout-btn-hover:active svg {
          transform: translateY(-1px) translateX(2px);
        }
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-2px) scale(1.05); }
        }
        .product-cart-icon-shake:hover svg {
          animation: gentleBounce 0.5s ease-in-out;
        }
        .product-cart-icon-shake:hover {
          background-color: var(--tp-common-black) !important;
          color: var(--tp-common-white) !important;
        }
        .product-cart-icon-shake svg,
        .product-checkout-btn-hover svg {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
      `}} />
      <section className="product__details-area pb-115">
        <div className="container">
          <div className="row">
            <div className="col-xl-7 col-lg-6">
              <div className="product__details-thumb-tab mr-70">
                <div className="product__details-thumb-content w-img product-main-image-container">
                  <div>
                    {mainImage && (
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
                        priority
                        onError={(e) => {
                          // Fallback se a imagem falhar
                          e.target.src = 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp';
                        }}
                      />
                    )}
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
                          // Determinar se a imagem é local para usar unoptimized
                          const isLocalImage = img.startsWith('/images/');
                          return (
                            <button
                              key={`${img}-${i}`}
                              onClick={() => setActiveImg(img)}
                              className={activeImg === img ? "nav-link active" : "nav-link"}
                            >
                              <Image 
                                src={img} 
                                alt={`product image ${i + 1}`} 
                                width={110} 
                                height={110}
                                unoptimized={isLocalImage}
                                style={{ objectFit: 'contain' }}
                                onError={(e) => {
                                  // Fallback se a imagem falhar
                                  e.target.src = 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp';
                                }}
                              />
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

                <div className="product__details-action d-flex align-items-center gap-2" style={{ width: '100%' }}>
                  {isAddedToCart ? (
                    <>
                      <button
                        onClick={handleGoToCart}
                        type="button"
                        className="product-add-cart-btn product-add-cart-btn-3 product-cart-btn-hover"
                        style={{
                          backgroundColor: '#10b981',
                          borderColor: '#10b981',
                          color: '#ffffff',
                          opacity: 1,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          verticalAlign: 'middle',
                          flex: 1,
                          justifyContent: 'center'
                        }}
                      >
                        Ir para o Carrinho
                        <RightArrow />
                      </button>
                      <button
                        onClick={() => handleAddWishlist(product)}
                        type="button"
                        className={`product-action-btn ${isWishlistAdded ? "active" : ""
                          }`}
                        style={{ flexShrink: 0 }}
                      >
                        <HeartTwo />
                        <span className="product-action-tooltip">
                          Adicionar à Lista de Desejos
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => handleAddProduct(product)}
                            type="button"
                            className="product-add-cart-btn product-add-cart-btn-3 product-cart-icon-shake"
                            disabled={!inStock}
                            style={{
                              opacity: inStock ? 1 : 0.5,
                              cursor: inStock ? 'pointer' : 'not-allowed',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
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
                        </div>
                        <button
                          onClick={() => handleAddToCartAndCheckout(product)}
                          type="button"
                          className="product-add-cart-btn product-add-cart-btn-3 product-checkout-btn-hover"
                          disabled={!inStock}
                          style={{
                            opacity: inStock ? 1 : 0.5,
                            cursor: inStock ? 'pointer' : 'not-allowed',
                            backgroundColor: '#10b981',
                            borderColor: '#10b981',
                            color: '#ffffff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          Ir direto para o pagamento
                          <Payment />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <div className="product__details-sku product__details-more">
                  <p>SKU:</p>
                  <span>{sku}</span>
                </div>
                {/* ProductDetailsCategories */}
                <ProductDetailsCategories name={product?.category?.name} />
                {/* ProductDetailsCategories */}

                {/* Product Metadata (Título, Autor, Ano, etc.) */}
                <ProductDetailsMetadata product={product} />
                {/* Product Metadata */}

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
    </>
  );
};

export default ProductDetailsArea;
