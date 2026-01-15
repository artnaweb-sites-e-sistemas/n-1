import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";

const ShopColor = ({ all_products }) => {
  const [isChecked, setIsChecked] = useState("");
  const searchParams = useSearchParams();
  const color = searchParams.get("color");
  const router = useRouter();
  
  // Verificar se all_products existe e é um array
  if (!all_products || !Array.isArray(all_products)) {
    return null;
  }
  
  // Filtrar produtos com cores válidas e mapear cores
  const all_colors = all_products
    .filter((prd) => prd && prd.colors && Array.isArray(prd.colors))
    .map((prd) => prd.colors.map((c) => c));
  
  const colors = [...new Set(all_colors.flat())].filter(Boolean);

  // handle color
  const handleColors = (value) => {
    // Verificar se value existe e é uma string válida
    if (!value || typeof value !== 'string') {
      return;
    }
    
    if (isChecked === value) {
      setIsChecked("");
      router.push(`/shop`);
    } else {
      setIsChecked(value);
      router.push(`/shop?color=${value.toLowerCase()}`);
    }
  };

  return (
    <div className="accordion-item">
      <h2 className="accordion-header" id="color__widget">
        <button
          className="accordion-button"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#color_widget_collapse"
          aria-expanded="true"
          aria-controls="color_widget_collapse"
        >
          Color
        </button>
      </h2>
      <div
        id="color_widget_collapse"
        className="accordion-collapse collapse show"
        aria-labelledby="color__widget"
        data-bs-parent="#shop_color"
      >
        <div className="accordion-body">
          <div
            className="shop__widget-list"
            style={{ height: "180px", overflowY: "auto" }}
          >
            {colors.length > 0 ? (
              colors.map((clr, i) => {
                // Verificar se clr existe e é uma string válida
                if (!clr || typeof clr !== 'string') {
                  return null;
                }
                
                const clrLower = clr.toLowerCase();
                
                return (
                  <div key={i} className={`shop__widget-list-item-2 has-${clrLower}`}>
                    <input
                      type="checkbox"
                      id={`c-${clrLower}-${i}`}
                      checked={color === clrLower ? "checked" : false}
                      readOnly
                    />
                    <label
                      onClick={() => handleColors(clr)}
                      htmlFor={`c-${clrLower}-${i}`}
                      className="text-capitalize"
                    >
                      {clr}
                    </label>
                  </div>
                );
              })
            ) : (
              <p className="text-muted">Nenhuma cor disponível</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopColor;
