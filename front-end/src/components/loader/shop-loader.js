import React from "react";
import Loader from "./loader";
import styles from "./shop-loader.module.scss";

// product single loader - simula o tamanho de um produto
function ProductGridLoader({ loading }) {
  return (
    <div className="product__item p-relative transition-3 mb-50">
      <div className="product__thumb w-img p-relative fix">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ 
            height: "100%", 
            width: "100%",
            backgroundColor: "#f0f0f0",
            aspectRatio: "2 / 3"
          }}
        >
          <Loader loading={loading} />
        </div>
      </div>
    </div>
  );
}

const ShopLoader = ({ loading }) => {
  // 20 loaders (4 colunas x 5 linhas) - alinhado ao grid do catálogo
  const loaders = Array.from({ length: 20 }, (_, index) => (
    <div key={index} className={styles.item}>
      <ProductGridLoader loading={loading} />
    </div>
  ));

  return (
    <section className="shop__area pt-100 pb-60">
      <div className="container">
        <div className="shop__main">
          <div className="col-12">
            <div className={styles.shopLoaderGrid}>
              {loaders}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopLoader;
