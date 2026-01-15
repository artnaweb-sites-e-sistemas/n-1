/**
 * Script para baixar produtos e imagens do site da N-1 Edições
 * Não precisa de acesso ao banco de dados - faz scraping do site público
 * 
 * Uso: node download-products-images.js
 * 
 * Requisitos: npm install puppeteer csv-writer
 */

const puppeteer = require('puppeteer');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'https://loja.n-1edicoes.org';
const SHOP_URL = `${BASE_URL}/shop`;
const IMAGES_DIR = './n1-products-images';
const OUTPUT_CSV = 'n1-woocommerce-products.csv';

// Criar diretório de imagens
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// CSV para WooCommerce
const csvWriter = createObjectCsvWriter({
    path: OUTPUT_CSV,
    header: [
        { id: 'id', title: 'ID' },
        { id: 'type', title: 'Type' },
        { id: 'sku', title: 'SKU' },
        { id: 'name', title: 'Name' },
        { id: 'published', title: 'Published' },
        { id: 'featured', title: 'Is featured?' },
        { id: 'visibility', title: 'Visibility in catalog' },
        { id: 'short_description', title: 'Short description' },
        { id: 'description', title: 'Description' },
        { id: 'in_stock', title: 'In stock?' },
        { id: 'stock', title: 'Stock' },
        { id: 'regular_price', title: 'Regular price' },
        { id: 'sale_price', title: 'Sale price' },
        { id: 'categories', title: 'Categories' },
        { id: 'tags', title: 'Tags' },
        { id: 'images', title: 'Images' },
        { id: 'external_url', title: 'External URL' },
    ]
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Download de imagem
async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        if (!url || url === 'undefined') {
            reject(new Error('URL inválida'));
            return;
        }
        
        const fullUrl = url.startsWith('//') ? `https:${url}` : url;
        const protocol = fullUrl.startsWith('https') ? https : http;
        const filepath = path.join(IMAGES_DIR, filename);
        
        const file = fs.createWriteStream(filepath);
        
        const request = protocol.get(fullUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        }, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location, filename)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        });
        
        request.on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
        
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Extrair ISBN do nome do produto
function extractISBN(name) {
    const match = name.match(/\[?(\d{13})\]?/);
    return match ? match[1] : '';
}

// Limpar nome do produto
function cleanProductName(name) {
    return name
        .replace(/\[\d{13}\]\s*/g, '')
        .replace(/\([^)]+\)\s*\[[A-Z0-9]+\]/g, '')
        .trim();
}

