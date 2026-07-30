/**
 * Imagem para listagens (home, grid, modal).
 * Prefere product.imageThumb (tamanho menor); senão product.image.
 * NÃO usar na página interna do produto.
 * @param {object} product
 * @returns {string}
 */
export function getListingImageUrl(product) {
  if (!product) return "";
  const imageThumb = product.imageThumb;
  const image = product.image;
  const images = product.images || [];
  if (imageThumb && String(imageThumb).trim() !== "") return String(imageThumb).trim();
  if (image && String(image).trim() !== "") return String(image).trim();
  if (images.length > 0 && images[0]) return String(images[0]).trim();
  return "";
}

/**
 * Extrai a URL da primeira <img src="..."> do HTML.
 */
function getFirstImageSrcFromHtml(html) {
  if (!html || typeof html !== "string") return "";
  const match = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return match && match[1] ? match[1].trim() : "";
}

function isNasBrechasProduct(product) {
  const nasBrechasId = "catalog-nas-brechas-futuros-cancelados";
  return (
    product?._id === nasBrechasId ||
    product?.id === nasBrechasId ||
    (product?.slug && String(product.slug).includes("nas-brechas-de-futuros-cancelados"))
  );
}

/**
 * Basename do arquivo da URL (sem query/hash; sem sufixo -300x169).
 */
export function imageBasename(url) {
  if (!url || typeof url !== "string") return "";
  let pathPart = url.trim().split("?")[0].split("#")[0];
  try {
    if (/^https?:\/\//i.test(pathPart)) {
      pathPart = new URL(pathPart).pathname;
    }
  } catch (_) {
    // keep pathPart
  }
  const name = (pathPart.split("/").pop() || "").trim();
  return name.replace(/-\d+x\d+(\.[a-zA-Z0-9]+)$/i, "$1").toLowerCase();
}

/**
 * URL da imagem principal da página do produto.
 * - Catálogo estático (source === "catalog"): 1ª <img> do catalogContent
 * - WooCommerce (migrado): 1ª imagem da galeria = images[1]
 * @param {object} product
 * @returns {string}
 */
export function getProductPageMainImageUrl(product) {
  if (!product) return "";

  const catalogImages = product.catalogImages || [];
  const catalogContent = product.catalogContent || "";
  const image = product.image;
  const images = Array.isArray(product.images) ? product.images : [];

  // Produtos ainda no catálogo estático
  if (product.source === "catalog") {
    if (isNasBrechasProduct(product) && catalogImages.length > 1) {
      return catalogImages[1].trim();
    }

    const firstFromHtml = getFirstImageSrcFromHtml(catalogContent);
    if (firstFromHtml) return firstFromHtml;

    if (catalogImages.length > 0 && catalogImages[0]) return String(catalogImages[0]).trim();
    if (image && String(image).trim() !== "") return String(image).trim();
    if (images.length > 0 && images[0]) return String(images[0]).trim();
    return "";
  }

  // WooCommerce: destacada = images[0]/image; mockup = images[1] (1ª da galeria)
  if (images.length > 1 && images[1] && String(images[1]).trim() !== "") {
    return String(images[1]).trim();
  }
  if (image && String(image).trim() !== "") return String(image).trim();
  if (images.length > 0 && images[0]) return String(images[0]).trim();
  return "";
}

/**
 * Remove da HTML a PRIMEIRA <img> cujo src tenha o mesmo basename da imagem principal.
 * Casa URL do WP (.../uploads/.../foo.png) com /images/foo.png no catalogContent.
 * @param {string} html
 * @param {string} imageUrlToRemove
 * @returns {string}
 */
export function removeMainImageFromCatalogHtml(html, imageUrlToRemove) {
  if (!html || !imageUrlToRemove || typeof html !== "string") return html || "";

  const targetBase = imageBasename(imageUrlToRemove);
  if (!targetBase) return html;

  const imgTagRegex = /<img\b[^>]*>/gi;
  let match;
  while ((match = imgTagRegex.exec(html)) !== null) {
    const tag = match[0];
    const srcMatch = tag.match(/\ssrc=["']([^"']+)["']/i);
    if (!srcMatch) continue;
    if (imageBasename(srcMatch[1]) === targetBase) {
      return html.slice(0, match.index) + html.slice(match.index + tag.length);
    }
  }

  return html;
}
