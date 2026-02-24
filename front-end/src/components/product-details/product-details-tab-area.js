import React from "react";
import PrdDetailsDescription from "./prd-details-description";

const ProductDetailsTabArea = ({product}) => {
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
                  <PrdDetailsDescription product={product} />
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
