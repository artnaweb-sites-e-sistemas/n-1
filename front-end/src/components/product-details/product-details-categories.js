import React from "react";

const ProductDetailsCategories = ({name}) => {
  // Ocultar se não houver categoria
  if (!name || name === 'Uncategorized') {
    return null;
  }

  return (
    <div className="product__details-categories product__details-more">
      <p>Categoria:</p>
      <span>
        <a href="#">{" "}{name}</a>
      </span>
    </div>
  );
};

export default ProductDetailsCategories;
