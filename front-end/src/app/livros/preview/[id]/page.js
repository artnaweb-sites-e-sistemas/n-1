import ShopDetailsMainArea from "@components/product-details/product-details-area-main";
import { API_BASE_URL } from "@lib/env";

export const metadata = {
  title: "N-1 Edições — Pré-visualização",
  robots: {
    index: false,
    follow: false,
  },
};

const previewBannerStyle = {
  position: "sticky",
  top: 0,
  zIndex: 9999,
  width: "100%",
  padding: "12px 16px",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: 600,
  letterSpacing: "0.02em",
};

const errorWrapStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "60vh",
  flexDirection: "column",
  gap: "12px",
  padding: "40px 20px",
  textAlign: "center",
};

async function fetchPreviewProduct(id, token, exp) {
  if (!id || !token || !exp) {
    return { error: "missing", status: 403 };
  }

  const apiUrl = `${API_BASE_URL()}/api/products/preview/${encodeURIComponent(
    id
  )}?token=${encodeURIComponent(token)}&exp=${encodeURIComponent(exp)}`;

  try {
    const response = await fetch(apiUrl, { cache: "no-store" });

    if (response.status === 403) {
      return { error: "forbidden", status: 403 };
    }

    if (!response.ok) {
      return { error: "not_found", status: response.status };
    }

    const product = await response.json();
    if (!product || (!product.id && !product._id)) {
      return { error: "not_found", status: 404 };
    }

    return { product };
  } catch (err) {
    console.error("[PreviewPage] Erro ao buscar preview:", err);
    return { error: "network", status: 500 };
  }
}

export default async function ProductPreviewPage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const id = resolvedParams?.id;
  const token = resolvedSearch?.token;
  const exp = resolvedSearch?.exp;

  const result = await fetchPreviewProduct(id, token, exp);

  if (result.error) {
    const isForbidden =
      result.error === "forbidden" || result.error === "missing";

    return (
      <>
        <div style={previewBannerStyle}>
          Pré-visualização — produto não publicado
        </div>
        <div style={errorWrapStyle}>
          <p style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>
            {isForbidden
              ? "Link de pré-visualização inválido ou expirado"
              : "Não foi possível carregar a pré-visualização"}
          </p>
          <p style={{ maxWidth: "480px", margin: 0, color: "#444" }}>
            {isForbidden
              ? 'Volte ao WordPress e clique novamente em "Visualizar produto" no admin do WooCommerce para gerar um novo link.'
              : "Tente novamente em alguns instantes ou gere um novo link no WordPress."}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={previewBannerStyle}>
        Pré-visualização — produto não publicado
      </div>
      <ShopDetailsMainArea product={result.product} />
    </>
  );
}
