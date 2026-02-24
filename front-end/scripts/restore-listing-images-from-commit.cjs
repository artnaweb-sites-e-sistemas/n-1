/**
 * Restaura product.image e product.images[0] do último commit (onde a home estava correta)
 * para que listagens (home, grid, modal) voltem a exibir os mockups.
 * A página interna do produto continua usando getProductPageMainImageUrl() = capa reta.
 *
 * Uso: node scripts/restore-listing-images-from-commit.cjs
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..", "..");
const CATALOG_PATH = path.join(__dirname, "..", "src", "data", "catalog-products.json");
const COMMIT_REF = "8b086cf";

function main() {
  console.log("Obtendo catalog do commit", COMMIT_REF, "...");
  const catalogCommitJson = execSync(
    `git show ${COMMIT_REF}:front-end/src/data/catalog-products.json`,
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, cwd: ROOT }
  );
  const catalogFromCommit = JSON.parse(catalogCommitJson);

  const listingById = new Map();
  for (const p of catalogFromCommit) {
    const id = p._id || p.id;
    if (!id) continue;
    const img = p.image && String(p.image).trim() ? p.image : (p.images && p.images[0]) || null;
    if (img) listingById.set(id, { image: img, images0: img });
  }

  console.log("Lendo catálogo atual:", CATALOG_PATH);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));

  let updated = 0;
  for (const product of catalog) {
    const id = product._id || product.id;
    const ref = listingById.get(id);
    if (!ref) continue;

    let changed = false;
    if (product.image !== ref.image) {
      product.image = ref.image;
      changed = true;
    }
    if (product.images && product.images.length > 0) {
      if (product.images[0] !== ref.images0) {
        product.images[0] = ref.images0;
        changed = true;
      }
    } else {
      product.images = [ref.images0];
      changed = true;
    }
    if (changed) {
      updated++;
      console.log("  ", (product.title || id).slice(0, 50), "->", ref.image);
    }
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf8");
  console.log("Pronto. Produtos com image/images[0] restaurados:", updated);
}

main();
