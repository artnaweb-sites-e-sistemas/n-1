/**
 * Gera CSV de importação WooCommerce a partir de catalog-products.json.
 *
 * Uso:
 *   node scripts/catalog-to-woo-csv.js --report
 *   node scripts/catalog-to-woo-csv.js --lote-teste
 *   node scripts/catalog-to-woo-csv.js --skus=a,b,c --out scripts/out/lote.csv
 *   node scripts/catalog-to-woo-csv.js --limit=20 --out scripts/out/lote-01.csv
 *   node scripts/catalog-to-woo-csv.js --all --out scripts/out/catalogo-completo.csv
 *   node scripts/catalog-to-woo-csv.js --sku 9786561190572
 */

const fs = require('fs');
const path = require('path');

const CATALOG_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog-products.json');
const DEFAULT_OUT_DIR = path.join(__dirname, 'out');
const IMAGE_BASE_URL = 'https://n-1-seven.vercel.app';
const HEAD_CONCURRENCY = 8;

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
    out: null,
    skipHead: false,
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
    } else if (arg === '--skip-head') {
      args.skipHead = true;
    } else if (arg === '--out' && argv[i + 1]) {
      args.out = path.resolve(argv[++i]);
    } else if (arg === '--help' || arg === '-h') {
      args.help = true;
    }
  }

  return args;
}

