/**
 * Atualiza preços no catalog-products.json pelo NOME DO LIVRO.
 * Usa só o INÍCIO do título como referência (ex.: "O que a Guerra da Ucrânia" em vez do nome completo com autor/edição).
 *
 * Uso: node scripts/update-prices-from-excel.cjs "C:\caminho\Reajustes de preços.xlsx"
 * Ou: node scripts/update-prices-from-excel.cjs  (usa Desktop)
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_EXCEL_PATH = path.join(process.env.USERPROFILE || '', 'Desktop', 'Reajustes de preços.xlsx');
const CATALOG_JSON_PATH = path.join(__dirname, '..', 'src', 'data', 'catalog-products.json');

const REF_LENGTH = 40;
const MIN_MATCH_LEN = 15; // mínimo de caracteres iguais no início para considerar match (tolera typo no resto)

// Extrai a parte principal do título: antes de " (" ou " [" (autor, edição, código)
// e pega só os primeiros REF_LENGTH caracteres como referência
function extractRef(val) {
  if (val == null) return '';
  let s = String(val).trim();
  const beforeParen = s.split(/\s*[(\[]/)[0].trim();
  const ref = beforeParen.slice(0, REF_LENGTH).trim();
  return ref;
}

// Normaliza para comparação: minúsculo, sem acentos, sem aspas/backticks, espaços colapsados
function normalizeTitle(val) {
  if (val == null) return '';
  let s = String(val)
    .replace(/[`'"«»]/g, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  return s;
}

function refKey(val) {
  return normalizeTitle(extractRef(val));
}

// Retorna true se as duas refs são do mesmo livro (primeiros MIN_MATCH_LEN chars iguais ou um contém o outro)
function refsMatch(a, b) {
  if (!a || !b) return false;
  const aa = a.slice(0, REF_LENGTH);
  const bb = b.slice(0, REF_LENGTH);
  if (aa === bb) return true;
  if (aa.startsWith(bb) || bb.startsWith(aa)) return true;
  if (aa.length >= MIN_MATCH_LEN && bb.length >= MIN_MATCH_LEN) {
    if (aa.slice(0, MIN_MATCH_LEN) === bb.slice(0, MIN_MATCH_LEN)) return true;
  }
  if (aa.includes(bb) || bb.includes(aa)) return true;
  return false;
}

// Converte valor do Excel para número (aceita "R$ 89,90", 89.9, "89,90")
function parsePrice(val) {
  if (val == null) return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  const s = String(val).trim()
    .replace(/R\$\s*/i, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
}

function formatPriceText(num) {
  if (num == null || isNaN(num)) return '';
  return 'R$ ' + num.toFixed(2).replace('.', ',');
}

function run() {
  const excelPath = process.argv[2] || DEFAULT_EXCEL_PATH;
  if (!fs.existsSync(excelPath)) {
    console.error('Arquivo não encontrado:', excelPath);
    process.exit(1);
  }

  let XLSX;
  try {
    XLSX = require('xlsx');
  } catch (e) {
    console.error('Instale: npm install xlsx --save-dev');
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length < 2) {
    console.error('Planilha vazia ou só com cabeçalho.');
    process.exit(1);
  }

  const headers = rows[0].map(h => String(h || '').toLowerCase().trim());
  const nameCol = headers.findIndex(h =>
    /nome|livro|título|titulo|titulo do livro|nome do livro|obra|produto/.test(h)
  );
  // Coluna do NOVO preço: preferir coluna que tenha "novo"; senão usar a ÚLTIMA coluna que tenha "preço"/"valor"
  const priceColCandidates = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /preço|preco|valor|price/.test(h));
  const newPriceCol = priceColCandidates.find(({ h }) => /novo|atualizado/.test(h));
  const priceCol = newPriceCol ? newPriceCol.i : (priceColCandidates.length ? priceColCandidates[priceColCandidates.length - 1].i : -1);

  if (nameCol < 0) {
    console.error('Coluna do nome do livro não encontrada. Cabeçalhos:', headers);
    process.exit(1);
  }
  if (priceCol < 0) {
    console.error('Coluna de preço não encontrada. Cabeçalhos:', headers);
    process.exit(1);
  }
  console.log('Usando coluna de preço:', headers[priceCol], '(índice', priceCol + ')');

  const priceByRef = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nameRaw = row[nameCol];
    const priceRaw = row[priceCol];
    const key = refKey(nameRaw);
    const price = parsePrice(priceRaw);
    if (key && price != null) {
      priceByRef.set(key, price);
    }
  }

  const catalogPath = path.resolve(CATALOG_JSON_PATH);
  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (e) {
    console.error('Erro ao ler catalog-products.json:', e.message);
    process.exit(1);
  }

  const excelEntries = Array.from(priceByRef.entries());
  let updated = 0;
  let notFound = [];
  for (const product of catalog) {
    const title = product.title || product.bookTitle || '';
    const key = refKey(title);
    let newPrice = key ? priceByRef.get(key) : null;
    if (newPrice == null && key) {
      for (const [excelRef, price] of excelEntries) {
        if (refsMatch(key, excelRef)) {
          newPrice = price;
          break;
        }
      }
    }
    if (newPrice != null) {
      product.price = newPrice;
      product.originalPrice = newPrice;
      product.priceText = formatPriceText(newPrice);
      if (product.discount != null) product.discount = 0;
      updated++;
    } else {
      notFound.push(title || product._id);
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log('Atualizados', updated, 'livros por nome.');
  if (notFound.length > 0) {
    console.log('Sem correspondência no Excel (', notFound.length, '):', notFound.slice(0, 8).join(' | '), notFound.length > 8 ? '...' : '');
  }
}

run();
