#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para revisar produtos importados e importar os faltantes na ordem correta
"""

import json
import os
import sys
import re
from difflib import SequenceMatcher
from extract_product_v2 import extract_product_info, extract_metadata_from_html, download_file
from import_all_products import get_product_image_from_catalog, create_slug

if sys.platform == 'win32':
    import io
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
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
        cover_path = os.path.join(images_dir, cover_filename)
        
        if cover_url and not cover_url.startswith('/images/'):
            downloaded = download_file(cover_url, images_dir, cover_filename)
            if downloaded:
                cover_path = f"/images/{cover_filename}"
            else:
                cover_path = f"/images/{cover_filename}"  # Tentar mesmo assim
        
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
            "image": cover_path if cover_path.startswith('/images/') else f"/images/{cover_filename}",
            "images": [cover_path if cover_path.startswith('/images/') else f"/images/{cover_filename}"],
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
            "source": "catalog",
            "bookTitle": metadata.get('bookTitle', ''),
            "originalTitle": metadata.get('originalTitle', ''),
            "authors": metadata.get('authors', product_info.get('author', '')),
            "organization": metadata.get('organization', ''),
            "translation": metadata.get('translation', ''),
            "preparation": metadata.get('preparation', ''),
            "revision": metadata.get('revision', ''),
            "year": metadata.get('year', product_info.get('year', '')),
            "pages": metadata.get('pages', product_info.get('pages', '')),
            "dimensions": metadata.get('dimensions', product_info.get('dimensions', '')),
            "isbn": metadata.get('isbn', product_info.get('isbn', '')),
            "priceText": metadata.get('priceText', '')
        }
        
        print(f"  [OK] Produto importado: {product_info['title'][:50]}")
        return product
        
    except Exception as e:
        error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
        print(f"  [X] Erro ao importar: {error_msg[:100]}")
        return None

def main():
    correct_structure_file = 'catalog_correct_structure.json'
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    catalog_url = 'https://n-1edicoes.org/catalogo/'
    
    # Carregar estrutura correta
    print("Carregando estrutura correta do catálogo...")
    with open(correct_structure_file, 'r', encoding='utf-8') as f:
        correct_structure = json.load(f)
    
    # Carregar produtos já importados
    print("Carregando produtos já importados...")
    if os.path.exists(catalog_products_file):
        with open(catalog_products_file, 'r', encoding='utf-8') as f:
            imported_products = json.load(f)
    else:
        imported_products = []
    
    print(f"\nEstrutura correta: {len(correct_structure)} produtos")
    print(f"Produtos já importados: {len(imported_products)} produtos")
    print(f"Produtos faltantes: {len(correct_structure) - len(imported_products)} produtos\n")
    
    # Criar lista de produtos importados para busca
    imported_by_title = {}
    for product in imported_products:
        title = product.get('title', '')
        if title:
            imported_by_title[normalize_title(title)] = product
    
    # Processar cada produto na ordem correta
    ordered_products = []
    imported_count = 0
    updated_count = 0
    skipped_count = 0
    
    print("="*80)
    print("REVISANDO E IMPORTANDO PRODUTOS")
    print("="*80)
    print()
    
    for idx, correct_item in enumerate(correct_structure, 1):
        correct_title = correct_item['title']
        correct_url = correct_item['url']
        correct_cover = correct_item.get('cover_image')
        
        print(f"[{idx:3d}/{len(correct_structure)}] {correct_title[:60]}")
        
        # Verificar se já está importado
        found_product, ratio = find_product_by_title(correct_title, imported_products)
        
        if found_product and ratio >= 0.7:
            # Produto já importado - verificar se precisa atualizar
            needs_update = False
            
            # Verificar se a capa está correta
            current_image = found_product.get('image', '')
            if correct_cover and not current_image.startswith('/images/'):
                needs_update = True
            elif correct_cover:
                # Verificar se precisa baixar nova capa
                sku = found_product.get('sku', '')
                if sku:
                    expected_cover = f"/images/cover_{sku}.jpg"
                    if current_image != expected_cover:
                        # Baixar capa correta
                        images_dir = "front-end/public/images"
                        cover_filename = f"cover_{sku}.jpg"
                        downloaded = download_file(correct_cover, images_dir, cover_filename)
                        if downloaded:
                            found_product['image'] = expected_cover
                            if found_product.get('images') and len(found_product['images']) > 0:
                                found_product['images'][0] = expected_cover
                            needs_update = True
                            updated_count += 1
                            print(f"      [OK] Capa atualizada")
            
            # Atualizar slug se necessário
            correct_slug = correct_item.get('slug')
            if correct_slug and found_product.get('slug') != correct_slug:
                found_product['slug'] = correct_slug
                found_product['permalink'] = f"/livros/{correct_slug}"
                needs_update = True
            
            if needs_update:
                print(f"      [OK] Produto revisado e atualizado")
            else:
                print(f"      [OK] Produto já está correto")
            
            ordered_products.append(found_product)
            imported_products.remove(found_product)  # Remover da lista para evitar duplicatas
            
        else:
            # Produto não importado - importar agora
            print(f"      Importando...")
            new_product = import_product_from_url(correct_url, correct_cover, catalog_url)
            
            if new_product:
                ordered_products.append(new_product)
                imported_count += 1
            else:
                print(f"      [X] Falha na importação")
                skipped_count += 1
    
    # Adicionar produtos restantes (que não estavam na estrutura correta) ao final
    if imported_products:
        print(f"\nAdicionando {len(imported_products)} produtos restantes ao final...")
        ordered_products.extend(imported_products)
    
    # Salvar catálogo atualizado
    print(f"\nSalvando catálogo atualizado...")
    with open(catalog_products_file, 'w', encoding='utf-8') as f:
        json.dump(ordered_products, f, indent=2, ensure_ascii=False)
    
    print()
    print("="*80)
    print("RESUMO")
    print("="*80)
    print(f"✓ Produtos processados: {len(ordered_products)}")
    print(f"✓ Produtos importados: {imported_count}")
    print(f"✓ Produtos atualizados: {updated_count}")
    print(f"✓ Produtos ignorados: {skipped_count}")
    print("="*80)

if __name__ == "__main__":
    main()

