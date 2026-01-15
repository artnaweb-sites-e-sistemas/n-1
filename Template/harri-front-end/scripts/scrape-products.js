/**
 * Script para extrair produtos da loja antiga (Odoo) e gerar CSV para WooCommerce
 * 
 * Uso: node scrape-products.js
 * 
 * Requisitos: npm install axios cheerio csv-writer
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://loja.n-1edicoes.org';
const SHOP_URL = `${BASE_URL}/shop`;

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

// Função para delay entre requisições (evitar bloqueio)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Extrair links de produtos de uma página
async function getProductLinksFromPage(pageUrl) {
    try {
        console.log(`Buscando produtos em: ${pageUrl}`);
        const response = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        const productLinks = [];
        
        // Ajuste o seletor conforme a estrutura do site
        $('a[href*="/shop/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('/shop/') && !href.endsWith('/shop') && !href.endsWith('/shop/')) {
                const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                if (!productLinks.includes(fullUrl)) {
                    productLinks.push(fullUrl);
                }
            }
        });
        
        return productLinks;
    } catch (error) {
        console.error(`Erro ao buscar página ${pageUrl}:`, error.message);
        return [];
    }
}

// Extrair dados de um produto individual
async function getProductData(productUrl) {
    try {
        console.log(`Extraindo produto: ${productUrl}`);
        const response = await axios.get(productUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Extrair dados (ajuste os seletores conforme necessário)
        const name = $('h1').first().text().trim() || 
                     $('[itemprop="name"]').text().trim() ||
                     $('.product-name').text().trim();
        
        // Extrair SKU do título (formato: [ISBN] Nome do Produto)
        const skuMatch = name.match(/\[(\d+)\]/);
        const sku = skuMatch ? skuMatch[1] : '';
        const cleanName = name.replace(/\[\d+\]\s*/, '').trim();
        
        // Preço
        let price = $('[itemprop="price"]').attr('content') ||
                    $('.product-price').text().trim() ||
                    $('span:contains("R$")').first().text().trim();
        
        // Limpar preço
        price = price.replace(/[^\d,\.]/g, '').replace(',', '.');
        
        // Descrição
        const description = $('[itemprop="description"]').text().trim() ||
                           $('.product-description').text().trim() ||
                           $('p').filter((i, el) => $(el).text().length > 50).first().text().trim();
        
        // Imagens
        const images = [];
        $('img[src*="product"], img[src*="image"], .product-image img').each((i, el) => {
            let src = $(el).attr('src') || $(el).attr('data-src');
            if (src) {
                if (!src.startsWith('http')) {
                    src = `${BASE_URL}${src}`;
                }
                if (!images.includes(src) && !src.includes('placeholder') && !src.includes('logo')) {
                    images.push(src);
                }
            }
        });
        
        // Imagem principal do og:image
        const ogImage = $('meta[property="og:image"]').attr('content');
        if (ogImage && !images.includes(ogImage)) {
            images.unshift(ogImage);
        }
        
        return {
            sku: sku,
            name: cleanName,
            published: 1,
            visibility: 'visible',
            short_description: description.substring(0, 200),
            description: description,
            tax_status: 'taxable',
            in_stock: 1,
            stock: 100,
            regular_price: price,
            sale_price: '',
            categories: 'Livros',
            tags: 'n-1, filosofia',
            images: images.join(', '),
            type: 'simple',
        };
    } catch (error) {
        console.error(`Erro ao extrair produto ${productUrl}:`, error.message);
        return null;
    }
}

// Obter todas as páginas de produtos
async function getAllPages() {
    const pages = [SHOP_URL];
    
    // Adicionar páginas 2, 3, 4, 5 (baseado no site)
    for (let i = 2; i <= 5; i++) {
        pages.push(`${SHOP_URL}?page=${i}`);
    }
    
    return pages;
}

// Função principal
async function main() {
    console.log('='.repeat(60));
    console.log('MIGRAÇÃO DE PRODUTOS - N-1 Edições');
    console.log('='.repeat(60));
    console.log('');
    
    // Obter todas as páginas
    const pages = await getAllPages();
    console.log(`Encontradas ${pages.length} páginas para processar`);
    
    // Coletar todos os links de produtos
    let allProductLinks = [];
    for (const page of pages) {
        const links = await getProductLinksFromPage(page);
        allProductLinks = [...allProductLinks, ...links];
        await delay(1000); // Delay entre páginas
    }
    
    // Remover duplicatas
    allProductLinks = [...new Set(allProductLinks)];
    console.log(`\nEncontrados ${allProductLinks.length} produtos únicos`);
    
    // Extrair dados de cada produto
    const products = [];
    for (let i = 0; i < allProductLinks.length; i++) {
        const productData = await getProductData(allProductLinks[i]);
        if (productData && productData.name) {
            products.push(productData);
            console.log(`[${i + 1}/${allProductLinks.length}] ${productData.name}`);
        }
        await delay(500); // Delay entre produtos
    }
    
    // Salvar CSV
    if (products.length > 0) {
        await csvWriter.writeRecords(products);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`SUCESSO! ${products.length} produtos exportados para woocommerce-products.csv`);
        console.log(`${'='.repeat(60)}`);
        console.log('\nPróximos passos:');
        console.log('1. Abra o arquivo woocommerce-products.csv');
        console.log('2. Verifique e ajuste os dados se necessário');
        console.log('3. No WooCommerce, vá em Produtos → Importar');
        console.log('4. Selecione o arquivo CSV e siga as instruções');
    } else {
        console.log('\nNenhum produto encontrado. Verifique os seletores do script.');
    }
}

main().catch(console.error);



