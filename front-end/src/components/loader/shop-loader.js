import React from "react";
import Loader from "./loader";

// product single loader - simula o tamanho de um produto
function ProductGridLoader({ loading }) {
  return (
    <div className="product__item p-relative transition-3 mb-50">
      <div className="product__thumb w-img p-relative fix">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ 
            height: "100%", 
            minHeight: "400px",
            width: "100%",
            backgroundColor: "#f8f8f8",
            aspectRatio: "960/1125"
          }}
        >
          <Loader loading={loading} />
        </div>
      </div>
      <div className="product__content">
        <div
          className="d-flex align-items-center justify-content-center"
          style={{ 
            minHeight: "60px",
            width: "100%",
            padding: "10px 0"
          }}
        >
          <Loader loading={loading} />
        </div>
      </div>
    </div>
  );
}

const ShopLoader = ({ loading }) => {
  // Criar array com 25 loaders (5 colunas x 5 linhas)
  const loaders = Array.from({ length: 25 }, (_, index) => (
    <div key={index}>
      <ProductGridLoader loading={loading} />
    </div>
  ));

  return (
    <section className="shop__area pt-100 pb-60">
      <div className="container">
        <div className="shop__main">
          <div className="row">
            <div className="col-12">
              <div className="shop__tab-content mb-40">
                <div className="tab-content" id="shop_tab_content">
                  <div
                    className="tab-pane fade show active"
                    id="nav-grid"
                    role="tabpanel"
                    aria-labelledby="nav-grid-tab"
                  >
                    {/* shop grid com 25 loaders */}
                    <div className="row shop-grid-5-columns">
                      {loaders}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShopLoader;
