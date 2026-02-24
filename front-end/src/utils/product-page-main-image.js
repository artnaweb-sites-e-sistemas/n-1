/**
 * Imagem para listagens (home, grid, modal): mockup.
 * Usa product.image (no JSON estão os mockups restaurados do commit).
 * NÃO usar na página interna do produto (lá é capa reta via getProductPageMainImageUrl).
 * @param {object} product
 * @returns {string}
 */
export function getListingImageUrl(product) {
  if (!product) return "";
  const image = product.image;
  const images = product.images || [];
  if (image && String(image).trim() !== "") return String(image).trim();
  if (images.length > 0 && images[0]) return String(images[0]).trim();
  return "";
}

/**
 * Extrai a URL da primeira <img src="..."> do HTML.
 * Usado quando catalogImages está vazio mas a capa reta está na descrição (ex.: Ueinzz).
 */
function getFirstImageSrcFromHtml(html) {
  if (!html || typeof html !== "string") return "";
  const match = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return match && match[1] ? match[1].trim() : "";
}

/**
 * URL da imagem principal = primeira imagem da descrição (capa reta).
 * Para produtos do catálogo: usar a primeira imagem da descrição (catalogImages[0] ou extrair do HTML quando catalogImages vazio).
 * Exceção: "Nas brechas..." usa a segunda imagem.
 * @param {object} product
 * @returns {string}
 */
export function getProductPageMainImageUrl(product) {
  if (!product) return "";

  const catalogImages = product.catalogImages || [];
  const catalogContent = product.catalogContent || "";
  const image = product.image;
  const images = product.images || [];

  if (product.source === "catalog") {
    // 1) Exceção: "Nas brechas..." usa a segunda imagem da descrição (catalog_xxx_1_catalog_image_product_2.png)
    const nasBrechasId = "catalog-nas-brechas-futuros-cancelados";
    const isNasBrechas =
      product._id === nasBrechasId ||
      product.id === nasBrechasId ||
      (product.slug && product.slug.includes("nas-brechas-de-futuros-cancelados"));
    if (isNasBrechas && catalogImages.length > 1) return catalogImages[1].trim();

    // 2) Primeira imagem da descrição = primeira <img> no HTML (capa reta)
    const firstFromHtml = getFirstImageSrcFromHtml(catalogContent);
    if (firstFromHtml && firstFromHtml.startsWith("/images/")) return firstFromHtml;

    // 3) Se não tem img no HTML, usar catalogImages[0]
    if (catalogImages.length > 0 && catalogImages[0]) return catalogImages[0].trim();

    // 3) Fallback
    if (image && String(image).trim() !== "") return String(image).trim();
    if (images.length > 0 && images[0]) return String(images[0]).trim();
    return "";
  }

  if (image && String(image).trim() !== "") return String(image).trim();
  if (images.length > 0 && images[0]) return String(images[0]).trim();
  return "";
}

/**
 * Remove da HTML do catálogo a primeira ocorrência da <img> com o src indicado,
 * para não duplicar a capa na descrição (já exibida como imagem principal).
 * @param {string} html - catalogContent HTML
 * @param {string} imageUrlToRemove - URL da imagem a remover (ex: /images/catalog_xxx_0.png)
 * @returns {string}
 */
export function removeMainImageFromCatalogHtml(html, imageUrlToRemove) {
  if (!html || !imageUrlToRemove || typeof html !== "string") return html || "";

  const escaped = imageUrlToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const imgRegex = new RegExp(
    '<img[^>]*src=["\']?' + escaped + '["\']?[^>]*/?>',
    "i"
  );
  return html.replace(imgRegex, "");
}
