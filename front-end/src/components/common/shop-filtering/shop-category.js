import React from "react";
import { useRouter } from "next/navigation";
// internal
import ErrorMessage from "@components/error-message/error";
import { useGetCategoriesQuery } from "src/redux/features/categoryApi";
import ShopCategoryLoader from "@components/loader/shop-category-loader";

const ShopCategory = () => {
  const router = useRouter();
  const { data: categories, isLoading, isError } = useGetCategoriesQuery();
  // decide what to render
  let content = null;

  if (isLoading) {
    content = (
      <ShopCategoryLoader loading={isLoading}/>
    );
  }

  if (!isLoading && isError) {
    content = <ErrorMessage message="Ocorreu um erro" />;
  }

  if (!isLoading && !isError && categories?.categories?.length === 0) {
    content = <ErrorMessage message="Nenhuma categoria encontrada!" />;
  }

  if (!isLoading && !isError && categories?.categories?.length > 0) {
    const category_items = categories.categories;
    content = category_items.map((category, i) => {
      // Se a categoria tem estrutura antiga (parent/children), usa ela
      // Senão, adapta para a estrutura do WooCommerce (name/slug)
      const categoryName = category.parent || category.name || 'Categoria';
      const children = category.children || [];
      
      return (
        <div key={category._id || category.id || i} className="card">
          <div className="card-header white-bg" id={`heading-${i + 1}`}>
            <h5 className="mb-0">
              <button
                className={`shop-accordion-btn ${i === 0 ? "" : "collapsed"}`}
                data-bs-toggle="collapse"
                data-bs-target={`#collapse-${i + 1}`}
                aria-expanded={i === 0 ? "true" : "false"}
                aria-controls={`#collapse-${i + 1}`}
              >
                {categoryName}
              </button>
            </h5>
          </div>

          <div
            id={`collapse-${i + 1}`}
            className={`accordion-collapse collapse ${i === 0 ? "show" : ""}`}
            aria-labelledby={`heading-${i + 1}`}
            data-bs-parent="#accordion-items"
          >
            <div className="card-body">
              <div className="categories__list">
                <ul>
                  {children.length > 0 ? (
                    children.map((item, idx) => (
                      <li key={idx}>
                        <a
                          onClick={() =>
                            router.push(
                              `/shop?category=${typeof item === 'string' ? item : item.name || item.slug
                                .toLowerCase()
                                .replace("&", "")
                                .split(" ")
                                .join("-")}`
                            )
                          }
                          style={{ cursor: "pointer", textTransform: "capitalize" }}
                        >
                          {typeof item === 'string' ? item : item.name || item.slug}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li>
                      <a
                        onClick={() =>
                          router.push(
                            `/shop?category=${(category.slug || categoryName)
                              .toLowerCase()
                              .replace("&", "")
                              .split(" ")
                              .join("-")}`
                          )
                        }
                        style={{ cursor: "pointer", textTransform: "capitalize" }}
                      >
                        {categoryName}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  return (
    <div className="accordion-item">
      <div className="sidebar__widget-content">
        <div className="categories">
          <div id="accordion-items">{content}</div>
        </div>
      </div>
    </div>
  );
};

export default ShopCategory;
