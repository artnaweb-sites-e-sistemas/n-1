import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const SingleCategory = ({ item }) => {
  const router = useRouter();
  
  // Garantir que a imagem existe, senão usar placeholder
  const categoryImage = (item?.img && item.img.trim() !== '') 
    ? item.img 
    : 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp';
  
  const categoryName = item?.parent || item?.name || 'Categoria';
  
  return (
    <div className="product__category-item mb-20 text-center">
      <div className="product__category-thumb w-img">
        <a
          onClick={() =>
            router.push(
              `/shop?Category=${categoryName
                .toLowerCase()
                .replace("&", "")
                .split(" ")
                .join("-")}`
            )
          }
          style={{ cursor: "pointer" }}
        >
          <Image
            src={categoryImage}
            alt={categoryName}
            width={272}
            height={181}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </a>
      </div>
      <div className="product__category-content">
        <h3 className="product__category-title">
          <a
            onClick={() =>
              router.push(
                `/shop?Category=${categoryName
                  .toLowerCase()
                  .replace("&", "")
                  .split(" ")
                  .join("-")}`
              )
            }
            style={{ cursor: "pointer" }}
          >
            {categoryName}
          </a>
        </h3>
      </div>
    </div>
  );
};

export default SingleCategory;
