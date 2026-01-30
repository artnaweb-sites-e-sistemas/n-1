'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getProductUrl } from "src/utils/product-url";
import styles from './product-cover-card.module.scss';

const ProductCoverCard = ({ product }) => {
  const { _id, image, title } = product || {};
  const productUrl = getProductUrl(product, _id);

  const productImage = image && image.trim() !== ''
    ? image
    : 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp';

  // Determine if the image is local to use unoptimized prop
  const isLocalImage = productImage.startsWith('/images/');

  return (
    <div className={styles.productCoverCard}>
      <Link
        href={productUrl}
        className={styles.productLink}
        aria-label={`Ver detalhes de ${title || 'produto'}`}
      >
        <div className={styles.imageContainer}>
          <Image
            src={productImage}
            alt={title || "Capa do livro"}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={styles.productImage}
            priority={false}
            unoptimized={isLocalImage}
          />
          {/* Overlay appears only on desktop hover */}
          <div className={styles.overlay}>
            <h3 className={styles.productTitle}>{title}</h3>
          </div>
        </div>
        {/* Nome abaixo da capa apenas no mobile (acessibilidade) */}
        <div className={styles.mobileTitle}>
          <h3 className={styles.productTitleMobile}>{title}</h3>
        </div>
      </Link>
    </div>
  );
};

export default ProductCoverCard;