function printHelp() {
  console.log(`Uso:
  node scripts/catalog-to-woo-csv.js --report
  node scripts/catalog-to-woo-csv.js --lote-teste
  node scripts/catalog-to-woo-csv.js --skus=sku1,sku2 --out scripts/out/lote.csv
  node scripts/catalog-to-woo-csv.js --limit=20 --out scripts/out/lote-01.csv
  node scripts/catalog-to-woo-csv.js --all --out scripts/out/catalogo-completo.csv
  node scripts/catalog-to-woo-csv.js --sku <sku> [--out <arquivo.csv>]`);
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
 * Slug WooCommerce alinhado à normalização do front (₂→2, decode %xx).
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

  s = s
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/⁴/g, '4')
    .toLowerCase()
    .trim();

  // post_name Woo: a-z 0-9 hífen
  s = s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return s;
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
  } catch (err) {
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
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function assertImageUrlsReachable(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  const failures = [];
  await mapPool(unique, HEAD_CONCURRENCY, async (url) => {
    const status = await headStatus(url);
    if (status !== 200) {
      failures.push(`${url} → HTTP ${status || 'ERR'}`);
    }
  });
  if (failures.length) {
    throw new Error(
      `Imagens inacessíveis (esperado HTTP 200). Corrija as URLs antes de importar:\n- ${failures.join('\n- ')}`
    );
  }
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
  return '';
}

function resolveDescription(product) {
  const fromField = String(product.description || '').trim();
  if (fromField) {
    assertCleanDescription(fromField, 'description (JSON)');
    return fromField;
  }
  const extracted = extractDescriptiveParagraph(product.catalogContent || '');
  assertCleanDescription(extracted, `description extraída (sku=${product.sku || '?'})`);
  return extracted;
}

function resolveShortDescription(product) {
  const fromField = String(product.shortDescription || '').trim();
  if (fromField) {
    assertCleanDescription(fromField, 'shortDescription (JSON)');
    return fromField;
  }
  return resolveDescription(product);
}

function assertCleanDescription(text, label) {
  const value = String(text || '');
  if (!value) {
    throw new Error(`${label}: Description vazia — não foi possível extrair parágrafo descritivo`);
  }
  if (value.length > 1500) {
    throw new Error(`${label}: Description com ${value.length} chars (>1500) — parece conteúdo poluído`);
  }
  if (/^\s*comprar\b/i.test(value)) {
    throw new Error(`${label}: Description começa com "Comprar" — conteúdo poluído`);
  }
  if (/\banterior\b/i.test(value) || /\bpr[oó]ximo\b/i.test(value)) {
    throw new Error(`${label}: Description contém "Anterior"/"Próximo" — conteúdo poluído`);
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

function productToRow(product) {
  const catalogContentExact = product.catalogContent == null ? '' : String(product.catalogContent);
  const description = resolveDescription(product);
  const shortDescription = resolveShortDescription(product);
  const images = collectImages(product);
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
      // ignore
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

function getExcludedDuplicateSkuSet(products) {
  const set = new Set();
  for (const { sku } of findDuplicateSkus(products)) {
    set.add(sku);
  }
  return set;
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

  // SKUs duplicados
  const dups = findDuplicateSkus(catalog);
  log(`## SKUs DUPLICADOS (${dups.length} SKUs / exclusos da importação)`);
  if (!dups.length) {
    log('(nenhum)');
  } else {
    for (const { sku, items } of dups) {
      log(`SKU ${sku}:`);
      for (const p of items) {
        log(`  - ${p.title} | slug=${p.slug} | id=${p._id || p.id}`);
      }
    }
  }
  log();

  // SKUs vazios/suspeitos
  const suspicious = catalog.filter((p) => isSkuSuspicious(p.sku));
  log(`## SKUs VAZIOS OU SUSPEITOS (${suspicious.length})`);
  if (!suspicious.length) log('(nenhum)');
  else {
    for (const p of suspicious) {
      log(`  - sku="${p.sku}" | ${p.title}`);
    }
  }
  log();

  // Sem image
  const noImage = catalog.filter((p) => !p.image || !String(p.image).trim());
  log(`## SEM CAMPO image (${noImage.length})`);
  if (!noImage.length) log('(nenhum)');
  else noImage.forEach((p) => log(`  - ${p.sku} | ${p.title}`));
  log();

  // Sem <img> no catalogContent
  const noContentImg = catalog.filter((p) => !getFirstImageSrcFromHtml(p.catalogContent || ''));
  log(`## SEM <img> NO catalogContent (${noContentImg.length}) — sem imagem de galeria`);
  if (!noContentImg.length) log('(nenhum)');
  else noContentImg.forEach((p) => log(`  - ${p.sku} | ${p.title}`));
  log();

  // Preço inválido
  const badPrice = catalog.filter((p) => {
    const n = Number(p.price);
    return p.price == null || p.price === '' || Number.isNaN(n) || n <= 0;
  });
  log(`## PRICE 0 / VAZIO / NÃO NUMÉRICO (${badPrice.length})`);
  if (!badPrice.length) log('(nenhum)');
  else badPrice.forEach((p) => log(`  - ${p.sku} | price=${JSON.stringify(p.price)} | ${p.title}`));
  log();

  // Slug especial
  const weirdSlug = catalog.filter((p) => slugHasEncodedOrNonAscii(p.slug));
  log(`## SLUG COM ENCODING / NÃO-ASCII (${weirdSlug.length})`);
  if (!weirdSlug.length) log('(nenhum)');
  else {
    for (const p of weirdSlug) {
      log(`  - ${p.sku} | slug="${p.slug}" → normalizado="${normalizeProductSlug(p.slug)}" | ${p.title}`);
    }
  }
  log();

  // Imagens HTTP
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
    log(`URLs com status != 200: ${bad.length}`);
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

  const excluded = getExcludedDuplicateSkuSet(catalog);
  const importable = catalog.filter((p) => {
    const sku = String(p.sku ?? '').trim();
    return sku && !excluded.has(sku);
  });
  log('## RESUMO PARA IMPORTAÇÃO');
  log(`Total no JSON:           ${catalog.length}`);
  log(`Excluídos (SKU duplo):   ${catalog.length - importable.length}`);
  log(`Elegíveis p/ CSV:        ${importable.length}`);
  log();
  log('FIM DO RELATÓRIO');

  const reportPath = path.join(DEFAULT_OUT_DIR, `integridade-${new Date().toISOString().slice(0, 10)}.txt`);
  fs.mkdirSync(DEFAULT_OUT_DIR, { recursive: true });
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`\nRelatório salvo em: ${reportPath}`);
  return { reportPath, excluded, importable, dups };
}

function filterProductsForExport(catalog, args) {
  const excluded = getExcludedDuplicateSkuSet(catalog);

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
    selected = catalog.filter((p) => {
      const sku = String(p.sku ?? '').trim();
      return sku && !excluded.has(sku);
    });
    if (args.limit) {
      selected = selected.slice(0, args.limit);
    }
  } else {
    throw new Error('Informe --report, --lote-teste, --sku, --skus, --slug, --limit ou --all');
  }

  // Nunca exportar SKU duplicado
  const blocked = selected.filter((p) => excluded.has(String(p.sku ?? '').trim()));
  if (blocked.length) {
    console.warn(
      'AVISO: excluindo produtos com SKU duplicado do CSV:\n' +
        blocked.map((p) => `  - ${p.sku} | ${p.title}`).join('\n')
    );
    selected = selected.filter((p) => !excluded.has(String(p.sku ?? '').trim()));
  }

  // Garantir unicidade dentro do lote
  const seen = new Set();
  const unique = [];
  for (const p of selected) {
    const sku = String(p.sku ?? '').trim();
    if (!sku) continue;
    if (seen.has(sku)) {
      throw new Error(`SKU repetido no lote selecionado: ${sku}`);
    }
    seen.add(sku);
    unique.push(p);
  }

  if (!unique.length) {
    throw new Error('Nenhum produto restante para exportar após filtros');
  }

  return unique;
}

function resolveLoteTesteSkus(catalog) {
  const dups = getExcludedDuplicateSkuSet(catalog);
  const yt = catalog.filter(
    (p) =>
      /youtube\.com|youtu\.be/i.test(p.catalogContent || '') &&
      !dups.has(String(p.sku).trim())
  );
  const youtubeSku = (yt[0] && String(yt[0].sku).trim()) || '9786561190473';

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
    nas ? String(nas.sku).trim() : '9786561190763',
    h2o ? String(h2o.sku).trim() : '9786561190558',
    withDesc ? String(withDesc.sku).trim() : '9786561190626',
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

function validateProductRow(headers, row, sourceProduct) {
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const get = (name) => row[idx[name]];
  const errors = [];

  if (String(get('SKU')) !== String(sourceProduct.sku)) {
    errors.push(`SKU esperado "${sourceProduct.sku}", obtido "${get('SKU')}"`);
  }

  const price = Number(get('Regular price'));
  if (Number.isNaN(price) || price <= 0) {
    errors.push(`Regular price inválido: "${get('Regular price')}"`);
  }

  const expectedImages = collectImages(sourceProduct);
  const imageUrls = splitImageUrls(get('Images') || '');
  if (imageUrls.length !== expectedImages.length) {
    errors.push(`Images: esperado ${expectedImages.length}, obtido ${imageUrls.length}`);
  }
  for (let i = 0; i < expectedImages.length; i++) {
    if (imageUrls[i] !== expectedImages[i]) {
      errors.push(`Images[${i}] esperado "${expectedImages[i]}", obtido "${imageUrls[i] || ''}"`);
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
  const countP = (s) => (String(s).match(/<p\b/gi) || []).length;
  if (countP(sourceContent) !== countP(catalogContent)) {
    errors.push(`contagem <p divergiu (JSON=${countP(sourceContent)}, CSV=${countP(catalogContent)})`);
  }
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

  return errors;
}

function printProductSummary(product, row, headers) {
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const images = splitImageUrls(row[idx.Images] || '');
  const cc = row[idx['meta:n1_catalog_content']] || '';
  const hasYt = /youtube\.com|youtu\.be/i.test(cc);
  const hasIssuu = /e\.issuu\.com\/embed/i.test(cc);
  console.log(
    `  • ${product.title}\n` +
      `    sku=${product.sku} | price=${row[idx['Regular price']]} | imgs=${images.length} | ` +
      `youtube=${hasYt} | issuu=${hasIssuu} | catalogContent=${cc.length} chars | slug=${row[idx.Slug]}`
  );
}

async function generateCsv(catalog, selected, outPath, { skipHead = false } = {}) {
  // Unicidade de SKU
  const skus = selected.map((p) => String(p.sku).trim());
  const uniq = new Set(skus);
  if (uniq.size !== skus.length) {
    throw new Error('SKU repetido detectado no lote — abortando');
  }

  const csv = buildCsv(selected);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv, 'utf8');

  const raw = fs.readFileSync(outPath, 'utf8');
  if (raw.charCodeAt(0) !== 0xfeff) {
    throw new Error('UTF-8 BOM ausente');
  }

  const rows = parseCsv(raw);
  if (rows.length !== selected.length + 1) {
    throw new Error(`Linhas CSV: esperado ${selected.length + 1}, obtido ${rows.length}`);
  }
  if (rows[0].length !== CSV_HEADERS.length) {
    throw new Error(`Colunas header: esperado ${CSV_HEADERS.length}, obtido ${rows[0].length}`);
  }

  const idx = Object.fromEntries(rows[0].map((h, i) => [h, i]));
  const allImageUrls = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== CSV_HEADERS.length) {
      throw new Error(`Linha ${i + 1}: colunas ${rows[i].length} != ${CSV_HEADERS.length}`);
    }
    const errs = validateProductRow(rows[0], rows[i], selected[i - 1]);
    if (errs.length) {
      throw new Error(`Validação falhou linha ${i + 1} (${selected[i - 1].sku}):\n- ${errs.join('\n- ')}`);
    }
    allImageUrls.push(...splitImageUrls(rows[i][idx.Images]));
  }

  if (!skipHead) {
    console.log(`Verificando ${new Set(allImageUrls).size} URL(s) de imagem (HTTP HEAD)...`);
    await assertImageUrlsReachable(allImageUrls);
  }

  console.log(`\nCSV gerado: ${outPath}`);
  console.log(`Produtos: ${selected.length}`);
  console.log('Resumo:');
  for (let i = 0; i < selected.length; i++) {
    printProductSummary(selected[i], rows[i + 1], rows[0]);
  }
  console.log('Validação CSV: OK');
  return outPath;
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

  if (
    !args.loteTeste &&
    !args.sku &&
    !args.slug &&
    !args.skus &&
    !args.all &&
    !args.limit
  ) {
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

  await generateCsv(catalog, selected, outPath, { skipHead: args.skipHead });
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
