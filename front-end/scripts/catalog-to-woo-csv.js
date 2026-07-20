/**
 * Gera CSV de importação WooCommerce a partir de catalog-products.json.
 *
 * Uso:
 *   node scripts/catalog-to-woo-csv.js --report
 *   node scripts/catalog-to-woo-csv.js --lote-teste
 *   node scripts/catalog-to-woo-csv.js --completo
 *   node scripts/catalog-to-woo-csv.js --completo --split=50
 *   node scripts/catalog-to-woo-csv.js --skus=a,b,c --out scripts/out/lote.csv
 *   node scripts/catalog-to-woo-csv.js --limit=20 --out scripts/out/lote-01.csv
 *   node scripts/catalog-to-woo-csv.js --all --out scripts/out/catalogo-completo.csv
 *   node scripts/catalog-to-woo-csv.js --sku 9786561190572
 */

const fs = require('fs');
const path = require('path');

const CATALOG_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog-products.json');
const DEFAULT_OUT_DIR = path.join(__dirname, 'out');
const DEFAULT_COMPLETO_OUT = path.join(DEFAULT_OUT_DIR, 'catalogo-completo.csv');
const PENDENCIAS_ISBN_PATH = path.join(DEFAULT_OUT_DIR, 'pendencias-isbn.txt');
const IMAGE_BASE_URL = 'https://n-1-seven.vercel.app';
const HEAD_CONCURRENCY = 8;
const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://n-1.artnaweb.com.br/wp-json/n1/v1';

const CSV_HEADERS = [
  'Type',
  'SKU',
  'Name',
  'Published',
  'Visibility in catalog',
  'Short description',
  'Description',
  'In stock?',
  'Regular price',
  'Categories',
  'Tags',
  'Weight (kg)',
  'Length (cm)',
  'Width (cm)',
  'Height (cm)',
  'Images',
  'Slug',
  'meta:n1_book_title',
  'meta:n1_original_title',
  'meta:n1_author',
  'meta:n1_authors',
  'meta:n1_organization',
  'meta:n1_translation',
  'meta:n1_preparation',
  'meta:n1_revision',
  'meta:n1_year',
  'meta:n1_pages',
  'meta:n1_dimensions',
  'meta:n1_isbn',
  'meta:n1_catalog_pdf',
  'meta:n1_catalog_content',
];

const NAV_SKIP_TEXTS = new Set(['comprar', 'anterior', 'próximo', 'proximo']);

/** SKUs do lote-teste (cobre YouTube, Nas brechas, H₂O, description preenchida, comum). */
const LOTE_TESTE_SKUS = [
  '9786561190473', // YouTube: O desencadeamento do mundo
  '9786561190763', // Nas brechas (exceção de imagem + description preenchida)
  '9786561190558', // H₂O slug especial
  '9786561190626', // description preenchida (Coletânea...)
  '9786561190657', // comum (será resolvido dinamicamente se inválido)
];

