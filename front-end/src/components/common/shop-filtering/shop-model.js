'use client';
import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// internal
import { Search } from "@svg/index";

const ShopModel = ({ all_products }) => {
  // Filtrar marcas válidas (remover undefined/null)
  let all_brands = [...new Set(all_products.map((prd) => prd.brand?.name).filter(Boolean))];
  const [brands, setBrands] = useState(all_brands);
  const [isChecked, setIsChecked] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeBrand = searchParams.get("brand");

  // handle brand
  const handleBrand = (value) => {
    // Verificar se value existe e é uma string válida
    if (!value || typeof value !== 'string') {
      return;
    }
    
    if (isChecked === value) {
      setIsChecked("");
      router.push(`/shop`);
    } else {
      setIsChecked(value);
      router.push(
        `/shop?brand=${value
          .toLowerCase()
          .replace("&", "")
          .split(" ")
          .join("-")}`
      );
    }
  };

  // handleSubmit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchValue) {
      let searchBrands = all_brands.filter((b) =>
        b && typeof b === 'string' && b.toLowerCase().includes(searchValue.toLowerCase())
      );
      setBrands(searchBrands);
    } else {
      setBrands(all_brands);
    }
  };

  // handle search value
  const handleSearchValue = (event) => {
    const value = event.target.value;
    setSearchValue(value);
  };

  return (
    <div className="accordion" id="shop_model">
      <div className="accordion-item">
        <h2 className="accordion-header" id="model__widget">
          <button
            className="accordion-button"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#model_widget_collapse"
            aria-expanded="true"
            aria-controls="model_widget_collapse"
          >
            Brands
          </button>
        </h2>
        <div
          id="model_widget_collapse"
          className="accordion-collapse collapse show"
          aria-labelledby="model__widget"
          data-bs-parent="#shop_model"
        >
          <div className="accordion-body">
            <div className="shop__widget-search pt-10 pb-25">
              <form onSubmit={handleSubmit}>
                <div className="shop__widget-search-input">
                  <input
                    onChange={handleSearchValue}
                    type="text"
                    placeholder="Search brands"
                  />
                  <button type="submit">
                    <Search />
                  </button>
                </div>
              </form>
            </div>
            <div
              className="shop__widget-list"
              style={{
                height: brands.length > 2 && "120px",
                overflowY: "auto",
              }}
            >
              {brands.map((brand, i) => {
                // Verificar se brand existe e é uma string válida
                if (!brand || typeof brand !== 'string') {
                  return null;
                }
                
                const brandSlug = brand.toLowerCase().replace("&", "").split(" ").join("-");
                
                return (
                  <div key={i} className="shop__widget-list-item">
                    <input
                      type="checkbox"
                      id={brand}
                      checked={activeBrand === brandSlug ? "checked" : false}
                      readOnly
                    />
                    <label onClick={() => handleBrand(brand)} htmlFor={brand}>
                      {brand}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopModel;
