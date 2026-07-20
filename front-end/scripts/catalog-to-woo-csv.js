/**
 * Gera CSV de importação WooCommerce a partir de catalog-products.json.
 *
 * Uso:
 *   node scripts/catalog-to-woo-csv.js --sku 9786561190572
 *   node scripts/catalog-to-woo-csv.js --slug a-comunidade-terrestre
 *   node scripts/catalog-to-woo-csv.js --sku 9786561190572 --out scripts/out/produto-teste.csv
 *   node scripts/catalog-to-woo-csv.js --all --out scripts/out/catalogo-completo.csv
 */

const fs = require('fs');
const path = require('path');

const CATALOG_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog-products.json');
const DEFAULT_OUT_DIR = path.join(__dirname, 'out');
const IMAGE_BASE_URL = 'https://n-1-seven.vercel.app';

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

function parseArgs(argv) {
  const args = {
    sku: null,
    slug: null,
    all: false,
    out: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--sku' && argv[i + 1]) {
      args.sku = String(argv[++i]).trim();
    } else if (arg === '--slug' && argv[i + 1]) {
      args.slug = String(argv[++i]).trim();
    } else if (arg === '--all') {
      args.all = true;
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
  node scripts/catalog-to-woo-csv.js --sku <sku> [--out <arquivo.csv>]
  node scripts/catalog-to-woo-csv.js --slug <slug> [--out <arquivo.csv>]
  node scripts/catalog-to-woo-csv.js --all [--out <arquivo.csv>]

Exemplos:
  node scripts/catalog-to-woo-csv.js --sku 9786561190572 --out scripts/out/produto-teste.csv
  node scripts/catalog-to-woo-csv.js --slug a-comunidade-terrestre
  node scripts/catalog-to-woo-csv.js --all --out scripts/out/catalogo-completo.csv`);
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

/**
 * Extrai a URL da primeira <img src="..."> do catalogContent.
 */
function getFirstImageSrcFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Imagens para o CSV (ordem WooCommerce):
 * 1) destacada = capa (campo "image")
 * 2) 1ª da galeria = mockup (primeira <img> do catalogContent)
 * Sem catalogImages extras. Se iguais ou sem mockup, só a capa.
 */
function collectImages(product) {
  const cover = toAbsoluteImageUrl(product.image);
  if (!cover) return [];

  const mockupRaw = getFirstImageSrcFromHtml(product.catalogContent || '');
  const mockup = toAbsoluteImageUrl(mockupRaw);

  if (!mockup || mockup === cover) {
    return [cover];
  }
  return [cover, mockup];
}

function splitImageUrls(imagesField) {
  return String(imagesField || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

/**
 * HEAD em cada URL; falha se qualquer uma não retornar 200.
 */
async function assertImageUrlsReachable(urls) {
  const failures = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (res.status !== 200) {
        if (res.status === 405 || res.status === 501) {
          const getRes = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            headers: { Range: 'bytes=0-0' },
          });
          if (getRes.status !== 200 && getRes.status !== 206) {
            failures.push(`${url} → HTTP ${getRes.status} (GET após HEAD ${res.status})`);
          }
        } else {
          failures.push(`${url} → HTTP ${res.status}`);
        }
      }
    } catch (err) {
      failures.push(`${url} → ${err.message || err}`);
    }
  }

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
  // Textos curtos de UI (botão "Comprar", "Anterior", etc.)
  if (/^(comprar|anterior|pr[oó]ximo)(\s|$)/i.test(t) && t.length < 40) return true;
  return false;
}

/**
 * Primeiro <p> descritivo do catalogContent (>80 chars, sem botões/navegação).
 * Nunca retorna o HTML inteiro nem texto corrido de strip_tags no documento.
 */
function extractDescriptiveParagraph(catalogContent) {
  if (!catalogContent || typeof catalogContent !== 'string') return '';

  const pRegex = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(catalogContent)) !== null) {
    const text = htmlToPlainText(match[1]);
    if (!text || text.length <= 80) continue;
    if (isNavOrButtonText(text)) continue;
    // Rejeitar se parecer o documento inteiro colapsado
    if (/comprar/i.test(text) && /anterior/i.test(text) && /pr[oó]ximo/i.test(text)) {
      continue;
    }
    return text;
  }
  return '';
}

/**
 * Description / Short description: usa o campo do JSON se preenchido;
 * senão extrai o primeiro parágrafo descritivo do catalogContent.
 * NUNCA usa o catalogContent inteiro.
 */
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

/** Falha se a Description parecer HTML stripado / navegação / texto gigante. */
function assertCleanDescription(text, label) {
  const value = String(text || '');
  if (!value) {
    throw new Error(`${label}: Description vazia — não foi possível extrair parágrafo descritivo`);
  }
  if (value.length > 1500) {
    throw new Error(`${label}: Description com ${value.length} chars (>1500) — parece conteúdo poluído`);
  }
  const start = value.slice(0, 40).toLowerCase();
  if (start.startsWith('comprar') || /^\s*comprar\b/i.test(value)) {
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
  // Número simples com ponto decimal (ex.: 89.15), sem R$
  return String(num);
}

function productToRow(product) {
  const description = resolveDescription(product);
  const shortDescription = resolveShortDescription(product);
  const images = collectImages(product);

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
    product.slug ?? '',
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
    product.catalogContent ?? '',
  ];
}

function buildCsv(products) {
  const lines = [CSV_HEADERS.map(escapeCsvField).join(',')];
  for (const product of products) {
    lines.push(productToRow(product).map(escapeCsvField).join(','));
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/**
 * Parser CSV mínimo (RFC 4180) para validar o arquivo gerado.
 */
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
      // ignore; handled with \n
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

function filterProducts(products, { sku, slug, all }) {
  if (all) return products;

  if (sku) {
    const match = products.filter((p) => String(p.sku ?? '').trim() === sku);
    if (!match.length) {
      throw new Error(`Nenhum produto encontrado com sku "${sku}"`);
    }
    return match;
  }

  if (slug) {
    const match = products.filter((p) => String(p.slug ?? '').trim() === slug);
    if (!match.length) {
      throw new Error(`Nenhum produto encontrado com slug "${slug}"`);
    }
    return match;
  }

  throw new Error('Informe --sku, --slug ou --all');
}

function defaultOutPath({ sku, slug, all }) {
  if (!fs.existsSync(DEFAULT_OUT_DIR)) {
    fs.mkdirSync(DEFAULT_OUT_DIR, { recursive: true });
  }
  if (all) return path.join(DEFAULT_OUT_DIR, 'catalogo-completo.csv');
  if (sku) return path.join(DEFAULT_OUT_DIR, `produto-${sku}.csv`);
  if (slug) return path.join(DEFAULT_OUT_DIR, `produto-${slug}.csv`);
  return path.join(DEFAULT_OUT_DIR, 'produtos.csv');
}

function validateProductRow(headers, row, sourceProduct) {
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const get = (name) => row[idx[name]];

  const errors = [];
  if (get('Name') !== sourceProduct.title) {
    errors.push(`Name esperado "${sourceProduct.title}", obtido "${get('Name')}"`);
  }
  if (String(get('SKU')) !== String(sourceProduct.sku)) {
    errors.push(`SKU esperado "${sourceProduct.sku}", obtido "${get('SKU')}"`);
  }
  if (get('Regular price') !== formatRegularPrice(sourceProduct.price)) {
    errors.push(
      `Regular price esperado "${formatRegularPrice(sourceProduct.price)}", obtido "${get('Regular price')}"`
    );
  }

  const coverUrl = toAbsoluteImageUrl(sourceProduct.image);
  const expectedImages = collectImages(sourceProduct);
  const imagesField = get('Images') || '';
  const imageUrls = splitImageUrls(imagesField);

  if (imageUrls.length !== expectedImages.length) {
    errors.push(
      `Images: esperado ${expectedImages.length} URL(s) (capa[+mockup]), obtido ${imageUrls.length}`
    );
  }
  for (let i = 0; i < expectedImages.length; i++) {
    if (imageUrls[i] !== expectedImages[i]) {
      errors.push(`Images[${i}] esperado "${expectedImages[i]}", obtido "${imageUrls[i] || ''}"`);
    }
  }
  if (coverUrl && imageUrls[0] !== coverUrl) {
    errors.push(`Images[0] (capa) esperado "${coverUrl}", obtido "${imageUrls[0] || ''}"`);
  }
  if (imagesField.includes('|')) {
    errors.push('Images não deve usar "|" como separador — use vírgula');
  }

  const expectedDesc = resolveDescription(sourceProduct);
  const desc = get('Description') || '';
  if (desc !== expectedDesc) {
    errors.push('Description não corresponde ao parágrafo esperado');
  }
  if (!desc.startsWith('A comunidade terrestre representa a culminação') && String(sourceProduct.sku) === '9786561190572') {
    errors.push(
      `Description deve começar com "A comunidade terrestre representa a culminação" (obtido: "${desc.slice(0, 80)}")`
    );
  }
  try {
    assertCleanDescription(desc, 'Description (CSV)');
    assertCleanDescription(get('Short description') || '', 'Short description (CSV)');
  } catch (e) {
    errors.push(e.message);
  }

  if (get('Short description') !== resolveShortDescription(sourceProduct)) {
    errors.push('Short description inválida');
  }

  const catalogContent = get('meta:n1_catalog_content') || '';
  if (catalogContent !== (sourceProduct.catalogContent || '')) {
    errors.push('meta:n1_catalog_content não é idêntico ao JSON');
  }
  const issuuMatches = catalogContent.match(/e\.issuu\.com\/embed/g) || [];
  if (issuuMatches.length !== 1) {
    errors.push(`meta:n1_catalog_content deve conter exatamente 1 ocorrência de e.issuu.com/embed (obtido ${issuuMatches.length})`);
  }

  // meta:n1_catalog_images não deve existir no CSV
  if (Object.prototype.hasOwnProperty.call(idx, 'meta:n1_catalog_images')) {
    const catalogImagesMeta = get('meta:n1_catalog_images');
    if (catalogImagesMeta != null && String(catalogImagesMeta).trim() !== '') {
      errors.push('meta:n1_catalog_images deve estar ausente/vazia');
    }
  }

  if (expectedDesc && desc === sourceProduct.catalogContent) {
    errors.push('Description não pode ser o catalogContent inteiro');
  }

  return errors;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.sku && !args.slug && !args.all)) {
    printHelp();
    process.exit(args.help ? 0 : 1);
  }

  if (!fs.existsSync(CATALOG_JSON_PATH)) {
    throw new Error(`Catálogo não encontrado: ${CATALOG_JSON_PATH}`);
  }

  const catalog = JSON.parse(fs.readFileSync(CATALOG_JSON_PATH, 'utf8'));
  if (!Array.isArray(catalog)) {
    throw new Error('catalog-products.json deve ser um array');
  }

  const selected = filterProducts(catalog, args);
  const csv = buildCsv(selected);
  const outPath = args.out || defaultOutPath(args);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, csv, 'utf8');

  const raw = fs.readFileSync(outPath, 'utf8');
  if (raw.charCodeAt(0) !== 0xfeff) {
    throw new Error('Validação CSV falhou: UTF-8 BOM ausente');
  }

  const rows = parseCsv(raw);

  if (rows.length !== selected.length + 1) {
    throw new Error(
      `Validação CSV falhou: esperado ${selected.length + 1} linhas (header + produtos), obtido ${rows.length}`
    );
  }

  if (rows[0].length !== CSV_HEADERS.length) {
    throw new Error(
      `Validação CSV falhou: esperado ${CSV_HEADERS.length} colunas no header, obtido ${rows[0].length}`
    );
  }

  const idx = Object.fromEntries(rows[0].map((h, i) => [h, i]));
  const allImageUrls = [];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].length !== CSV_HEADERS.length) {
      throw new Error(
        `Validação CSV falhou na linha ${i + 1}: esperado ${CSV_HEADERS.length} colunas, obtido ${rows[i].length}`
      );
    }
    const fieldErrors = validateProductRow(rows[0], rows[i], selected[i - 1]);
    if (fieldErrors.length) {
      throw new Error(`Validação CSV falhou na linha ${i + 1}:\n- ${fieldErrors.join('\n- ')}`);
    }
    allImageUrls.push(...splitImageUrls(rows[i][idx.Images]));
  }

  // Deduplicar URLs para HEAD (mesma imagem em vários produtos)
  const uniqueImageUrls = [...new Set(allImageUrls)];
  console.log(`Verificando ${uniqueImageUrls.length} URL(s) de imagem (HTTP HEAD)...`);
  await assertImageUrlsReachable(uniqueImageUrls);

  const first = rows[1];
  const firstImages = splitImageUrls(first[idx.Images]);

  console.log(`CSV gerado: ${outPath}`);
  console.log(`Produtos: ${selected.length}`);
  console.log(`Name: ${first[idx.Name]}`);
  console.log(`SKU: ${first[idx.SKU]}`);
  console.log(`Regular price: ${first[idx['Regular price']]}`);
  console.log(`Slug: ${first[idx.Slug]}`);
  console.log(`Images (${firstImages.length}):`);
  firstImages.forEach((u, i) => console.log(`  [${i}] ${u}`));
  console.log(`Description: ${(first[idx.Description] || '').slice(0, 120)}...`);
  console.log(
    `meta:n1_catalog_content: len=${(first[idx['meta:n1_catalog_content']] || '').length}, hasIssuu=${String(
      first[idx['meta:n1_catalog_content']] || ''
    ).includes('e.issuu.com/embed')}`
  );
  console.log('Validação CSV + imagens HTTP: OK');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