function parseArgs(argv) {
  const args = {
    sku: null,
    slug: null,
    skus: null,
    limit: null,
    all: false,
    report: false,
    loteTeste: false,
    completo: false,
    split: null,
    out: null,
    skipHead: false,
    help: false,
    apiBase: DEFAULT_API_BASE,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--sku' && argv[i + 1]) {
      args.sku = String(argv[++i]).trim();
    } else if (arg.startsWith('--skus=')) {
      args.skus = arg
        .slice('--skus='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === '--skus' && argv[i + 1]) {
      args.skus = String(argv[++i])
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.slice('--limit='.length), 10);
    } else if (arg === '--limit' && argv[i + 1]) {
      args.limit = parseInt(argv[++i], 10);
    } else if (arg === '--slug' && argv[i + 1]) {
      args.slug = String(argv[++i]).trim();
    } else if (arg === '--all') {
      args.all = true;
    } else if (arg === '--report') {
      args.report = true;
    } else if (arg === '--lote-teste') {
      args.loteTeste = true;
    } else if (arg === '--completo') {
      args.completo = true;
    } else if (arg.startsWith('--split=')) {
      args.split = parseInt(arg.slice('--split='.length), 10);
    } else if (arg === '--split' && argv[i + 1]) {
      args.split = parseInt(argv[++i], 10);
    } else if (arg === '--skip-head') {
      args.skipHead = true;
    } else if (arg === '--out' && argv[i + 1]) {
      args.out = path.resolve(argv[++i]);
    } else if (arg.startsWith('--api=')) {
      args.apiBase = arg.slice('--api='.length).replace(/\/$/, '');
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  if (args.split != null && (!Number.isFinite(args.split) || args.split < 1)) {
    throw new Error('--split deve ser um inteiro >= 1');
  }

  return args;
}

function printHelp() {
  console.log(`Uso:
  node scripts/catalog-to-woo-csv.js --report
  node scripts/catalog-to-woo-csv.js --lote-teste
  node scripts/catalog-to-woo-csv.js --completo
  node scripts/catalog-to-woo-csv.js --completo --split=50
  node scripts/catalog-to-woo-csv.js --skus=sku1,sku2 --out scripts/out/lote.csv
  node scripts/catalog-to-woo-csv.js --limit=20 --out scripts/out/lote-01.csv
  node scripts/catalog-to-woo-csv.js --all --out scripts/out/catalogo-completo.csv
  node scripts/catalog-to-woo-csv.js --sku <sku> [--out <arquivo.csv>]

Opções:
  --completo     Exporta todos do catálogo exceto os já no Woo (SKU ou slug)
  --split=N      Divide o CSV em arquivos de N produtos
  --skip-head    Pula verificação HTTP HEAD das imagens
  --out <path>   Arquivo de saída (padrão --completo: scripts/out/catalogo-completo.csv)
  --help         Mostra esta ajuda`);
}

function escapeCsvField(value) {
  const str = value == null ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toAbsoluteImageUrl(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return null;
  const trimmed = imagePath.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${IMAGE_BASE_URL}${normalized}`;
}

function getFirstImageSrcFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return match && match[1] ? match[1].trim() : null;
}

function isNasBrechasProduct(product) {
  const nasBrechasId = 'catalog-nas-brechas-futuros-cancelados';
  return (
    product?._id === nasBrechasId ||
    product?.id === nasBrechasId ||
    (product?.slug && String(product.slug).includes('nas-brechas-de-futuros-cancelados'))
  );
}

/**
 * Mesma lógica de getProductPageMainImageUrl() para source === "catalog".
 * Usada como 2ª imagem (galeria) no CSV.
 */
function getCatalogPageImagePath(product) {
  const catalogImages = product.catalogImages || [];
  const catalogContent = product.catalogContent || '';

  if (isNasBrechasProduct(product) && catalogImages.length > 1) {
    return String(catalogImages[1]).trim();
  }

  const firstFromHtml = getFirstImageSrcFromHtml(catalogContent);
  if (firstFromHtml) return firstFromHtml;

  if (catalogImages.length > 0 && catalogImages[0]) {
    return String(catalogImages[0]).trim();
  }
  if (product.image) return String(product.image).trim();
  return null;
}

/**
 * Images CSV: [0] capa (destacada/vitrine), [1] imagem da página (galeria).
 */
function collectImages(product) {
  const cover = toAbsoluteImageUrl(product.image);
  if (!cover) return [];

  const pageRaw = getCatalogPageImagePath(product);
  const pageImg = toAbsoluteImageUrl(pageRaw);

  if (!pageImg || pageImg === cover) {
    return [cover];
  }
  return [cover, pageImg];
}

/**
 * Preserva o slug do catálogo exatamente após decode + subscritos + lowercase/trim.
 * NÃO remove hífens, palavras nem re-slugifica ASCII.
 */
function normalizeProductSlug(slug) {
  let s = String(slug || '').trim();
  if (!s) return '';

  let previous = '';
  while (s !== previous && s.includes('%')) {
    previous = s;
    try {
      s = decodeURIComponent(s);
    } catch (_) {
      break;
    }
  }

  return s
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/⁴/g, '4')
    .toLowerCase()
    .trim();
}

function splitImageUrls(imagesField) {
  return String(imagesField || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

const headCache = new Map();

async function headStatus(url) {
  if (headCache.has(url)) return headCache.get(url);
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    let status = res.status;
    if (status === 405 || status === 501) {
      const getRes = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { Range: 'bytes=0-0' },
      });
      status = getRes.status === 206 ? 200 : getRes.status;
    }
    headCache.set(url, status);
    return status;
  } catch (_) {
    headCache.set(url, 0);
    return 0;
  }
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, Math.max(items.length, 1)) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

/**
 * Verifica URLs; remove as que não retornam HTTP 200 (não aborta).
 */
async function filterReachableImageUrls(urls, { skipHead = false } = {}) {
  const list = (urls || []).filter(Boolean);
  if (skipHead || !list.length) {
    return { kept: list, removed: [] };
  }

  const unique = [...new Set(list)];
  const statusByUrl = new Map();
  await mapPool(unique, HEAD_CONCURRENCY, async (url) => {
    statusByUrl.set(url, await headStatus(url));
  });

  const kept = [];
  const removed = [];
  for (const url of list) {
    const status = statusByUrl.get(url);
    if (status === 200) {
      kept.push(url);
    } else {
      removed.push({ url, status: status || 0 });
    }
  }
  return { kept, removed };
}

function htmlToPlainText(htmlFragment) {
  return String(htmlFragment || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNavOrButtonText(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return true;
  if (NAV_SKIP_TEXTS.has(t)) return true;
  if (/^(comprar|anterior|pr[oó]ximo)(\s|$)/i.test(t) && t.length < 40) return true;
  return false;
}

function extractDescriptiveParagraph(catalogContent) {
  if (!catalogContent || typeof catalogContent !== 'string') return '';
  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(catalogContent)) !== null) {
    const text = htmlToPlainText(match[1]);
    if (!text || text.length <= 80) continue;
    if (isNavOrButtonText(text)) continue;
    if (/comprar/i.test(text) && /anterior/i.test(text) && /pr[oó]ximo/i.test(text)) continue;
    return text;
  }

  // Fallback: produtos sem <p> (layouts com div/span) — texto plano do HTML
  const plain = htmlToPlainText(catalogContent);
  if (!plain) return '';
  const parts = plain.split(/(?<=[.!?…])\s+/);
  let acc = '';
  for (const part of parts) {
    const t = String(part || '').trim();
    if (!t || isNavOrButtonText(t)) continue;
    if (/^(comprar|anterior|pr[oó]ximo)$/i.test(t)) continue;
    acc = acc ? `${acc} ${t}` : t;
    if (acc.length > 80 && !isNavPollutedDescription(acc)) {
      return acc.length > 2000 ? acc.slice(0, 2000).trim() : acc;
    }
  }
  if (acc.length > 40 && !isNavPollutedDescription(acc)) return acc;
  return '';
}

function isNavPollutedDescription(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (isNavOrButtonText(value)) return true;
  if (/^\s*comprar\b/i.test(value)) return true;
  // Trio clássico de navegação do catálogo (não confundir com "próximo" literário)
  if (
    /comprar/i.test(value) &&
    /\banterior\b/i.test(value) &&
    /\bpr[oó]ximo\b/i.test(value) &&
    value.length < 200
  ) {
    return true;
  }
  return false;
}

function resolveDescription(product) {
  const fromField = String(product.description || '').trim();
  if (fromField && !isNavPollutedDescription(fromField)) {
    return fromField;
  }
  const extracted = extractDescriptiveParagraph(product.catalogContent || '');
  if (extracted) {
    if (isNavPollutedDescription(extracted)) {
      throw new Error(
        `description extraída (sku=${product.sku || product._originalSku || '?'}): Description poluída com navegação`
      );
    }
    return extracted;
  }
  console.warn(
    `AVISO: description vazia para sku=${product.sku || product._originalSku || '?'} | ${product.title || ''}`
  );
  return '';
}

function assertCleanDescription(text, label) {
  const value = String(text || '');
  if (!value) {
    return; // vazio permitido (listado como aviso na geração)
  }
  if (isNavPollutedDescription(value)) {
    throw new Error(`${label}: Description poluída com navegação (Comprar/Anterior/Próximo)`);
  }
}

function joinList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String).join(', ');
  }
  if (value == null || value === '') return '';
  return String(value);
}

function formatRegularPrice(price) {
  if (price == null || price === '') return '';
  const num = Number(price);
  if (Number.isNaN(num)) return String(price).trim();
  return String(num);
}

/**
 * SKU do CSV usa o sku preparado (pode estar vazio em duplicatas).
 * Slug = normalizeProductSlug(product.slug) sem re-slugificar.
 * Images: usa product._images se já filtradas por HEAD.
 */
function productToRow(product) {
  const catalogContentExact = product.catalogContent == null ? '' : String(product.catalogContent);
  const description = resolveDescription(product);
  const shortDescription = description;
  const images = Array.isArray(product._images) ? product._images : collectImages(product);
  const slug = normalizeProductSlug(product.slug || '');

  return [
    'simple',
    product.sku ?? '',
    product.title ?? '',
    '1',
    'visible',
    shortDescription,
    description,
    '1',
    formatRegularPrice(product.price),
    joinList(product.categories),
    joinList(product.tags),
    '1',
    '21',
    '1.5',
    '28',
    images.join(', '),
    slug,
    product.bookTitle ?? '',
    product.originalTitle ?? '',
    product.author ?? '',
    product.authors ?? '',
    product.organization ?? '',
    product.translation ?? '',
    product.preparation ?? '',
    product.revision ?? '',
    product.year ?? '',
    product.pages ?? '',
    product.dimensions ?? '',
    product.isbn ?? '',
    product.catalogPdf ?? '',
    catalogContentExact,
  ];
}

function buildCsv(products) {
  const lines = [CSV_HEADERS.map(escapeCsvField).join(',')];
  for (const product of products) {
    lines.push(productToRow(product).map(escapeCsvField).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

function parseCsv(content) {
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      // ignore — CRLF handled by \n
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
    rows.pop();
  }

  return rows;
}

function findDuplicateSkus(products) {
  const bySku = new Map();
  for (const p of products) {
    const sku = String(p.sku ?? '').trim();
    if (!sku) continue;
    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku).push(p);
  }
  const dups = [];
  for (const [sku, items] of bySku) {
    if (items.length > 1) dups.push({ sku, items });
  }
  return dups;
}

/**
 * Primeiro produto (ordem do array) mantém o SKU; demais recebem SKU vazio.
 * Nunca duas linhas com o mesmo SKU não-vazio.
 */
function applyDuplicateSkuRule(products) {
  const seenSkus = new Set();
  const emptied = [];
  const prepared = products.map((p) => {
    const originalSku = String(p.sku ?? '').trim();
    if (!originalSku) {
      return { ...p, sku: '', _originalSku: '' };
    }
    if (seenSkus.has(originalSku)) {
      emptied.push({
        title: p.title || '',
        originalSku,
        slug: p.slug || '',
        id: p._id || p.id || '',
      });
      return { ...p, sku: '', _originalSku: originalSku };
    }
    seenSkus.add(originalSku);
    return { ...p, sku: originalSku, _originalSku: originalSku };
  });
  return { prepared, emptied };
}

function writePendenciasIsbn(emptied) {
  fs.mkdirSync(DEFAULT_OUT_DIR, { recursive: true });
  const lines = [
    'Pendências ISBN / SKU duplicado',
    `Gerado em: ${new Date().toISOString()}`,
    'Produtos que receberam SKU vazio na importação (2ª+ ocorrência do mesmo SKU):',
    '',
  ];
  if (!emptied.length) {
    lines.push('(nenhum)');
  } else {
    for (const item of emptied) {
      lines.push(
        `- título: ${item.title} | sku original: ${item.originalSku} | slug: ${item.slug} | id: ${item.id}`
      );
    }
  }
  fs.writeFileSync(PENDENCIAS_ISBN_PATH, lines.join('\n') + '\n', 'utf8');
  console.log(`Pendências ISBN gravadas: ${PENDENCIAS_ISBN_PATH} (${emptied.length} produto(s))`);
  return PENDENCIAS_ISBN_PATH;
}

function isSkuSuspicious(sku) {
  const s = String(sku ?? '').trim();
  if (!s) return true;
  if (s.length < 8) return true;
  if (!/^\d+$/.test(s)) return true;
  return false;
}

function slugHasEncodedOrNonAscii(slug) {
  const s = String(slug ?? '');
  if (!s) return true;
  if (/%[0-9a-fA-F]{2}/.test(s)) return true;
  if (/[^\x00-\x7F]/.test(s)) return true;
  return false;
}

/**
 * Busca TODOS os produtos Woo paginados até não haver mais / page > pages.
 */
async function fetchAllWooProducts(apiBaseUrl = DEFAULT_API_BASE, { perPage = 100, timeoutMs = 30000 } = {}) {
  const products = [];
  let page = 1;
  let pages = 1;

  console.log(`Buscando produtos WooCommerce em ${apiBaseUrl}/products ...`);

  while (page <= pages) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${apiBaseUrl}/products?per_page=${perPage}&page=${page}&orderby=date&order=DESC&_t=${Date.now()}`;
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Falha ao buscar Woo page=${page}: HTTP ${response.status}`);
      }
      const data = await response.json();
      const batch = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
      products.push(...batch);
      pages = Math.max(1, parseInt(data.pages || 1, 10));
      console.log(`  página ${page}/${pages}: +${batch.length} (total ${products.length})`);
      if (!batch.length) break;
      page += 1;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return products;
}

function buildWooSets(wooProducts) {
  const skus = new Set();
  const slugs = new Set();
  for (const p of wooProducts || []) {
    const sku = String(p?.sku ?? '').trim();
    if (sku) skus.add(sku);
    const slug = normalizeProductSlug(p?.slug);
    if (slug) slugs.add(slug);
  }
  return { skus, slugs };
}

function excludeAlreadyInWoo(catalog, wooSkus, wooSlugs) {
  const remaining = [];
  const excluded = [];
  for (const p of catalog) {
    const sku = String(p.sku ?? '').trim();
    const slug = normalizeProductSlug(p.slug);
    const bySku = sku && wooSkus.has(sku);
    const bySlug = slug && wooSlugs.has(slug);
    if (bySku || bySlug) {
      excluded.push({
        product: p,
        reason: bySku && bySlug ? 'sku+slug' : bySku ? 'sku' : 'slug',
      });
    } else {
      remaining.push(p);
    }
  }
  return { remaining, excluded };
}

/**
 * Relatório de integridade — console + arquivo .txt
 */
async function runIntegrityReport(catalog, { checkImages = true } = {}) {
  const lines = [];
  const log = (msg = '') => {
    lines.push(msg);
    console.log(msg);
  };

  log('=========================================================');
  log('RELATÓRIO DE INTEGRIDADE — catalog-products.json');
  log(`Gerado em: ${new Date().toISOString()}`);
  log(`Total de produtos: ${catalog.length}`);
  log('=========================================================');
  log();

  const dups = findDuplicateSkus(catalog);
  log(`## SKUs DUPLICADOS (${dups.length} SKUs)`);
  log('Regra de importação: o 1º produto na ordem do catálogo mantém o SKU;');
  log('as ocorrências seguintes são importadas com SKU vazio (coluna SKU = "").');
  if (!dups.length) {
    log('(nenhum)');
  } else {
    for (const { sku, items } of dups) {
      log(`SKU ${sku} (${items.length} produtos):`);
      items.forEach((p, i) => {
        const fate = i === 0 ? 'MANTÉM SKU' : 'SKU VAZIO na importação';
        log(`  - [${fate}] ${p.title} | slug=${p.slug} | id=${p._id || p.id}`);
      });
    }
  }
  log();

  const suspicious = catalog.filter((p) => isSkuSuspicious(p.sku));
  log(`## SKUs VAZIOS OU SUSPEITOS (${suspicious.length})`);
  if (!suspicious.length) log('(nenhum)');
  else {
    for (const p of suspicious) {
      log(`  - sku="${p.sku}" | ${p.title}`);
    }
  }
  log();

  const noImage = catalog.filter((p) => !p.image || !String(p.image).trim());
  log(`## SEM CAMPO image (${noImage.length})`);
  if (!noImage.length) log('(nenhum)');
  else noImage.forEach((p) => log(`  - ${p.sku} | ${p.title}`));
  log();

  const noContentImg = catalog.filter((p) => !getFirstImageSrcFromHtml(p.catalogContent || ''));
  log(`## SEM <img> NO catalogContent (${noContentImg.length}) — sem imagem de galeria`);
  if (!noContentImg.length) log('(nenhum)');
  else noContentImg.forEach((p) => log(`  - ${p.sku} | ${p.title}`));
  log();

  const badPrice = catalog.filter((p) => {
    const n = Number(p.price);
    return p.price == null || p.price === '' || Number.isNaN(n) || n <= 0;
  });
  log(`## PRICE 0 / VAZIO / NÃO NUMÉRICO (${badPrice.length})`);
  if (!badPrice.length) log('(nenhum)');
  else badPrice.forEach((p) => log(`  - ${p.sku} | price=${JSON.stringify(p.price)} | ${p.title}`));
  log();

  const weirdSlug = catalog.filter((p) => slugHasEncodedOrNonAscii(p.slug));
  log(`## SLUG COM ENCODING / NÃO-ASCII (${weirdSlug.length})`);
  if (!weirdSlug.length) log('(nenhum)');
  else {
    for (const p of weirdSlug) {
      log(`  - ${p.sku} | slug="${p.slug}" → normalizado="${normalizeProductSlug(p.slug)}" | ${p.title}`);
    }
  }
  log();

  if (checkImages) {
    log('## CHECAGEM HTTP HEAD DAS IMAGENS (capa + página)');
    const urlToProducts = new Map();
    for (const p of catalog) {
      const imgs = collectImages(p);
      for (const u of imgs) {
        if (!urlToProducts.has(u)) urlToProducts.set(u, []);
        urlToProducts.get(u).push(p.sku);
      }
    }
    const urls = [...urlToProducts.keys()];
    log(`URLs únicas a verificar: ${urls.length}`);
    const bad = [];
    await mapPool(urls, HEAD_CONCURRENCY, async (url) => {
      const status = await headStatus(url);
      if (status !== 200) {
        bad.push({ url, status, skus: urlToProducts.get(url) });
      }
    });
    log(`URLs com status != 200: ${bad.length} (serão removidas do CSV na exportação)`);
    if (!bad.length) log('(todas OK)');
    else {
      for (const b of bad) {
        log(`  - HTTP ${b.status || 'ERR'} | ${b.url} | skus: ${(b.skus || []).join(', ')}`);
      }
    }
    log();
  } else {
    log('## CHECAGEM HTTP HEAD: pulada (--skip-head)');
    log();
  }

  const { emptied } = applyDuplicateSkuRule(catalog);
  log('## RESUMO PARA IMPORTAÇÃO');
  log(`Total no JSON:                    ${catalog.length}`);
  log(`SKUs duplicados (grupos):         ${dups.length}`);
  log(`Produtos com SKU vazio (2ª+):     ${emptied.length}`);
  log(`Elegíveis p/ CSV (todos):         ${catalog.length}`);
  log();
  log('FIM DO RELATÓRIO');

  const reportPath = path.join(DEFAULT_OUT_DIR, `integridade-${new Date().toISOString().slice(0, 10)}.txt`);
  fs.mkdirSync(DEFAULT_OUT_DIR, { recursive: true });
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`\nRelatório salvo em: ${reportPath}`);
  return { reportPath, emptied, dups };
}

function filterProductsForExport(catalog, args) {
  let selected;
  if (args.loteTeste) {
    const wanted = resolveLoteTesteSkus(catalog);
    selected = wanted.map((sku) => {
      const p = catalog.find((x) => String(x.sku).trim() === sku);
      if (!p) throw new Error(`SKU do lote-teste não encontrado: ${sku}`);
      return p;
    });
  } else if (args.skus && args.skus.length) {
    selected = args.skus.map((sku) => {
      const p = catalog.find((x) => String(x.sku).trim() === sku);
      if (!p) throw new Error(`SKU não encontrado: ${sku}`);
      return p;
    });
  } else if (args.sku) {
    selected = catalog.filter((p) => String(p.sku ?? '').trim() === args.sku);
    if (!selected.length) throw new Error(`Nenhum produto com sku "${args.sku}"`);
  } else if (args.slug) {
    selected = catalog.filter((p) => String(p.slug ?? '').trim() === args.slug);
    if (!selected.length) throw new Error(`Nenhum produto com slug "${args.slug}"`);
  } else if (args.all || args.limit) {
    selected = catalog.slice();
    if (args.limit) {
      selected = selected.slice(0, args.limit);
    }
  } else {
    throw new Error(
      'Informe --report, --lote-teste, --completo, --sku, --skus, --slug, --limit ou --all'
    );
  }

  if (!selected.length) {
    throw new Error('Nenhum produto restante para exportar após filtros');
  }

  return selected;
}

function resolveLoteTesteSkus(catalog) {
  const dups = new Set(
    findDuplicateSkus(catalog)
      .flatMap(({ items }) => items.slice(1))
      .map((p) => String(p.sku).trim())
  );

  const yt = catalog.filter(
    (p) =>
      /youtube\.com|youtu\.be/i.test(p.catalogContent || '') &&
      !dups.has(String(p.sku).trim())
  );
  const youtubeSku = (yt[0] && String(yt[0].sku).trim()) || LOTE_TESTE_SKUS[0];

  const nas = catalog.find((p) => isNasBrechasProduct(p));
  const h2o = catalog.find((p) => String(p.sku).trim() === '9786561190558');
  const withDesc = catalog.find(
    (p) =>
      String(p.description || '').trim() &&
      String(p.sku).trim() !== String(nas?.sku || '') &&
      !dups.has(String(p.sku).trim())
  );
  const common = catalog.find(
    (p) =>
      !dups.has(String(p.sku).trim()) &&
      String(p.sku).trim() !== youtubeSku &&
      String(p.sku).trim() !== String(nas?.sku || '') &&
      String(p.sku).trim() !== String(h2o?.sku || '') &&
      String(p.sku).trim() !== String(withDesc?.sku || '') &&
      !/youtube\.com|youtu\.be/i.test(p.catalogContent || '') &&
      !String(p.description || '').trim() &&
      p.image &&
      Number(p.price) > 0 &&
      !slugHasEncodedOrNonAscii(p.slug)
  );

  const skus = [
    youtubeSku,
    nas ? String(nas.sku).trim() : LOTE_TESTE_SKUS[1],
    h2o ? String(h2o.sku).trim() : LOTE_TESTE_SKUS[2],
    withDesc ? String(withDesc.sku).trim() : LOTE_TESTE_SKUS[3],
    common ? String(common.sku).trim() : '9786561190572',
  ];

  console.log('Lote-teste SKUs:');
  console.log(`  1) YouTube:     ${skus[0]} — ${catalog.find((p) => String(p.sku).trim() === skus[0])?.title}`);
  console.log(`  2) Nas brechas: ${skus[1]} — ${catalog.find((p) => String(p.sku).trim() === skus[1])?.title}`);
  console.log(`  3) H₂O slug:    ${skus[2]} — ${catalog.find((p) => String(p.sku).trim() === skus[2])?.title}`);
  console.log(`  4) description: ${skus[3]} — ${catalog.find((p) => String(p.sku).trim() === skus[3])?.title}`);
  console.log(`  5) comum:       ${skus[4]} — ${catalog.find((p) => String(p.sku).trim() === skus[4])?.title}`);

  return skus;
}

function validateProductRow(headers, row, sourceProduct, { expectedImages = null } = {}) {
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const get = (name) => row[idx[name]];
  const errors = [];
  const warnings = [];

  const expectedSku = sourceProduct.sku == null ? '' : String(sourceProduct.sku);
  if (String(get('SKU')) !== expectedSku) {
    errors.push(`SKU esperado "${expectedSku}", obtido "${get('SKU')}"`);
  }

  const price = Number(get('Regular price'));
  if (Number.isNaN(price) || price <= 0) {
    warnings.push(`Regular price inválido/zero: "${get('Regular price')}"`);
  }

  const imagesExpected =
    expectedImages != null
      ? expectedImages
      : Array.isArray(sourceProduct._images)
        ? sourceProduct._images
        : collectImages(sourceProduct);
  const imageUrls = splitImageUrls(get('Images') || '');
  if (imageUrls.length !== imagesExpected.length) {
    errors.push(`Images: esperado ${imagesExpected.length}, obtido ${imageUrls.length}`);
  }
  for (let i = 0; i < imagesExpected.length; i++) {
    if (imageUrls[i] !== imagesExpected[i]) {
      errors.push(`Images[${i}] esperado "${imagesExpected[i]}", obtido "${imageUrls[i] || ''}"`);
    }
  }

  const desc = get('Description') || '';
  try {
    assertCleanDescription(desc, 'Description (CSV)');
  } catch (e) {
    errors.push(e.message);
  }

  const expectedSlug = normalizeProductSlug(sourceProduct.slug || '');
  if (get('Slug') !== expectedSlug) {
    errors.push(`Slug esperado "${expectedSlug}", obtido "${get('Slug')}"`);
  }

  const catalogContent = get('meta:n1_catalog_content') || '';
  const sourceContent = sourceProduct.catalogContent == null ? '' : String(sourceProduct.catalogContent);
  if (catalogContent !== sourceContent) {
    let diffAt = -1;
    for (let i = 0; i < Math.max(catalogContent.length, sourceContent.length); i++) {
      if (catalogContent[i] !== sourceContent[i]) {
        diffAt = i;
        break;
      }
    }
    errors.push(`meta:n1_catalog_content !== JSON (diff@${diffAt})`);
  }

  return { errors, warnings };
}

function printProductSummary(product, row, headers) {
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const images = splitImageUrls(row[idx.Images] || '');
  const cc = row[idx['meta:n1_catalog_content']] || '';
  const hasYt = /youtube\.com|youtu\.be/i.test(cc);
  const hasIssuu = /e\.issuu\.com\/embed/i.test(cc);
  const skuDisplay = row[idx.SKU] || '(vazio)';
  console.log(
    `  • ${product.title}\n` +
      `    sku=${skuDisplay} | price=${row[idx['Regular price']]} | imgs=${images.length} | ` +
      `youtube=${hasYt} | issuu=${hasIssuu} | catalogContent=${cc.length} chars | slug=${row[idx.Slug]}`
  );
}

function splitOutPath(baseOutPath, partIndex, totalParts) {
  const dir = path.dirname(baseOutPath);
  const ext = path.extname(baseOutPath) || '.csv';
  const base = path.basename(baseOutPath, ext);
  const pad = String(totalParts).length;
  const suffix = String(partIndex).padStart(Math.max(2, pad), '0');
  return path.join(dir, `${base}-${suffix}${ext}`);
}

async function prepareProductsWithImages(products, { skipHead = false } = {}) {
  const allRemoved = [];
  const prepared = [];

  for (const product of products) {
    const rawImages = collectImages(product);
    const { kept, removed } = await filterReachableImageUrls(rawImages, { skipHead });
    for (const r of removed) {
      allRemoved.push({
        url: r.url,
        status: r.status,
        sku: product.sku || product._originalSku || '',
        title: product.title || '',
        slug: product.slug || '',
      });
    }
    prepared.push({ ...product, _images: kept });
  }

  return { prepared, imagesRemoved: allRemoved };
}

function writeCsvFile(products, outPath) {
  const csv = buildCsv(products);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv, 'utf8');
  return outPath;
}

