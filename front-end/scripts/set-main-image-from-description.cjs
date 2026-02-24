/**
 * Atualiza o campo "image" (e images[0]) de cada produto do catálogo
 * para a primeira imagem da descrição (capa reta), assim a página do produto
 * exibe sempre a capa reta como imagem principal.
 *
 * Uso: node scripts/set-main-image-from-description.cjs
 */

const fs = require("fs");
const path = require("path");

const CATALOG_JSON_PATH = path.join(__dirname, "..", "src", "data", "catalog-products.json");

function getFirstImageSrcFromHtml(html) {
  if (!html || typeof html !== "string") return "";
  const match = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return match && match[1] ? match[1].trim() : "";
}

function getMainImageUrl(product) {
  if (!product || product.source !== "catalog") return null;

  const catalogImages = product.catalogImages || [];
  const catalogContent = product.catalogContent || "";

  // 1) Primeira imagem da descrição = primeira <img> no HTML (capa reta)
  const firstFromHtml = getFirstImageSrcFromHtml(catalogContent);
  if (firstFromHtml && firstFromHtml.startsWith("/images/")) return firstFromHtml;

  // 2) Se não tem img no HTML, usar catalogImages (exceção: Nas brechas usa a segunda)
  if (catalogImages.length > 0) {
    const nasBrechasId = "catalog-nas-brechas-futuros-cancelados";
    const isNasBrechas =
      product._id === nasBrechasId ||
      product.id === nasBrechasId ||
      (product.slug && product.slug.includes("nas-brechas-de-futuros-cancelados"));

    if (isNasBrechas && catalogImages.length > 1) return catalogImages[1].trim();
    return catalogImages[0].trim();
  }

  return product.image || (product.images && product.images[0]) || null;
}

function main() {
  console.log("Lendo", CATALOG_JSON_PATH);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON_PATH, "utf8"));

  let updated = 0;
  for (const product of catalog) {
    if (product.source !== "catalog") continue;

    const mainUrl = getMainImageUrl(product);
    if (!mainUrl || !mainUrl.startsWith("/images/")) continue;

    let changed = false;
    if (product.image !== mainUrl) {
      product.image = mainUrl;
      changed = true;
    }
    if (product.images && product.images.length > 0 && product.images[0] !== mainUrl) {
      product.images[0] = mainUrl;
      changed = true;
    } else if (product.images && product.images.length === 0) {
      product.images = [mainUrl];
      changed = true;
    } else if (!product.images || !Array.isArray(product.images)) {
      product.images = [mainUrl];
      changed = true;
    }

    if (changed) {
      updated++;
      console.log("  ", product.title?.slice(0, 50) || product._id, "->", mainUrl);
    }
  }

  fs.writeFileSync(CATALOG_JSON_PATH, JSON.stringify(catalog, null, 2), "utf8");
  console.log("Pronto. Produtos atualizados:", updated);
}

main();
