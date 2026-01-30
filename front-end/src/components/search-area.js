'use client';
import { useState, useEffect } from "react";
// internal
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import ShopCta from "@components/cta";
import Footer from "@layout/footer";
import NiceSelect from "@ui/NiceSelect";
import ErrorMessage from "@components/error-message/error";
import SingleProduct from "@components/products/single-product";
import ProductLoader from "@components/loader/product-loader";
import EmptyCart from "@components/common/sidebar/cart-sidebar/empty-cart";
import LoadMoreBtn from "@components/load-more-btn";
import BreadcrumbTwo from "@components/common/breadcrumb/breadcrumb-2";

// Função para remover acentos e normalizar texto
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

// Função de busca inteligente
const smartSearch = (product, searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') return false;
  
  const normalizedSearch = normalizeText(searchTerm);
  const searchTerms = normalizedSearch.split(/\s+/).filter(t => t.length > 0);
  
  // Se não houver termos válidos, retornar false
  if (searchTerms.length === 0) return false;
  
  // Campos para buscar (prioridade: título > autor > outros)
  const searchFields = [
    product.title || '',
    product.bookTitle || '',
    product.originalTitle || '',
    product.author || '',
    product.authors || '',
    product.translation || '',
    product.isbn || '',
    product.sku || '',
    product.slug || '',
    product.categories?.join(' ') || '',
    product.description || '',
  ].filter(field => field).map(field => normalizeText(String(field)));
  
  // Se houver apenas um termo, buscar em qualquer campo
  if (searchTerms.length === 1) {
    const term = searchTerms[0];
    return searchFields.some(field => field.includes(term));
  }
  
  // Se houver múltiplos termos, verificar se todos aparecem em algum campo
  // (permitir que termos diferentes estejam em campos diferentes)
  return searchTerms.every(term => 
    searchFields.some(field => field.includes(term))
  );
};

export default function SearchAreaMain({ searchText }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [shortValue, setShortValue] = useState("");
  const perView = 8;
  const [next, setNext] = useState(perView);

  // Buscar todos os produtos do catálogo
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        
        // Buscar todos os produtos do catálogo (usar per_page grande para pegar todos)
        const response = await fetch('/api/catalog-products?per_page=999');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar produtos');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // selectShortHandler
  const shortHandler = (e) => {
    setShortValue(e.value);
  };

  //   handleLoadMore
  const handleLoadMore = () => {
    setNext((value) => value + 4);
  };

  // Filtrar produtos com busca inteligente
  let product_items = [];
  if (searchText && searchText.trim() !== '') {
    product_items = products.filter((prd) => smartSearch(prd, searchText));
  } else {
    product_items = products;
  }

  // Ordenação por preço
  if (shortValue === "Price low to high" || shortValue === "Preço: menor para maior") {
    product_items = product_items
      .slice()
      .sort((a, b) => {
        const priceA = Number(a.price || a.originalPrice || 0);
        const priceB = Number(b.price || b.originalPrice || 0);
        return priceA - priceB;
      });
  }
  // Price high to low / Preço: maior para menor
  if (shortValue === "Price high to low" || shortValue === "Preço: maior para menor") {
    product_items = product_items
      .slice()
      .sort((a, b) => {
        const priceA = Number(a.price || a.originalPrice || 0);
        const priceB = Number(b.price || b.originalPrice || 0);
        return priceB - priceA;
      });
  }

  // decide what to render
  let content = null;
  if (isLoading) {
    content = <ProductLoader loading={isLoading} />;
  }

  if (!isLoading && isError) {
    content = <ErrorMessage message="Ocorreu um erro ao buscar produtos" />;
  }

  if (!isLoading && !isError && product_items.length === 0) {
    content = (
      <div className="pb-100">
        <EmptyCart search_prd={true} />
      </div>
    );
  }

  if (!isLoading && !isError && product_items.length > 0) {
    content = (
      <section className="shop__area pb-60 pt-100">
        <div className="container">
          <div className="shop__top mb-50">
            <div className="row align-items-center">
              <div className="col-lg-6 col-md-5">
                <div className="shop__result">
                  <p>Total de {product_items.length} itens encontrados</p>
                </div>
              </div>
              <div className="col-lg-6 col-md-7">
                <div className="shop__sort d-flex flex-wrap justify-content-md-end align-items-center">
                  <div className="shop__sort-item">
                    <div className="shop__sort-select">
                      <NiceSelect
                        options={[
                          { value: "Ordenar por Preço", text: "Ordenar por Preço" },
                          {
                            value: "Preço: menor para maior",
                            text: "Preço: menor para maior",
                          },
                          {
                            value: "Preço: maior para menor",
                            text: "Preço: maior para menor",
                          },
                        ]}
                        defaultCurrent={0}
                        onChange={shortHandler}
                        name="Ordenar por Preço"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="shop__main">
            <div className="row">
              {product_items?.slice(0, next)?.map((product) => (
                <div
                  key={product._id || product.sku || product.id}
                  className="col-xl-3 col-lg-4 col-md-6 col-sm-6"
                >
                  <SingleProduct product={product} />
                </div>
              ))}
            </div>
          </div>
          {next < product_items?.length && (
            <div className="row">
              <div className="col-xxl-12">
                <LoadMoreBtn handleLoadMore={handleLoadMore} />
              </div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <Wrapper>
      <Header style_2={true}/>
      <BreadcrumbTwo title="Resultado da Busca" />
      {content}
      <ShopCta />
      <Footer />
    </Wrapper>
  );
}
