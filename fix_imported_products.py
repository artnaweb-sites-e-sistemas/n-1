#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir automaticamente problemas nos produtos importados
- Extrai metadados faltantes do HTML
- Busca e baixa imagens internas
- Corrige preços e outros dados
"""

import json
import os
import sys
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_metadata_from_html(html_content):
    """Extrai metadados do HTML"""
    if not html_content:
        return {}
    
    soup = BeautifulSoup(html_content, 'html.parser')
    metadata = {}
    
    # Procurar parágrafo com informações do produto
    paragraphs = soup.find_all('p')
    
    for p in paragraphs:
        text = p.get_text()
        # Verificar se contém os campos que procuramos
        if 'Título:' in text or 'Autor:' in text or 'ISBN:' in text:
            # Extrair cada campo
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        
                        # Mapear chaves
                        if 'Título' in key and 'Original' not in key and not metadata.get('bookTitle'):
                            metadata['bookTitle'] = value
                        elif 'Título Original' in key:
                            metadata['originalTitle'] = value
                        elif 'Autor' in key and 'Autores' not in key and 'Autoras' not in key and not metadata.get('author'):
                            metadata['author'] = value
                        elif 'Autores' in key or 'Autoras' in key:
                            metadata['authors'] = value
                        elif 'Organização' in key or 'Organizador' in key or 'Organizadores' in key:
                            metadata['organization'] = value
                        elif 'Tradução' in key:
                            metadata['translation'] = value
                        elif 'Preparação' in key:
                            metadata['preparation'] = value
                        elif 'Revisão' in key:
                            metadata['revision'] = value
                        elif 'Ano' in key:
                            metadata['year'] = value
                        elif 'páginas' in key or 'Páginas' in key:
                            metadata['pages'] = value
                        elif 'Dimensões' in key:
                            metadata['dimensions'] = value
                        elif 'ISBN' in key:
                            metadata['isbn'] = value
                        elif 'Preço' in key:
                            price_text = value
                            metadata['priceText'] = price_text
                            # Converter para float
                            try:
                                price_clean = price_text.replace('R$', '').replace(' ', '').replace(',', '.').strip()
                                metadata['price'] = float(price_clean)
                            except:
                                pass
    
    return metadata

def remove_metadata_from_html(html_content):
    """Remove parágrafos com metadados do HTML"""
    if not html_content:
        return html_content
    
    soup = BeautifulSoup(html_content, 'html.parser')
    metadata_paragraphs = soup.find_all('p')
    
    for p in metadata_paragraphs:
        text = p.get_text()
        # Verificar se o parágrafo contém múltiplos campos de metadados
        if ('Título:' in text or 'Autor:' in text or 'ISBN:' in text) and \
           ('Ano:' in text or 'Dimensões:' in text or 'Preço:' in text or 'páginas' in text):
            p.decompose()
            break  # Assumir apenas um parágrafo de metadados
    
    return str(soup)

def extract_images_from_html(html_content, base_url=''):
    """Extrai URLs de imagens do HTML"""
    if not html_content:
        return []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    images = []
    
    # Buscar todas as tags img
    for img in soup.find_all('img'):
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if src:
            # Converter para URL absoluta se necessário
            if src.startswith('http'):
                images.append(src)
            elif base_url:
                images.append(urljoin(base_url, src))
            elif src.startswith('/'):
                images.append(f"https://n-1edicoes.org{src}")
            else:
                images.append(src)
    
    return images

def download_file(url, folder, filename=None):
    """Baixa um arquivo e salva na pasta especificada"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, stream=True, timeout=30, headers=headers)
        response.raise_for_status()
        
        if filename is None:
            filename = os.path.basename(urlparse(url).path)
            if not filename or '.' not in filename:
                ext = 'jpg' if 'image' in response.headers.get('Content-Type', '') else 'png'
                filename = f"catalog_{hash(url) % 10000}.{ext}"
        
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return filepath
    except Exception as e:
        return None

