import React, { useState, useEffect } from "react";
// internal
import Loader from "@components/loader/loader";
import SingleProduct from "@components/products/single-product";

const RelatedProducts = ({ product }) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) {
        setIsLoading(false);
        return;
      }

      try {
        // Buscar todos os produtos do catálogo
        const response = await fetch('/api/catalog-products?per_page=999');
        const data = await response.json();
        const allProducts = data.products || [];

        // Obter autores do produto atual
        const currentAuthors = (product.authors || product.author || '').toLowerCase();
        const currentId = product._id || product.id || product.sku;

        // Filtrar produtos do mesmo autor (excluindo o atual)
        let related = [];

        if (currentAuthors) {
          // Separar autores por vírgula, "e", ou ";"
          const authorsList = currentAuthors.split(/[,;]|(?:\s+e\s+)/).map(a => a.trim()).filter(Boolean);

          related = allProducts.filter(p => {
            // Não incluir o produto atual
            if ((p._id || p.id || p.sku) === currentId) return false;

            const pAuthors = (p.authors || p.author || '').toLowerCase();
            if (!pAuthors) return false;

            // Verificar se tem algum autor em comum
            return authorsList.some(author => 
              pAuthors.includes(author) && author.length > 3
            );
          });
        }

        // Limitar a 4 produtos
        setRelatedProducts(related.slice(0, 4));
      } catch (error) {
        console.error('Erro ao buscar produtos relacionados:', error);
      }

      setIsLoading(false);
    };

    fetchRelated();
  }, [product]);

  // Se não houver produtos relacionados, não renderizar a seção
  if (!isLoading && relatedProducts.length === 0) {
    return null;
  }

  return (
    <React.Fragment>
      <section className="product__related-area pb-80">
        <div className="container">
          <div className="row">
            <div className="col-xl-12">
              <div className="section__title-wrapper-13 mb-35">
                <h3 className="section__title-13">Mais do mesmo autor</h3>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xl-12">
              <div className="product__related-slider">
                <div className="row">
                  {isLoading ? (
                    <Loader loading={isLoading} />
                  ) : (
                    relatedProducts.map((relatedProduct) => (
                      <div key={relatedProduct._id || relatedProduct.sku} className="col-lg-3 col-md-6">
                        <SingleProduct product={relatedProduct} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </React.Fragment>
  );
};

export default RelatedProducts;
