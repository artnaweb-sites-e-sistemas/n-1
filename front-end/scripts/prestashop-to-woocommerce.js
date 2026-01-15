/**
 * Script para migrar produtos do PrestaShop para WooCommerce
 * 
 * Este script conecta ao banco de dados PrestaShop e exporta todos os produtos
 * em formato compatível com o importador do WooCommerce.
 * 
 * Uso: node prestashop-to-woocommerce.js
 * 
 * Requisitos: npm install mysql2 csv-writer dotenv
 */

const mysql = require('mysql2/promise');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados PrestaShop
// Atualize com suas credenciais
const DB_CONFIG = {
    host: process.env.PS_DB_HOST || 'localhost',
    user: process.env.PS_DB_USER || 'root',
    password: process.env.PS_DB_PASSWORD || '',
    database: process.env.PS_DB_NAME || 'prestashop',
    port: process.env.PS_DB_PORT || 3306,
};

// Prefixo das tabelas do PrestaShop (padrão: ps_)
const TABLE_PREFIX = process.env.PS_TABLE_PREFIX || 'ps_';

// URL base das imagens do PrestaShop
const PS_IMAGE_URL = process.env.PS_IMAGE_URL || 'https://loja.n-1edicoes.org/img/p';

// URL base para onde as imagens serão hospedadas no WooCommerce
const WC_IMAGE_URL = process.env.WC_IMAGE_URL || 'https://n-1.artnaweb.com.br/wp-content/uploads/products';

// ID do idioma (1 = português)
const LANGUAGE_ID = 1;

// Configuração do CSV para WooCommerce
const csvWriter = createObjectCsvWriter({
    path: 'woocommerce-products-prestashop.csv',
    header: [
        { id: 'sku', title: 'SKU' },
        { id: 'name', title: 'Name' },
        { id: 'published', title: 'Published' },
        { id: 'featured', title: 'Is featured?' },
        { id: 'visibility', title: 'Visibility in catalog' },
        { id: 'short_description', title: 'Short description' },
        { id: 'description', title: 'Description' },
        { id: 'tax_status', title: 'Tax status' },
        { id: 'tax_class', title: 'Tax class' },
        { id: 'in_stock', title: 'In stock?' },
        { id: 'stock', title: 'Stock' },
        { id: 'backorders', title: 'Backorders allowed?' },
        { id: 'sold_individually', title: 'Sold individually?' },
        { id: 'weight', title: 'Weight (kg)' },
        { id: 'length', title: 'Length (cm)' },
        { id: 'width', title: 'Width (cm)' },
        { id: 'height', title: 'Height (cm)' },
        { id: 'regular_price', title: 'Regular price' },
        { id: 'sale_price', title: 'Sale price' },
        { id: 'categories', title: 'Categories' },
        { id: 'tags', title: 'Tags' },
        { id: 'images', title: 'Images' },
        { id: 'type', title: 'Type' },
        { id: 'meta_title', title: 'Meta: _yoast_wpseo_title' },
        { id: 'meta_description', title: 'Meta: _yoast_wpseo_metadesc' },
    ]
});

/**
 * Gera o caminho da imagem no PrestaShop baseado no ID
 * Ex: ID 123 → /1/2/3/123.jpg
 */
function getImagePath(imageId) {
    const idStr = imageId.toString();
    const folders = idStr.split('').join('/');
    return `${folders}/${imageId}`;
}

/**
 * Remove tags HTML e limpa texto
 */