function validateCsvFile(outPath, sourceProducts) {
  const raw = fs.readFileSync(outPath, 'utf8');
  if (raw.charCodeAt(0) !== 0xfeff) {
    throw new Error(`UTF-8 BOM ausente em ${outPath}`);
  }

  const rows = parseCsv(raw);
  if (rows.length !== sourceProducts.length + 1) {
    throw new Error(`Linhas CSV: esperado ${sourceProducts.length + 1}, obtido ${rows.length} (${outPath})`);
  }
  if (rows[0].length !== CSV_HEADERS.length) {
    throw new Error(`Colunas header: esperado ${CSV_HEADERS.length}, obtido ${rows[0].length}`);
  }
  for (let i = 0; i < CSV_HEADERS.length; i++) {
    if (rows[0][i] !== CSV_HEADERS[i]) {
      throw new Error(`Header desalinhado col ${i}: esperado "${CSV_HEADERS[i]}", obtido "${rows[0][i]}"`);
    }
  }

  const idx = Object.fromEntries(rows[0].map((h, i) => [h, i]));
  const seenSkus = new Set();
  const seenSlugs = new Set();
  const zeroPrices = [];
  const slugDivergences = [];
  const allWarnings = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== CSV_HEADERS.length) {
      throw new Error(`Linha ${i + 1}: colunas ${rows[i].length} != ${CSV_HEADERS.length} — abortando`);
    }

    const source = sourceProducts[i - 1];
    const { errors, warnings } = validateProductRow(rows[0], rows[i], source);
    if (errors.length) {
      const fatal = errors.some((e) => e.includes('catalog_content') || e.includes('Colunas'));
      if (fatal || errors.some((e) => e.includes('catalog_content'))) {
        throw new Error(
          `Validação fatal linha ${i + 1} (${source.sku || source._originalSku}):\n- ${errors.join('\n- ')}`
        );
      }
      throw new Error(
        `Validação falhou linha ${i + 1} (${source.sku || source._originalSku}):\n- ${errors.join('\n- ')}`
      );
    }
    allWarnings.push(...warnings.map((w) => `linha ${i + 1}: ${w}`));

    const sku = String(rows[i][idx.SKU] || '').trim();
    if (sku) {
      if (seenSkus.has(sku)) {
        throw new Error(`SKU não-vazio duplicado no CSV: "${sku}"`);
      }
      seenSkus.add(sku);
    }

    const slug = String(rows[i][idx.Slug] || '');
    const expectedSlug = normalizeProductSlug(source.slug || '');
    if (slug !== expectedSlug) {
      slugDivergences.push({ slug, expectedSlug, title: source.title });
    }
    if (slug) {
      if (seenSlugs.has(slug)) {
        throw new Error(`Slug duplicado no CSV: "${slug}"`);
      }
      seenSlugs.add(slug);
    }

    const price = Number(rows[i][idx['Regular price']]);
    if (Number.isNaN(price) || price <= 0) {
      zeroPrices.push({
        sku: sku || source._originalSku || '',
        title: source.title,
        price: rows[i][idx['Regular price']],
      });
    }
  }

  return { rows, zeroPrices, slugDivergences, warnings: allWarnings };
}

