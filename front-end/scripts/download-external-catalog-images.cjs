/**
 * Extrai todas as URLs externas de imagens do catalog-products.json,
 * baixa cada uma para public/images/ e atualiza o JSON para usar /images/nome-arquivo.
 * Assim nenhuma imagem depende de site externo.
 *
 * Uso: node scripts/download-external-catalog-images.cjs
 */

const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const CATALOG_JSON_PATH = path.join(__dirname, "..", "src", "data", "catalog-products.json");
const IMAGES_DIR = path.join(__dirname, "..", "public", "images");

// Todas as URLs de imagem externas (incl. variantes -200x300)
const IMG_URL_REGEX = /https?:\/\/[^"'\s]+\.(?:jpe?g|png|gif|webp)(?:\?[^"']*)?/gi;

function extractUniqueImageUrls(text) {
  const seen = new Set();
  const list = [];
  let m;
  const re = new RegExp(IMG_URL_REGEX.source, "gi");
  while ((m = re.exec(text)) !== null) {
    let fullUrl = m[0];
    const q = fullUrl.indexOf("?");
    if (q !== -1) fullUrl = fullUrl.slice(0, q);
    if (seen.has(fullUrl)) continue;
    seen.add(fullUrl);
    const baseUrl = fullUrl.replace(/\-\d+x\d+\.(jpe?g|png|gif|webp)$/i, ".$1");
    list.push({ fullUrl, baseUrl });
  }
  const byBase = new Map();
  list.forEach(({ fullUrl, baseUrl }) => {
    if (!byBase.has(baseUrl)) byBase.set(baseUrl, []);
    byBase.get(baseUrl).push(fullUrl);
  });
  return byBase;
}

function downloadToFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const req = protocol.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadToFile(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`${url} => ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function safeFilename(baseUrl, indexByBase) {
  const base = path.basename(baseUrl);
  let name = base.replace(/\-\d+x\d+\.(jpe?g|png|gif|webp)$/i, (_, ext) => "." + ext);
  if (indexByBase[name] !== undefined) {
    indexByBase[name]++;
    const ext = path.extname(name);
    name = path.basename(name, ext) + "_" + indexByBase[name] + ext;
  } else {
    indexByBase[name] = 0;
  }
  return name;
}

async function main() {
  console.log("Lendo", CATALOG_JSON_PATH);
  let text = fs.readFileSync(CATALOG_JSON_PATH, "utf8");

  const byBase = extractUniqueImageUrls(text);
  const bases = Array.from(byBase.keys());
  console.log("Imagens externas (bases) encontradas:", bases.length);

  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }

  const urlToLocal = new Map();
  const indexByBase = {};

  for (let i = 0; i < bases.length; i++) {
    const baseUrl = bases[i];
    const variants = byBase.get(baseUrl);
    const localName = safeFilename(baseUrl, indexByBase);
    const localPath = path.join(IMAGES_DIR, localName);
    const publicUrl = "/images/" + localName;

    if (fs.existsSync(localPath)) {
      console.log(`[${i + 1}/${bases.length}] Já existe: ${localName}`);
    } else {
      try {
        const buf = await downloadToFile(baseUrl);
        fs.writeFileSync(localPath, buf);
        console.log(`[${i + 1}/${bases.length}] Baixado: ${baseUrl} -> ${localName}`);
      } catch (err) {
        console.error(`[${i + 1}/${bases.length}] Erro ${baseUrl}:`, err.message);
        continue;
      }
    }

    urlToLocal.set(baseUrl, publicUrl);
    variants.forEach((v) => urlToLocal.set(v, publicUrl));
  }

  let newText = text;
  const sorted = Array.from(urlToLocal.entries()).sort((a, b) => b[0].length - a[0].length);
  for (const [externalUrl, localUrl] of sorted) {
    const escaped = externalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    newText = newText.replace(new RegExp(escaped, "g"), localUrl);
  }

  fs.writeFileSync(CATALOG_JSON_PATH, newText, "utf8");
  console.log("Catálogo atualizado: todas as referências passaram a usar /images/");

  const PLACEHOLDER_URL = "https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp";
  const placeholderPath = path.join(IMAGES_DIR, "placeholder.webp");
  if (!fs.existsSync(placeholderPath)) {
    try {
      const buf = await downloadToFile(PLACEHOLDER_URL);
      fs.writeFileSync(placeholderPath, buf);
      console.log("Placeholder baixado: placeholder.webp");
    } catch (e) {
      console.warn("Placeholder não baixado (opcional):", e.message);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