function cleanHtml(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

/**
 * Função principal
 */
async function main() {
    console.log('='.repeat(60));
    console.log('MIGRAÇÃO PRESTASHOP → WOOCOMMERCE');
    console.log('N-1 Edições');
    console.log('='.repeat(60));
    console.log('');
    
    let connection;
    
    try {
        // Conectar ao banco de dados
        console.log('Conectando ao banco de dados PrestaShop...');
        connection = await mysql.createConnection(DB_CONFIG);
        console.log('✓ Conectado com sucesso!\n');
        
        // Buscar produtos
        console.log('Buscando produtos...');
        const [products] = await connection.execute(`
            SELECT 
                p.id_product,
                p.reference,
                p.price,
                p.wholesale_price,
                p.weight,
                p.width,
                p.height,
                p.depth,
                p.active,
                p.quantity,
                p.ean13,
                p.isbn,
                pl.name,
                pl.description,
                pl.description_short,
                pl.meta_title,
                pl.meta_description,
                pl.meta_keywords,
                pl.link_rewrite
            FROM ${TABLE_PREFIX}product p
            LEFT JOIN ${TABLE_PREFIX}product_lang pl ON p.id_product = pl.id_product
            WHERE pl.id_lang = ?
            ORDER BY p.id_product
        `, [LANGUAGE_ID]);
        
        console.log(`✓ Encontrados ${products.length} produtos\n`);
        
        // Buscar categorias de cada produto
        console.log('Buscando categorias...');
        const [categories] = await connection.execute(`
            SELECT 
                cp.id_product,
                cl.name as category_name
            FROM ${TABLE_PREFIX}category_product cp
            LEFT JOIN ${TABLE_PREFIX}category_lang cl ON cp.id_category = cl.id_category
            WHERE cl.id_lang = ?
        `, [LANGUAGE_ID]);
        
        // Mapear categorias por produto
        const categoryMap = {};
        categories.forEach(cat => {
            if (!categoryMap[cat.id_product]) {
                categoryMap[cat.id_product] = [];
            }
            if (cat.category_name && cat.category_name !== 'Home' && cat.category_name !== 'Root') {
                categoryMap[cat.id_product].push(cat.category_name);
            }
        });
        console.log('✓ Categorias mapeadas\n');
        
        // Buscar imagens de cada produto
        console.log('Buscando imagens...');
        const [images] = await connection.execute(`
            SELECT 
                id_product,
                id_image,
                cover
            FROM ${TABLE_PREFIX}image
            ORDER BY id_product, position
        `);
        
        // Mapear imagens por produto
        const imageMap = {};
        images.forEach(img => {
            if (!imageMap[img.id_product]) {
                imageMap[img.id_product] = [];
            }
            imageMap[img.id_product].push({
                id: img.id_image,
                cover: img.cover === 1
            });
        });
        console.log('✓ Imagens mapeadas\n');
        
        // Buscar tags de cada produto
        console.log('Buscando tags...');
        const [tags] = await connection.execute(`
            SELECT 
                pt.id_product,
                t.name as tag_name
            FROM ${TABLE_PREFIX}product_tag pt
            LEFT JOIN ${TABLE_PREFIX}tag t ON pt.id_tag = t.id_tag
            WHERE t.id_lang = ?
        `, [LANGUAGE_ID]);
        
        // Mapear tags por produto
        const tagMap = {};
        tags.forEach(tag => {
            if (!tagMap[tag.id_product]) {
                tagMap[tag.id_product] = [];
            }
            if (tag.tag_name) {
                tagMap[tag.id_product].push(tag.tag_name);
            }
        });
        console.log('✓ Tags mapeadas\n');
        
        // Buscar estoque de cada produto
        console.log('Buscando estoque...');
        const [stock] = await connection.execute(`
            SELECT 
                id_product,
                quantity
            FROM ${TABLE_PREFIX}stock_available
            WHERE id_product_attribute = 0
        `);
        
        // Mapear estoque por produto
        const stockMap = {};
        stock.forEach(s => {
            stockMap[s.id_product] = s.quantity;
        });
        console.log('✓ Estoque mapeado\n');
        
        // Processar produtos para WooCommerce
        console.log('Processando produtos para WooCommerce...\n');
        const wcProducts = [];
        
        for (const product of products) {
            const productId = product.id_product;
            
            // SKU (usar ISBN, EAN13 ou referência)
            const sku = product.isbn || product.ean13 || product.reference || `PS-${productId}`;
            
            // Imagens
            const productImages = imageMap[productId] || [];
            const imageUrls = productImages.map(img => {
                const imagePath = getImagePath(img.id);
                return `${PS_IMAGE_URL}/${imagePath}.jpg`;
            });
            
            // Categorias
            const productCategories = categoryMap[productId] || ['Livros'];
            
            // Tags
            const productTags = tagMap[productId] || [];
            
            // Estoque
            const productStock = stockMap[productId] || product.quantity || 0;
            
            // Criar objeto do produto para WooCommerce
            const wcProduct = {
                sku: sku,
                name: product.name || '',
                published: product.active === 1 ? 1 : 0,
                featured: 0,
                visibility: 'visible',
                short_description: cleanHtml(product.description_short) || '',
                description: product.description || '',
                tax_status: 'taxable',
                tax_class: '',
                in_stock: productStock > 0 ? 1 : 0,
                stock: productStock,
                backorders: 0,
                sold_individually: 0,
                weight: product.weight || '',
                length: product.depth || '',
                width: product.width || '',
                height: product.height || '',
                regular_price: product.price ? parseFloat(product.price).toFixed(2) : '',
                sale_price: '',
                categories: productCategories.join(' > '),
                tags: productTags.join(', '),
                images: imageUrls.join(', '),
                type: 'simple',
                meta_title: product.meta_title || product.name || '',
                meta_description: product.meta_description || cleanHtml(product.description_short)?.substring(0, 160) || '',
            };
            
            wcProducts.push(wcProduct);
            console.log(`[${wcProducts.length}/${products.length}] ${product.name}`);
        }
        
        // Salvar CSV
        console.log('\nSalvando CSV...');
        await csvWriter.writeRecords(wcProducts);
        
        console.log(`\n${'='.repeat(60)}`);
        console.log(`SUCESSO! ${wcProducts.length} produtos exportados`);
        console.log('='.repeat(60));
        console.log(`\nArquivo gerado: woocommerce-products-prestashop.csv`);
        console.log(`\nPróximos passos:`);
        console.log(`1. Copie as imagens de img/p/ do PrestaShop para wp-content/uploads/products/`);
        console.log(`2. Atualize as URLs das imagens no CSV se necessário`);
        console.log(`3. No WooCommerce, vá em Produtos → Importar`);
        console.log(`4. Selecione o arquivo CSV e siga as instruções`);
        
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\nVerifique:');
            console.log('1. Se o MySQL está rodando');
            console.log('2. Se as credenciais estão corretas');
            console.log('3. Se o host está acessível');
        }
        
        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\nCredenciais inválidas. Verifique usuário e senha.');
        }
        
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\nBanco de dados não encontrado. Verifique o nome do banco.');
        }
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nConexão encerrada.');
        }
    }
}

// Executar
main();