function countEmbeds(products) {
  let youtube = 0;
  let issuu = 0;
  for (const p of products) {
    const cc = p.catalogContent == null ? '' : String(p.catalogContent);
    if (/youtube\.com|youtu\.be/i.test(cc)) youtube += 1;
    if (/e\.issuu\.com\/embed/i.test(cc)) issuu += 1;
  }
  return { youtube, issuu };
}

async function generateCsv(selected, outPath, { skipHead = false, split = null } = {}) {
  const { prepared: withSkuRule, emptied } = applyDuplicateSkuRule(selected);
  writePendenciasIsbn(emptied);

  console.log(
    skipHead
      ? 'Checagem HEAD das imagens: pulada (--skip-head)'
      : 'Verificando imagens (HTTP HEAD, concorrência 8)...'
  );
  const { prepared, imagesRemoved } = await prepareProductsWithImages(withSkuRule, { skipHead });

  if (imagesRemoved.length) {
    console.log(`Imagens removidas (HEAD != 200): ${imagesRemoved.length}`);
    for (const r of imagesRemoved.slice(0, 20)) {
      console.log(`  - HTTP ${r.status || 'ERR'} | ${r.url} | ${r.title}`);
    }
    if (imagesRemoved.length > 20) {
      console.log(`  ... e mais ${imagesRemoved.length - 20}`);
    }
  }

  const outPaths = [];
  let chunks;
  if (split && split > 0) {
    chunks = [];
    for (let i = 0; i < prepared.length; i += split) {
      chunks.push(prepared.slice(i, i + split));
    }
  } else {
    chunks = [prepared];
  }

  const totalParts = chunks.length;
  for (let i = 0; i < chunks.length; i++) {
    const chunkPath = totalParts === 1 ? outPath : splitOutPath(outPath, i + 1, totalParts);
    writeCsvFile(chunks[i], chunkPath);
    const validation = validateCsvFile(chunkPath, chunks[i]);
    outPaths.push(chunkPath);

    console.log(`\nCSV gerado: ${chunkPath}`);
    console.log(`Produtos neste arquivo: ${chunks[i].length}`);
    if (chunks[i].length <= 20) {
      console.log('Resumo:');
      for (let j = 0; j < chunks[i].length; j++) {
        printProductSummary(chunks[i][j], validation.rows[j + 1], validation.rows[0]);
      }
    }
    if (validation.zeroPrices.length) {
      console.warn(`AVISO: ${validation.zeroPrices.length} produto(s) com preço <= 0:`);
      for (const z of validation.zeroPrices) {
        console.warn(`  - sku=${z.sku} price=${z.price} | ${z.title}`);
      }
    }
    if (validation.slugDivergences.length) {
      throw new Error(
        `Divergência de slug detectada (${validation.slugDivergences.length}). Abortando.`
      );
    }
  }

  console.log('Validação CSV: OK');
  return {
    outPaths,
    emptied,
    imagesRemoved,
    prepared,
    embeds: countEmbeds(prepared),
  };
}

