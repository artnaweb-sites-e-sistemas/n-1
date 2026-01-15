/**
 * Script para extrair produtos da loja antiga usando Puppeteer (mais robusto)
 * Renderiza JavaScript, captura imagens e gera CSV para WooCommerce
 * 
 * Uso: node scrape-products-puppeteer.js
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
const IMAGES_DIR = './product-images';

// Criar diretório de imagens se não existir
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Configuração do CSV para WooCommerce
const csvWriter = createObjectCsvWriter({
    path: 'woocommerce-products.csv',
    header: [
        { id: 'sku', title: 'SKU' },
        { id: 'name', title: 'Name' },
        { id: 'published', title: 'Published' },
        { id: 'visibility', title: 'Visibility in catalog' },
        { id: 'short_description', title: 'Short description' },
        { id: 'description', title: 'Description' },
        { id: 'tax_status', title: 'Tax status' },
        { id: 'in_stock', title: 'In stock?' },
        { id: 'stock', title: 'Stock' },
        { id: 'regular_price', title: 'Regular price' },
        { id: 'sale_price', title: 'Sale price' },
        { id: 'categories', title: 'Categories' },
        { id: 'tags', title: 'Tags' },
        { id: 'images', title: 'Images' },
        { id: 'type', title: 'Type' },
    ]
});

// Função para delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Download de imagem
async function downloadImage(url, filename) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const filepath = path.join(IMAGES_DIR, filename);
        
        const file = fs.createWriteStream(filepath);
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Seguir redirecionamento
                downloadImage(response.headers.location, filename).then(resolve).catch(reject);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => {}); // Deletar arquivo parcial
            reject(err);
        });
    });
}

async function main() {
    console.log('='.repeat(60));
    console.log('MIGRAÇÃO DE PRODUTOS - N-1 Edições (Puppeteer)');
    console.log('='.repeat(60));
    console.log('');
    
    // Iniciar navegador
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    try {
        // Navegar para a loja
        console.log('Acessando a loja...');
        await page.goto(SHOP_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await delay(2000);
        
        // Coletar todos os links de produtos (navegando por todas as páginas)
        let allProductLinks = [];
        let hasNextPage = true;
        let currentPage = 1;
        
        while (hasNextPage) {
            console.log(`\nProcessando página ${currentPage}...`);
            
            // Extrair links de produtos da página atual
            const productLinks = await page.evaluate((baseUrl) => {
                const links = [];
                document.querySelectorAll('a[href*="/shop/"]').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && href.includes('/shop/') && !href.endsWith('/shop') && !href.endsWith('/shop/')) {
                        const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href}`;
                        if (!links.includes(fullUrl)) {
                            links.push(fullUrl);
                        }
                    }
                });
                return links;
            }, BASE_URL);
            
            allProductLinks = [...allProductLinks, ...productLinks];
            console.log(`Encontrados ${productLinks.length} produtos na página ${currentPage}`);
            
            // Verificar se há próxima página
            const nextButton = await page.$('a:has-text("Próximo"), a:has-text("Next"), .pagination-next a, a[rel="next"]');
            if (nextButton && currentPage < 10) { // Limite de segurança
                await nextButton.click();
                await delay(2000);
                currentPage++;
            } else {
                hasNextPage = false;
            }
        }
        
        // Remover duplicatas
        allProductLinks = [...new Set(allProductLinks)];
        console.log(`\nTotal: ${allProductLinks.length} produtos únicos encontrados`);
        
        // Extrair dados de cada produto
        const products = [];
        for (let i = 0; i < allProductLinks.length; i++) {
            const productUrl = allProductLinks[i];
            console.log(`\n[${i + 1}/${allProductLinks.length}] Processando: ${productUrl}`);
            
            try {
                await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });
                await delay(1000);
                
                // Extrair dados do produto
                const productData = await page.evaluate((baseUrl) => {
                    // Nome do produto
                    let name = document.querySelector('h1')?.textContent?.trim() ||
                               document.querySelector('[itemprop="name"]')?.textContent?.trim() ||
                               document.querySelector('.product-name')?.textContent?.trim() || '';
                    
                    // Extrair SKU do nome (formato: [ISBN] Nome)
                    const skuMatch = name.match(/\[(\d+)\]/);
                    const sku = skuMatch ? skuMatch[1] : '';
                    const cleanName = name.replace(/\[\d+\]\s*/, '').trim();
                    
                    // Preço
                    let price = document.querySelector('[itemprop="price"]')?.getAttribute('content') ||
                               document.querySelector('.oe_currency_value')?.textContent?.trim() ||
                               document.querySelector('.product-price')?.textContent?.trim() || '';
                    
                    // Limpar preço
                    price = price.replace(/[^\d,\.]/g, '').replace(',', '.');
                    
                    // Descrição
                    const description = document.querySelector('[itemprop="description"]')?.textContent?.trim() ||
                                       document.querySelector('.product-description')?.textContent?.trim() ||
                                       document.querySelector('#product_details .tab-content')?.textContent?.trim() || '';
                    
                    // Imagens
                    const images = [];
                    
                    // Imagem principal
                    const mainImg = document.querySelector('.product_detail_img img, .carousel-item.active img, [itemprop="image"]');
                    if (mainImg) {
                        let src = mainImg.getAttribute('src') || mainImg.getAttribute('data-src');
                        if (src && !src.includes('placeholder')) {
                            if (!src.startsWith('http')) src = `${baseUrl}${src}`;
                            images.push(src);
                        }
                    }
                    
                    // Outras imagens
                    document.querySelectorAll('.carousel-item img, .product-gallery img, .thumbnail img').forEach(img => {
                        let src = img.getAttribute('src') || img.getAttribute('data-src');
                        if (src && !src.includes('placeholder') && !src.includes('logo')) {
                            if (!src.startsWith('http')) src = `${baseUrl}${src}`;
                            if (!images.includes(src)) images.push(src);
                        }
                    });
                    
                    // og:image como fallback
                    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
                    if (ogImage && !images.includes(ogImage)) {
                        images.unshift(ogImage);
                    }
                    
                    return {
                        sku,
                        name: cleanName,
                        price,
                        description,
                        images
                    };
                }, BASE_URL);
                
                if (productData.name) {
                    // Baixar imagens
                    const localImages = [];
                    for (let j = 0; j < productData.images.length; j++) {
                        const imgUrl = productData.images[j];
                        const ext = path.extname(imgUrl).split('?')[0] || '.jpg';
                        const filename = `${productData.sku || 'product'}-${i}-${j}${ext}`;
                        try {
                            await downloadImage(imgUrl, filename);
                            localImages.push(filename);
                            console.log(`  ✓ Imagem baixada: ${filename}`);
                        } catch (err) {
                            console.log(`  ✗ Erro ao baixar imagem: ${imgUrl}`);
                            // Manter URL original se o download falhar
                            localImages.push(imgUrl);
                        }
                    }
                    
                    products.push({
                        sku: productData.sku,
                        name: productData.name,
                        published: 1,
                        visibility: 'visible',
                        short_description: productData.description.substring(0, 200),
                        description: productData.description,
                        tax_status: 'taxable',
                        in_stock: 1,
                        stock: 100,
                        regular_price: productData.price,
                        sale_price: '',
                        categories: 'Livros',
                        tags: 'n-1, filosofia, editora',
                        images: localImages.join(', '),
                        type: 'simple',
                    });
                    
                    console.log(`  ✓ ${productData.name} - R$ ${productData.price}`);
                }
            } catch (err) {
                console.log(`  ✗ Erro ao processar: ${err.message}`);
            }
            
            await delay(500);
        }
        
        // Salvar CSV
        if (products.length > 0) {
            await csvWriter.writeRecords(products);
            console.log(`\n${'='.repeat(60)}`);
            console.log(`SUCESSO! ${products.length} produtos exportados`);
            console.log(`${'='.repeat(60)}`);
            console.log(`\nArquivos gerados:`);
            console.log(`  - woocommerce-products.csv (dados dos produtos)`);
            console.log(`  - ${IMAGES_DIR}/ (imagens dos produtos)`);
            console.log(`\nPróximos passos:`);
            console.log(`1. Faça upload das imagens em ${IMAGES_DIR} para wp-content/uploads/`);
            console.log(`2. Atualize o CSV com as URLs corretas das imagens`);
            console.log(`3. No WooCommerce, vá em Produtos → Importar`);
            console.log(`4. Selecione o arquivo CSV e siga as instruções`);
        }
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await browser.close();
    }
}

main();


