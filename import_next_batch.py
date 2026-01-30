#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar o próximo lote de produtos faltantes
"""

import json
import os
import sys
import re
from difflib import SequenceMatcher

# Importar funções necessárias
try:
    from extract_product_v2 import extract_product_info, extract_metadata_from_html, download_file
    from import_all_products import get_product_image_from_catalog, create_slug
except ImportError as e:
    print(f"Erro ao importar módulos: {e}")
    sys.exit(1)

if sys.platform == 'win32':
    import io
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    if sys.stderr.encoding != 'utf-8':
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def normalize_title(title):
    """Normaliza o título para comparação"""
    if not title:
        return ""
    normalized = title.lower()
    normalized = normalized.replace('``', '"').replace("''", '"')
    normalized = normalized.replace('—', '-').replace('–', '-')
    normalized = normalized.replace(':', '').replace(';', '')
    normalized = normalized.replace('?', '').replace('!', '')
    normalized = normalized.replace('.', '').strip()
    return normalized

def find_product_by_title(target_title, products):
    """Encontra um produto na lista pelo título"""
    best_match = None
    highest_ratio = 0.0
    normalized_target = normalize_title(target_title)

    for product in products:
        product_title = product.get('title', '')
        normalized_product = normalize_title(product_title)
        
        if normalized_target == normalized_product:
            return product, 1.0
        
        if normalized_target in normalized_product or normalized_product in normalized_target:
            ratio = max(
                SequenceMatcher(None, normalized_target, normalized_product).ratio(),
                SequenceMatcher(None, normalized_product, normalized_target).ratio()
            )
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = product
        
        ratio = SequenceMatcher(None, normalized_target, normalized_product).ratio()
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = product
    
    if highest_ratio >= 0.7:
        return best_match, highest_ratio
    return None, highest_ratio

def import_product_from_url(product_url, correct_cover_url, catalog_url='https://n-1edicoes.org/catalogo/'):
    """Importa um produto a partir da URL"""
    try:
        print(f"  Importando produto...")
        
        # Extrair informações do produto
        product_info = extract_product_info(product_url)
        
        if not product_info or not product_info.get('title'):
            print(f"  [X] Não foi possível extrair título do produto")
            return None
        
        # Obter capa correta do catálogo
        cover_url = correct_cover_url
        if not cover_url:
            # Tentar buscar no catálogo
            cover_url = get_product_image_from_catalog(catalog_url, product_url, product_info.get('title'))
        
        if not cover_url:
            print(f"  [!] Capa não encontrada, usando placeholder")
            cover_url = 'https://n-1.artnaweb.com.br/wp-content/uploads/woocommerce-placeholder-1024x1024.webp'
        
        # Criar slug
        slug = create_slug(product_info['title'])
        
        # Gerar SKU se não tiver
        sku = product_info.get('sku', '')
        if not sku:
            # Tentar extrair do ISBN
            isbn = product_info.get('isbn', '')
            if isbn:
                sku = re.sub(r'[^\d]', '', isbn)
            else:
                # Usar hash do slug como fallback
                sku = f"CAT{abs(hash(slug)) % 10000000000:010d}"
        
        # Baixar capa
        images_dir = "front-end/public/images"
        os.makedirs(images_dir, exist_ok=True)
        
        cover_filename = f"cover_{sku}.jpg"
        
        if cover_url and not cover_url.startswith('/images/'):
            downloaded = download_file(cover_url, images_dir, cover_filename)
            if downloaded:
                cover_path = f"/images/{cover_filename}"
            else:
                cover_path = f"/images/{cover_filename}"  # Tentar mesmo assim
        else:
            cover_path = f"/images/{cover_filename}"
        
        # Extrair metadados do HTML
        metadata = {}
        if product_info.get('catalog_content'):
            metadata = extract_metadata_from_html(product_info['catalog_content'])
        
        # Remover metadados do HTML
        if product_info.get('catalog_content'):
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(product_info['catalog_content'], 'html.parser')
            metadata_paragraphs = soup.find_all('p')
            for p in metadata_paragraphs:
                text = p.get_text()
                if ('Título:' in text or 'Autor:' in text or 'ISBN:' in text) and \
                   ('Ano:' in text or 'Dimensões:' in text or 'Preço:' in text):
                    p.decompose()
                    break
            product_info['catalog_content'] = str(soup)
        
        # Converter preço
        price_str = product_info.get('price', '0').replace('R$', '').replace('.', '').replace(',', '.').strip()
        try:
            price_float = float(price_str)
        except ValueError:
            price_float = 0.0
        
        # Baixar imagens internas
        catalog_images = []
        if product_info.get('catalog_images'):
            for idx, img_url in enumerate(product_info['catalog_images'][:10]):
                if img_url and not img_url.startswith('/images/'):
                    img_filename = f"catalog_{sku}_{idx}_{os.path.basename(img_url).split('?')[0]}"
                    downloaded = download_file(img_url, images_dir, img_filename)
                    if downloaded:
                        catalog_images.append(f"/images/{img_filename}")
        
        # Criar objeto do produto
        product = {
            "_id": f"catalog-{slug}",
            "id": f"catalog-{slug}",
            "title": product_info.get('title', ''),
            "description": product_info.get('description', ''),
            "shortDescription": (product_info.get('description', '')[:200] + '...') if len(product_info.get('description', '')) > 200 else product_info.get('description', ''),
            "image": cover_path,
            "images": [cover_path],
            "price": price_float,
            "originalPrice": price_float,
            "discount": 0,
            "sku": sku,
            "stock": None,
            "inStock": True,
            "tags": [product_info.get('author', '')] if product_info.get('author') else [],
            "categories": ["Livros"],
            "itemInfo": "latest-product",
            "rating": {"average": 0, "count": 0},
            "permalink": f"/livros/{slug}",
            "slug": slug,
            "catalogContent": product_info.get('catalog_content', ''),
            "catalogImages": catalog_images,
            "catalogPdf": product_info.get('pdf_url', ''),
            "source": "catalog"
        }
        
        # Adicionar metadados
        product.update(metadata)
        
        return product
        
    except Exception as e:
        error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
        print(f"  [X] Erro ao importar: {error_msg[:100]}")
        return None

def main():
    correct_structure_file = 'catalog_correct_structure.json'
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    batch_size = 10
    
    print("="*80)
    print("IMPORTAÇÃO DO PRÓXIMO LOTE DE PRODUTOS")
    print("="*80)
    
    # Carregar estrutura correta
    with open(correct_structure_file, 'r', encoding='utf-8') as f:
        correct_structure = json.load(f)
    
    # Carregar produtos importados
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    # Criar set de slugs importados
    imported_slugs = {p.get('slug', '') for p in imported_products if p.get('slug')}
    
    # Encontrar produtos faltantes (verificando por slug e título)
    missing_products = []
    imported_titles = {normalize_title(p.get('title', '')) for p in imported_products}
    
    for product in correct_structure:
        slug = product.get('slug', '')
        title = product.get('title', '')
        normalized_title = normalize_title(title)
        
        # Verificar se falta por slug E por título (pode ter slug diferente mas mesmo título)
        slug_missing = slug and slug not in imported_slugs
        title_missing = normalized_title and normalized_title not in imported_titles
        
        if slug_missing and title_missing:
            missing_products.append(product)
    
    print(f"\nTotal no catálogo correto: {len(correct_structure)}")
    print(f"Total importados: {len(imported_products)}")
    print(f"Produtos faltantes encontrados: {len(missing_products)}")
    
    if not missing_products:
        print("\n✓ Todos os produtos já foram importados!")
        return
    
    # Processar próximo lote
    batch = missing_products[:batch_size]
    print(f"\nProcessando lote de {len(batch)} produtos...")
    print("="*80)
    
    imported_count = 0
    updated_count = 0
    errors = 0
    
    for idx, correct_item in enumerate(batch, 1):
        title = correct_item.get('title', 'N/A')
        url = correct_item.get('url', '')
        cover_url = correct_item.get('cover_image', '')
        
        print(f"\n[{idx}/{len(batch)}] {title}")
        print(f"  URL: {url}")
        
        if not url:
            print(f"  [X] URL não encontrada, pulando...")
            errors += 1
            continue
        
        try:
            # Importar produto
            new_product = import_product_from_url(url, cover_url)
            
            if new_product:
                # Verificar se já existe (por título normalizado)
                existing_product, ratio = find_product_by_title(title, imported_products)
                
                if existing_product:
                    # Atualizar produto existente
                    existing_idx = imported_products.index(existing_product)
                    imported_products[existing_idx] = new_product
                    updated_count += 1
                    print(f"  ✓ Produto atualizado")
                else:
                    # Adicionar novo produto
                    imported_products.append(new_product)
                    imported_count += 1
                    print(f"  ✓ Produto importado")
            else:
                print(f"  [X] Falha ao importar produto")
                errors += 1
        except Exception as e:
            error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
            print(f"  [X] Erro: {error_msg[:100]}")
            errors += 1
    
    # Salvar catálogo atualizado
    if imported_count > 0 or updated_count > 0:
        with open(catalog_products_file, 'w', encoding='utf-8') as f:
            json.dump(imported_products, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Catálogo salvo com {len(imported_products)} produtos")
    
    print("\n" + "="*80)
    print("RESUMO DO LOTE")
    print("="*80)
    print(f"✓ Produtos importados: {imported_count}")
    print(f"✓ Produtos atualizados: {updated_count}")
    print(f"✗ Erros: {errors}")
    print(f"✓ Total de produtos no catálogo: {len(imported_products)}")
    print(f"⏳ Produtos ainda faltantes: {len(missing_products) - len(batch)}")
    print("="*80)

if __name__ == "__main__":
    main()
