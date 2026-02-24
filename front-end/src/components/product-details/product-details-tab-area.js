import React from "react";
import PrdDetailsDescription from "./prd-details-description";
import { getProductPageMainImageUrl } from "src/utils/product-page-main-image";

const ProductDetailsTabArea = ({ product }) => {
  const mainImageUrl = getProductPageMainImageUrl(product);
  return (
    <section className="product__details-tab-area pb-50">
      <div className="container">
        <div className="row">
          <div className="col-xl-12">
            <div className="product__details-tab-content">
              <div className="tab-content" id="nav-tabContent-info">
                <div
                  className="tab-pane active"
                  id="nav-desc"
                >
                  <PrdDetailsDescription product={product} mainImageUrl={mainImageUrl} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailsTabArea;