// Limpar preço
function cleanPrice(priceStr) {
    if (!priceStr) return '';
    const match = priceStr.match(/[\d.,]+/);
    if (!match) return '';
    return match[0].replace('.', '').replace(',', '.');
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     DOWNLOAD DE PRODUTOS - N-1 EDIÇÕES                     ║');
    console.log('║     Script de Migração para WooCommerce                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // Navegar para a loja
        console.log('📦 Acessando a loja...');
        await page.goto(SHOP_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await delay(3000);
        
        // Coletar todos os links de produtos
        console.log('🔍 Coletando links de produtos...\n');
        let allProductLinks = [];
        let pageNum = 1;
        
        while (true) {
            console.log(`   Página ${pageNum}...`);
            
            // Extrair links da página atual
            const links = await page.evaluate(() => {
                const productLinks = [];
                document.querySelectorAll('a').forEach(a => {
                    const href = a.href;
                    if (href && href.includes('/shop/') && 
                        !href.endsWith('/shop') && 
                        !href.endsWith('/shop/') &&
                        href.includes('-')) {
                        if (!productLinks.includes(href)) {
                            productLinks.push(href);
                        }
                    }
                });
                return productLinks;
            });
            
            allProductLinks = [...allProductLinks, ...links];
            console.log(`   → ${links.length} produtos encontrados`);
            
            // Tentar ir para próxima página usando JavaScript puro
            const hasNextPage = await page.evaluate(() => {
                // Primeiro tentar seletores CSS padrão
                const selectors = [
                    'a.next',
                    'a[rel="next"]',
                    '.pagination-next a',
                    '.pager-next a',
                    'li.next a',
                ];
                
                for (const selector of selectors) {
                    try {
                        const el = document.querySelector(selector);
                        if (el && !el.classList.contains('disabled')) {
                            el.click();
                            return true;
                        }
                    } catch (e) {}
                }
                
                // Procurar por texto "Próximo", "Next", "›"
                const allLinks = Array.from(document.querySelectorAll('a'));
                for (const link of allLinks) {
                    const text = link.textContent.trim().toLowerCase();
                    if ((text === 'próximo' || text === 'next' || text === '›' || text === '>' || text === '»') && 
                        !link.classList.contains('disabled') &&
                        link.offsetParent !== null) { // Verifica se está visível
                        link.click();
                        return true;
                    }
                }
                
                return false;
            });
            
            if (hasNextPage && pageNum < 10) {
                await delay(2000);
                pageNum++;
            } else {
                break;
            }
        }
        
        // Remover duplicatas
        allProductLinks = [...new Set(allProductLinks)];
        console.log(`\n✓ Total: ${allProductLinks.length} produtos únicos\n`);
        
        // Processar cada produto
        console.log('📥 Baixando dados e imagens dos produtos...\n');
        const products = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < allProductLinks.length; i++) {
            const productUrl = allProductLinks[i];
            const progress = `[${i + 1}/${allProductLinks.length}]`;
            
            try {
                await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await delay(1500);
                
                // Tentar clicar na aba de descrição se existir
                try {
                    await page.evaluate(() => {
                        // Procurar por abas de descrição
                        const tabSelectors = [
                            'a[href="#description"]',
                            'a[data-toggle="tab"][href*="description"]',
                            'button[data-target*="description"]',
                            '.nav-tabs a:first-child',
                            'a.nav-link:first-child',
                            '[data-tab="description"]',
                        ];
                        
                        for (const selector of tabSelectors) {
                            const tab = document.querySelector(selector);
                            if (tab) {
                                tab.click();
                                break;
                            }
                        }
                    });
                    await delay(500);
                } catch (e) {
                    // Ignorar se não conseguir clicar na aba
                }
                
                // Extrair dados do produto
                const productData = await page.evaluate(() => {
                    // Nome
                    const nameEl = document.querySelector('h1, .product-name, [itemprop="name"]');
                    const name = nameEl ? nameEl.innerText.trim() : '';
                    
                    // Preço - tentar vários seletores
                    let price = '';
                    const priceSelectors = [
                        '.oe_currency_value',
                        '[itemprop="price"]',
                        '.product-price',
                        '.price',
                        '.product_price',
                    ];
                    
                    for (const selector of priceSelectors) {
                        const priceEl = document.querySelector(selector);
                        if (priceEl) {
                            price = priceEl.innerText || priceEl.getAttribute('content') || '';
                            if (price) break;
                        }
                    }
                    
                    // Se não encontrou, procurar por texto "R$"
                    if (!price) {
                        const allSpans = Array.from(document.querySelectorAll('span, div, p'));
                        for (const el of allSpans) {
                            if (el.innerText && el.innerText.includes('R$') && el.innerText.length < 30) {
                                price = el.innerText;
                                break;
                            }
                        }
                    }
                    
                    // Descrição - tentar vários seletores específicos do Odoo/site
                    let description = '';
                    
                    // Seletores específicos para descrição de produto
                    const descSelectors = [
                        '#product_full_description',
                        '.o_product_page_description',
                        '.product_description',
                        '#tab-description',
                        '.tab-pane.active',
                        '[itemprop="description"]',
                        '.oe_website_sale .product_attributes',
                        '#product_details .tab-content',
                        '.product-detail-description',
                        '.s_text_block',
                        '.product_attributes_simple',
                    ];
                    
                    for (const selector of descSelectors) {
                        const descEl = document.querySelector(selector);
                        if (descEl) {
                            const text = descEl.innerText.trim();
                            // Verificar se é uma descrição válida (mais de 50 chars e não contém "ADICIONAR" ou preço)
                            if (text.length > 50 && !text.includes('ADICIONAR') && !text.match(/^R\$\s*[\d,.]+$/)) {
                                description = text;
                                break;
                            }
                        }
                    }
                    
                    // Se não encontrou, procurar por parágrafos longos na página
                    if (!description) {
                        const paragraphs = Array.from(document.querySelectorAll('p, div.s_text_block, div.o_wsale_product_sub'));
                        for (const p of paragraphs) {
                            const text = p.innerText.trim();
                            // Texto deve ser longo e não conter elementos de UI
                            if (text.length > 100 && 
                                !text.includes('ADICIONAR') && 
                                !text.includes('R$') &&
                                !text.includes('Carrinho') &&
                                !p.closest('header') &&
                                !p.closest('footer') &&
                                !p.closest('nav')) {
                                description = text;
                                break;
                            }
                        }
                    }
                    
                    // Se ainda não encontrou, tentar pegar de meta description
                    if (!description) {
                        const metaDesc = document.querySelector('meta[name="description"]');
                        if (metaDesc) {
                            description = metaDesc.getAttribute('content') || '';
                        }
                    }
                    
                    // Imagens
                    const images = [];
                    
                    // Imagem principal
                    const mainImg = document.querySelector('.product_detail_img img, [itemprop="image"], .carousel-item.active img, .product-image img');
                    if (mainImg) {
                        const src = mainImg.src || mainImg.getAttribute('data-src');
                        if (src && !src.includes('placeholder') && !src.includes('logo')) {
                            images.push(src);
                        }
                    }
                    
                    // Outras imagens
                    document.querySelectorAll('.carousel-item img, .thumbnail img, .product-gallery img').forEach(img => {
                        const src = img.src || img.getAttribute('data-src');
                        if (src && !src.includes('placeholder') && !src.includes('logo') && !images.includes(src)) {
                            images.push(src);
                        }
                    });
                    
                    // og:image
                    const ogImg = document.querySelector('meta[property="og:image"]');
                    if (ogImg) {
                        const src = ogImg.getAttribute('content');
                        if (src && !images.includes(src)) {
                            images.unshift(src);
                        }
                    }
                    
                    return { name, price, description, images };
                });
                
                if (!productData.name) {
                    console.log(`${progress} ⚠️  Produto sem nome: ${productUrl}`);
                    errorCount++;
                    continue;
                }
                
                // Processar dados
                const isbn = extractISBN(productData.name);
                const cleanName = cleanProductName(productData.name);
                const cleanedPrice = cleanPrice(productData.price);
                
                // Baixar imagens
                const localImages = [];
                const sanitizedName = cleanName.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
                
                for (let j = 0; j < productData.images.length && j < 5; j++) {
                    const imgUrl = productData.images[j];
                    const ext = '.jpg'; // Padrão
                    const filename = `${isbn || sanitizedName}-${j + 1}${ext}`;
                    
                    try {
                        await downloadImage(imgUrl, filename);
                        localImages.push(filename);
                    } catch (err) {
                        // Manter URL original se falhar
                        localImages.push(imgUrl);
                    }
                }
                
                // Adicionar produto
                products.push({
                    id: '',
                    type: 'simple',
                    sku: isbn || `N1-${i + 1}`,
                    name: cleanName,
                    published: 1,
                    featured: 0,
                    visibility: 'visible',
                    short_description: productData.description.substring(0, 200),
                    description: productData.description,
                    in_stock: 1,
                    stock: 100,
                    regular_price: cleanedPrice,
                    sale_price: '',
                    categories: 'Livros',
                    tags: 'n-1, editora, filosofia',
                    images: localImages.join(', '),
                    external_url: productUrl,
                });
                
                console.log(`${progress} ✓ ${cleanName.substring(0, 50)}... - R$ ${cleanedPrice}`);
                successCount++;
                
            } catch (err) {
                console.log(`${progress} ❌ Erro: ${err.message}`);
                errorCount++;
            }
            
            await delay(500);
        }
        
        // Salvar CSV
        console.log('\n📄 Salvando CSV...');
        await csvWriter.writeRecords(products);
        
        // Resumo
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║                    MIGRAÇÃO CONCLUÍDA                      ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        console.log(`\n📊 Resumo:`);
        console.log(`   ✓ Produtos exportados: ${successCount}`);
        console.log(`   ❌ Erros: ${errorCount}`);
        console.log(`\n📁 Arquivos gerados:`);
        console.log(`   → ${OUTPUT_CSV}`);
        console.log(`   → ${IMAGES_DIR}/`);
        console.log(`\n📋 Próximos passos:`);
        console.log(`   1. Verifique o arquivo CSV gerado`);
        console.log(`   2. Faça upload das imagens para wp-content/uploads/products/`);
        console.log(`   3. Atualize as URLs das imagens no CSV`);
        console.log(`   4. Importe o CSV no WooCommerce (Produtos → Importar)`);
        
    } catch (error) {
        console.error('\n❌ Erro fatal:', error);
    } finally {
        await browser.close();
        console.log('\n✓ Navegador fechado.');
    }
}

main();

