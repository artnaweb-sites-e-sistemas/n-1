const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://loja.n-1edicoes.org';
const SHOP_URL = `${BASE_URL}/shop`;
const OUTPUT_DIR = path.join(__dirname, 'n1-missing-products-images');
const CSV_OUTPUT = path.join(__dirname, 'n1-missing-products.csv');

// Carregar produtos já importados do CSV existente
function loadExistingProducts() {
    const csvPath = path.join(__dirname, 'n1-woocommerce-products-with-urls.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Pular cabeçalho
    
    const existingProducts = new Set();
    
    for (const line of lines) {
        if (!line.trim()) continue;
        
        // Extrair URL do produto da última coluna
        const match = line.match(/https:\/\/loja\.n-1edicoes\.org\/shop\/[^"]+/);
        if (match) {
            existingProducts.add(match[0]);
        }
        
        // Também extrair o título para comparação
        const nameMatch = line.match(/"","simple","[^"]+","([^"]+)"/);
        if (nameMatch) {
            existingProducts.add(nameMatch[1].toLowerCase().trim());
        }
    }
    
    console.log(`[INFO] ${existingProducts.size} produtos/URLs já importados encontrados`);
    return existingProducts;
}

// Baixar imagem
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const file = fs.createWriteStream(filepath);
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Converter texto para nome de arquivo seguro
function sanitizeFilename(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 80);
}

// Escapar CSV
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
}

async function scrapeAllProducts() {
    console.log('[INFO] Carregando produtos já importados...');
    const existingProducts = loadExistingProducts();
    
    console.log('[INFO] Iniciando scraping do site antigo...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    const allProducts = [];
    let pageNum = 1;
    let hasMorePages = true;
    
    // Criar diretório para imagens se não existir
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    while (hasMorePages) {
        const url = pageNum === 1 ? SHOP_URL : `${SHOP_URL}/page/${pageNum}`;
        console.log(`[INFO] Acessando página ${pageNum}: ${url}`);
        
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
            await page.waitForSelector('a[href*="/shop/"]', { timeout: 10000 });
        } catch (e) {
            console.log(`[INFO] Página ${pageNum} não existe ou erro: ${e.message}`);
            hasMorePages = false;
            break;
        }
        
        // Extrair links dos produtos na página
        const productLinks = await page.evaluate(() => {
            const links = [];
            const anchors = document.querySelectorAll('a[href*="/shop/"]');
            
            for (const anchor of anchors) {
                const href = anchor.href;
                // Filtrar apenas links de produtos (não páginas, cart, etc.)
                if (href.includes('/shop/') && 
                    !href.includes('/shop/page/') && 
                    !href.includes('/shop/cart') &&
                    href !== 'https://loja.n-1edicoes.org/shop' &&
                    href !== 'https://loja.n-1edicoes.org/shop/') {
                    links.push(href);
                }
            }
            
            return [...new Set(links)];
        });
        
        console.log(`[INFO] Encontrados ${productLinks.length} links de produtos na página ${pageNum}`);
        
        if (productLinks.length === 0) {
            hasMorePages = false;
            break;
        }
        
        // Processar cada produto
        for (const productUrl of productLinks) {
            // Verificar se já foi importado
            if (existingProducts.has(productUrl)) {
                console.log(`[SKIP] Produto já importado: ${productUrl}`);
                continue;
            }
            
            try {
                console.log(`[INFO] Acessando produto: ${productUrl}`);
                await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // Extrair dados do produto
                const productData = await page.evaluate(() => {
                    // Nome do produto
                    const nameEl = document.querySelector('h1, h2.product-name, .product-title, [itemprop="name"]');
                    const name = nameEl ? nameEl.innerText.trim() : '';
                    
                    // Preço
                    const priceEl = document.querySelector('.price, [itemprop="price"], .product-price');
                    let price = '';
                    if (priceEl) {
                        price = priceEl.innerText.replace(/[^\d,\.]/g, '').replace(',', '.');
                    }
                    
                    // Descrição
                    let description = '';
                    const descEl = document.querySelector('[itemprop="description"], .product-description, .tab-content #description, .product-detail-description');
                    if (descEl) {
                        description = descEl.innerText.trim();
                    }
                    
                    // Imagem principal
                    const imgEl = document.querySelector('.product-image img, [itemprop="image"], .main-image img, img[src*="product"]');
                    const image = imgEl ? imgEl.src : '';
                    
                    return { name, price, description, image };
                });
                
                if (!productData.name) {
                    console.log(`[WARN] Produto sem nome: ${productUrl}`);
                    continue;
                }
                
                // Verificar pelo nome também
                if (existingProducts.has(productData.name.toLowerCase().trim())) {
                    console.log(`[SKIP] Produto já importado pelo nome: ${productData.name}`);
                    continue;
                }
                
                productData.url = productUrl;
                allProducts.push(productData);
                console.log(`[NEW] Produto faltante encontrado: ${productData.name}`);
                
            } catch (e) {
                console.log(`[ERROR] Erro ao processar ${productUrl}: ${e.message}`);
            }
        }
        
        // Verificar se há próxima página
        const hasNext = await page.evaluate(() => {
            const nextBtn = document.querySelector('a.next, a[rel="next"], .pagination a:last-child');
            return nextBtn !== null;
        });
        
        if (!hasNext) {
            hasMorePages = false;
        } else {
            pageNum++;
        }
    }
    
    await browser.close();
    
    console.log(`\n[INFO] Total de produtos faltantes encontrados: ${allProducts.length}`);
    
    if (allProducts.length === 0) {
        console.log('[INFO] Nenhum produto faltante encontrado!');
        return;
    }
    
    // Baixar imagens e criar CSV
    console.log('\n[INFO] Baixando imagens dos produtos faltantes...');
    
    const csvRows = [];
    csvRows.push('"ID","Type","SKU","Name","Published","Is featured?","Visibility in catalog","Short description","Description","In stock?","Stock","Regular price","Sale price","Categories","Tags","Images","External URL"');
    
    let skuCounter = 199; // Continuar a partir do último SKU
    
    for (const product of allProducts) {
        skuCounter++;
        const sku = `N1-${skuCounter}`;
        
        // Baixar imagem
        let imageName = '';
        let imageUrl = '';
        
        if (product.image) {
            try {
                const sanitizedName = sanitizeFilename(product.name);
                const ext = product.image.toLowerCase().includes('.png') ? '.png' : '.jpg';
                imageName = `${sanitizedName}-1${ext}`;
                const imagePath = path.join(OUTPUT_DIR, imageName);
                
                await downloadImage(product.image, imagePath);
                console.log(`[OK] Imagem baixada: ${imageName}`);
                
                // URL para WooCommerce
                imageUrl = `https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/${imageName}`;
            } catch (e) {
                console.log(`[ERROR] Erro ao baixar imagem de ${product.name}: ${e.message}`);
            }
        }
        
        // Descrição curta (primeiros 200 caracteres)
        const shortDesc = product.description ? product.description.substring(0, 200) : '';
        
        // Criar linha do CSV
        const row = [
            '', // ID
            'simple', // Type
            sku, // SKU
            product.name, // Name
            '1', // Published
            '0', // Is featured?
            'visible', // Visibility
            shortDesc, // Short description
            product.description || '', // Description
            '1', // In stock?
            '100', // Stock
            product.price || '0', // Regular price
            '', // Sale price
            'Livros', // Categories
            'n-1, editora, filosofia', // Tags
            imageUrl, // Images
            product.url // External URL
        ].map(escapeCSV).join(',');
        
        csvRows.push(row);
    }
    
    // Salvar CSV
    fs.writeFileSync(CSV_OUTPUT, csvRows.join('\n'), 'utf-8');
    console.log(`\n[INFO] CSV salvo em: ${CSV_OUTPUT}`);
    console.log(`[INFO] Imagens salvas em: ${OUTPUT_DIR}`);
    console.log(`[INFO] Total de produtos faltantes: ${allProducts.length}`);
}

// Executar
scrapeAllProducts().catch(console.error);