def fix_product(product, idx, total):
    """Corrige um produto individual"""
    title = product.get('title', '')
    print(f"\n[{idx}/{total}] {title[:70]}")
    
    updated = False
    fixes_applied = []
    
    # 1. Extrair metadados do HTML se faltarem
    catalog_content = product.get('catalogContent', '')
    if catalog_content:
        metadata = extract_metadata_from_html(catalog_content)
        
        # Preencher bookTitle se faltar
        if not product.get('bookTitle') and metadata.get('bookTitle'):
            product['bookTitle'] = metadata['bookTitle']
            updated = True
            fixes_applied.append("bookTitle extraído do HTML")
        
        # Preencher authors se faltar
        if not product.get('authors') and metadata.get('authors'):
            product['authors'] = metadata['authors']
            updated = True
            fixes_applied.append("authors extraído do HTML")
        elif not product.get('authors') and metadata.get('author'):
            product['authors'] = metadata['author']
            updated = True
            fixes_applied.append("author extraído do HTML")
        
        # Preencher outros metadados
        for field in ['originalTitle', 'organization', 'translation', 'preparation', 'revision', 'year', 'pages', 'dimensions', 'isbn']:
            if not product.get(field) and metadata.get(field):
                product[field] = metadata[field]
                updated = True
                fixes_applied.append(f"{field} extraído do HTML")
        
        # Corrigir preço se faltar
        if (not product.get('price') or product.get('price') == 0) and metadata.get('price'):
            product['price'] = metadata['price']
            product['originalPrice'] = metadata['price']
            updated = True
            fixes_applied.append("preço extraído do HTML")
        
        if metadata.get('priceText') and not product.get('priceText'):
            product['priceText'] = metadata['priceText']
            updated = True
            fixes_applied.append("priceText extraído do HTML")
        
        # Remover metadados duplicados do HTML
        if metadata:
            cleaned_content = remove_metadata_from_html(catalog_content)
            if cleaned_content != catalog_content:
                product['catalogContent'] = cleaned_content
                updated = True
                fixes_applied.append("metadados removidos do HTML")
    
    # 2. Extrair e baixar imagens internas se faltarem
    catalog_images = product.get('catalogImages', [])
    if not catalog_images and catalog_content:
        # Extrair imagens do HTML
        product_url = product.get('permalink', '') or product.get('slug', '')
        if product_url:
            base_url = f"https://n-1edicoes.org{product_url}" if product_url.startswith('/') else product_url
        else:
            base_url = ''
        
        image_urls = extract_images_from_html(catalog_content, base_url)
        
        if image_urls:
            sku = product.get('sku', 'product')
            images_dir = "front-end/public/images"
            downloaded_images = []
            
            for idx_img, img_url in enumerate(image_urls[:10]):  # Limitar a 10 imagens
                if img_url and not img_url.startswith('/images/'):
                    # Gerar nome do arquivo
                    img_filename = f"catalog_{sku}_{idx_img}_{os.path.basename(urlparse(img_url).path).split('?')[0]}"
                    if not img_filename.endswith(('.jpg', '.jpeg', '.png', '.webp')):
                        img_filename += '.jpg'
                    
                    downloaded = download_file(img_url, images_dir, img_filename)
                    if downloaded:
                        downloaded_images.append(f"/images/{img_filename}")
            
            if downloaded_images:
                product['catalogImages'] = downloaded_images
                # Também adicionar ao array images se não estiver lá
                if product.get('images'):
                    for img in downloaded_images:
                        if img not in product['images']:
                            product['images'].append(img)
                updated = True
                fixes_applied.append(f"{len(downloaded_images)} imagem(ns) interna(s) baixada(s)")
    
    # 3. Garantir que bookTitle seja o título se não estiver definido
    if not product.get('bookTitle') and title:
        product['bookTitle'] = title
        updated = True
        fixes_applied.append("bookTitle definido como título")
    
    # 4. Garantir que authors tenha valor se author existir
    if not product.get('authors') and product.get('author'):
        product['authors'] = product['author']
        updated = True
        fixes_applied.append("authors definido como author")
    
    # 5. Verificar e corrigir SKU se muito curto
    sku = product.get('sku', '')
    if sku and len(sku) < 10:
        # Tentar extrair do ISBN
        isbn = product.get('isbn', '')
        if isbn:
            sku_clean = re.sub(r'[^\d]', '', isbn)
            if len(sku_clean) >= 10:
                product['sku'] = sku_clean
                updated = True
                fixes_applied.append("SKU corrigido do ISBN")
    
    # Exibir correções aplicadas
    if fixes_applied:
        print("  ✓ Correções aplicadas:")
        for fix in fixes_applied:
            print(f"    - {fix}")
    elif updated:
        print("  ✓ Produto atualizado")
    else:
        print("  → Nenhuma correção necessária")
    
    return updated

def main():
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    print("="*80)
    print("CORREÇÃO AUTOMÁTICA DE PRODUTOS IMPORTADOS")
    print("="*80)
    
    # Carregar produtos importados
    print("\nCarregando produtos importados...")
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Total de produtos para corrigir: {len(products)}")
    print("="*80)
    
    # Corrigir cada produto
    updated_count = 0
    total_fixes = 0
    
    for idx, product in enumerate(products, 1):
        if fix_product(product, idx, len(products)):
            updated_count += 1
    
    # Salvar produtos corrigidos
    if updated_count > 0:
        print(f"\n{'='*80}")
        print(f"Salvando {updated_count} produto(s) corrigido(s)...")
        with open(catalog_products_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        print("✓ Produtos salvos!")
    else:
        print(f"\n{'='*80}")
        print("Nenhuma correção foi necessária.")
    
    # Resumo
    print("\n" + "="*80)
    print("RESUMO")
    print("="*80)
    print(f"✓ Produtos processados: {len(products)}")
    print(f"✓ Produtos atualizados: {updated_count}")
    print("="*80)

if __name__ == "__main__":
    main()