async function runCompleto(catalog, args) {
  const wooProducts = await fetchAllWooProducts(args.apiBase);
  const { skus: wooSkus, slugs: wooSlugs } = buildWooSets(wooProducts);
  console.log(`Woo: ${wooProducts.length} produtos | ${wooSkus.size} SKUs | ${wooSlugs.size} slugs`);

  const { remaining, excluded } = excludeAlreadyInWoo(catalog, wooSkus, wooSlugs);
  console.log(
    `Catálogo: ${catalog.length} | já no Woo (excluídos): ${excluded.length} | a exportar: ${remaining.length}`
  );

  if (!remaining.length) {
    console.log('Nenhum produto pendente para exportar (todos já estão no WooCommerce).');
    writePendenciasIsbn([]);
    return;
  }

  const outPath = args.out || DEFAULT_COMPLETO_OUT;
  const result = await generateCsv(remaining, outPath, {
    skipHead: args.skipHead,
    split: args.split,
  });

  console.log('\n=========================================================');
  console.log('RELATÓRIO FINAL — --completo');
  console.log('=========================================================');
  console.log(`Total no catálogo:              ${catalog.length}`);
  console.log(`Já no Woo (excluídos):          ${excluded.length}`);
  console.log(`Exportados no CSV:              ${result.prepared.length}`);
  console.log(`SKU vazio (duplicatas 2ª+):     ${result.emptied.length}`);
  console.log(`YouTube no catalogContent:      ${result.embeds.youtube}`);
  console.log(`Issuu no catalogContent:        ${result.embeds.issuu}`);
  console.log(`Imagens removidas (HEAD):       ${result.imagesRemoved.length}`);
  console.log(`Arquivos gerados:               ${result.outPaths.length}`);
  for (const p of result.outPaths) {
    console.log(`  - ${p}`);
  }
  if (excluded.length && excluded.length <= 30) {
    console.log('\nExcluídos (já no Woo):');
    for (const e of excluded) {
      console.log(`  - [${e.reason}] ${e.product.sku} | ${e.product.slug} | ${e.product.title}`);
    }
  } else if (excluded.length > 30) {
    console.log(`\nExcluídos (já no Woo): ${excluded.length} (omitindo lista completa)`);
  }
  console.log('=========================================================');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!fs.existsSync(CATALOG_JSON_PATH)) {
    throw new Error(`Catálogo não encontrado: ${CATALOG_JSON_PATH}`);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON_PATH, 'utf8'));
  if (!Array.isArray(catalog)) {
    throw new Error('catalog-products.json deve ser um array');
  }

  if (args.report) {
    await runIntegrityReport(catalog, { checkImages: !args.skipHead });
    return;
  }

  if (args.completo) {
    await runCompleto(catalog, args);
    return;
  }

  if (!args.loteTeste && !args.sku && !args.slug && !args.skus && !args.all && !args.limit) {
    printHelp();
    process.exit(1);
  }

  const selected = filterProductsForExport(catalog, args);
  let outPath = args.out;
  if (!outPath) {
    fs.mkdirSync(DEFAULT_OUT_DIR, { recursive: true });
    if (args.loteTeste) {
      outPath = path.join(DEFAULT_OUT_DIR, 'lote-teste.csv');
    } else if (args.all) {
      outPath = path.join(DEFAULT_OUT_DIR, 'catalogo-completo.csv');
    } else if (args.limit) {
      outPath = path.join(DEFAULT_OUT_DIR, `lote-limit-${args.limit}.csv`);
    } else if (args.sku) {
      outPath = path.join(DEFAULT_OUT_DIR, `produto-${args.sku}.csv`);
    } else {
      outPath = path.join(DEFAULT_OUT_DIR, 'lote.csv');
    }
  }

  const result = await generateCsv(selected, outPath, {
    skipHead: args.skipHead,
    split: args.split,
  });

  console.log(`\nProdutos: ${result.prepared.length}`);
  console.log(`SKU vazio (duplicatas): ${result.emptied.length}`);
  console.log(`YouTube: ${result.embeds.youtube} | Issuu: ${result.embeds.issuu}`);
  console.log(`Imagens removidas: ${result.imagesRemoved.length}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
