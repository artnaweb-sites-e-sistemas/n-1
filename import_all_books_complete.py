#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar TODOS os livros do catálogo N-1 Edições na ordem correta.
Extrai dados, baixa imagens e cria o catalog-products.json completo.
"""

import json
import os
import re
import requests
import sys
import time
from urllib.parse import urljoin, urlparse, unquote
from bs4 import BeautifulSoup

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Diretórios
IMAGES_DIR = 'front-end/public/images'
DATA_FILE = 'front-end/src/data/catalog-products.json'
STRUCTURE_FILE = 'catalog_correct_structure.json'

# Headers para requests
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def ensure_dir(directory):
    """Garantir que o diretório existe"""
    if not os.path.exists(directory):
        os.makedirs(directory)

def download_image(url, local_path, max_retries=3):
    """Baixar imagem da URL para o caminho local"""
    if os.path.exists(local_path):
        return True
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                return True
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(1)
            else:
                print(f"    ERRO ao baixar {url}: {e}")
    return False

def generate_slug(title):
    """Gerar slug a partir do título"""
    if not title:
        return ''
    
    slug = title.lower()
    # Remover caracteres especiais como subscrito
    slug = slug.replace('₂', '2')
    # Normalizar acentos
    import unicodedata
    slug = unicodedata.normalize('NFD', slug)
    slug = ''.join(c for c in slug if unicodedata.category(c) != 'Mn')
    # Remover caracteres especiais
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    # Substituir espaços por hífens
    slug = re.sub(r'[\s-]+', '-', slug)
    # Remover hífens no início e fim
    slug = slug.strip('-')
    
    return slug

def extract_metadata_from_html(html_content):
    """Extrair metadados do HTML do produto"""
    metadata = {}
    
    # Padrões para extrair metadados
    patterns = {
        'bookTitle': r'<strong>Título[:\s]*</strong>\s*([^<]+)',
        'authors': r'<strong>Autor(?:es)?[:\s]*</strong>\s*([^<]+)',
        'year': r'<strong>Ano[:\s]*</strong>\s*(\d{4})',
        'pages': r'<strong>N[º°]\s*de\s*páginas[:\s]*</strong>\s*(\d+)',
        'dimensions': r'<strong>Dimensões[:\s]*</strong>\s*([^<]+)',
        'isbn': r'<strong>ISBN[:\s]*</strong>\s*([\d\-]+)',
        'priceText': r'<strong>Preço[:\s]*</strong>\s*([^<]+)',
        'preparation': r'<strong>Preparação[:\s]*</strong>\s*([^<]+)',
        'revision': r'<strong>Revisão[:\s]*</strong>\s*([^<]+)',
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, html_content, re.IGNORECASE)
        if match:
            value = match.group(1).strip()
            # Limpar HTML entities
            value = value.replace('&nbsp;', ' ').strip()
            metadata[key] = value
    
    return metadata

def extract_price(html_content):
    """Extrair preço do conteúdo"""
    # Tentar encontrar preço no formato "R$ XX,XX" ou "R$ XX"
    price_match = re.search(r'R\$\s*([\d,.]+)', html_content)
    if price_match:
        price_str = price_match.group(1)
        # Converter para float
        price_str = price_str.replace('.', '').replace(',', '.')
        try:
            return float(price_str)
        except:
            pass
    return 0

def extract_product_data(url, sku, position):
    """Extrair dados completos de um produto"""
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        if response.status_code != 200:
            print(f"    ERRO: Status {response.status_code}")
            return None
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Título
        title_elem = soup.find('h2', class_='eltdf-st-title')
        if not title_elem:
            title_elem = soup.find('h1', class_='entry-title')
        title = title_elem.get_text(strip=True) if title_elem else ''
        
        # Autor
        author_elem = soup.find('h5', class_='eltdf-st-text')
        author = author_elem.get_text(strip=True) if author_elem else ''
        
        # Descrição
        desc_elem = soup.find('div', class_='wpb_text_column')
        description = ''
        if desc_elem:
            p_elem = desc_elem.find('p')
            if p_elem:
                description = p_elem.get_text(strip=True)
        
        # Conteúdo do catálogo (HTML completo)
        content_div = soup.find('div', class_='eltdf-content')
        catalog_content = str(content_div) if content_div else ''
        
        # Extrair metadados do HTML
        metadata = extract_metadata_from_html(response.text)
        
        # Preço
        price = extract_price(response.text)
        if not price and metadata.get('priceText'):
            price = extract_price(metadata['priceText'])
        
        # Imagens do catálogo
        catalog_images = []
        for img in soup.find_all('img', class_='vc_single_image-img'):
            src = img.get('src', '')
            if src and 'n-1edicoes.org' in src:
                catalog_images.append(src)
        
        # PDF (Issuu)
        pdf_url = ''
        issuu_iframe = soup.find('iframe', src=lambda x: x and 'issuu.com' in x)
        if issuu_iframe:
            pdf_url = issuu_iframe.get('src', '')
        
        return {
            'title': title,
            'author': author,
            'description': description,
            'catalog_content': catalog_content,
            'catalog_images': catalog_images,
            'pdf_url': pdf_url,
            'price': price,
            'metadata': metadata
        }
        
    except Exception as e:
        print(f"    ERRO ao extrair dados: {e}")
        return None

def process_catalog_images(catalog_images, sku, catalog_content):
    """Processar e baixar imagens do catálogo, atualizar referências no HTML"""
    local_images = []
    updated_content = catalog_content
    
    for i, img_url in enumerate(catalog_images):
        if not img_url:
            continue
        
        # Extrair nome do arquivo
        parsed = urlparse(img_url)
        filename = os.path.basename(parsed.path)
        
        # Criar nome local
        local_filename = f"catalog_{sku}_{i}_{filename}"
        local_path = os.path.join(IMAGES_DIR, local_filename)
        
        # Baixar imagem
        if download_image(img_url, local_path):
            local_ref = f"/images/{local_filename}"
            local_images.append(local_ref)
            
            # Atualizar referência no HTML
            if img_url in updated_content:
                updated_content = updated_content.replace(img_url, local_ref)
    
    # Remover srcset do HTML
    updated_content = re.sub(r'\s*srcset="[^"]*"', '', updated_content)
    
    return local_images, updated_content

def create_product_entry(data, structure_item, position):
    """Criar entrada de produto para o JSON"""
    title = data.get('title') or structure_item.get('title', '')
    slug = structure_item.get('slug', generate_slug(title))
    sku = data.get('sku', f"SKU{position:05d}")
    
    # Se não temos SKU, tentar extrair do ISBN
    if data.get('metadata', {}).get('isbn'):
        isbn = data['metadata']['isbn'].replace('-', '')
        if len(isbn) >= 10:
            sku = isbn
    
    product = {
        '_id': f"catalog-{slug}",
        'id': f"catalog-{slug}",
        'title': title,
        'description': data.get('description', ''),
        'shortDescription': data.get('description', '')[:150] + '...' if len(data.get('description', '')) > 150 else data.get('description', ''),
        'image': data.get('cover_image', ''),
        'images': data.get('images', []),
        'price': data.get('price', 0),
        'originalPrice': data.get('price', 0),
        'discount': 0,
        'sku': sku,
        'stock': None,
        'inStock': True,
        'tags': [data.get('author', '')] if data.get('author') else [],
        'categories': ['Livros'],
        'itemInfo': 'latest-product',
        'rating': {'average': 0, 'count': 0},
        'permalink': f"/livros/{slug}",
        'slug': slug,
        'catalogContent': data.get('catalog_content', ''),
        'catalogImages': data.get('catalog_images', []),
        'catalogPdf': data.get('pdf_url', ''),
        'source': 'catalog',
    }
    
    # Adicionar metadados
    metadata = data.get('metadata', {})
    if metadata.get('bookTitle'):
        product['bookTitle'] = metadata['bookTitle']
    if metadata.get('authors'):
        product['authors'] = metadata['authors']
    if metadata.get('year'):
        product['year'] = metadata['year']
    if metadata.get('pages'):
        product['pages'] = metadata['pages']
    if metadata.get('dimensions'):
        product['dimensions'] = metadata['dimensions']
    if metadata.get('isbn'):
        product['isbn'] = metadata['isbn']
    if metadata.get('priceText'):
        product['priceText'] = metadata['priceText']
    if metadata.get('preparation'):
        product['preparation'] = metadata['preparation']
    if metadata.get('revision'):
        product['revision'] = metadata['revision']
    
    return product

def main():
    print("=" * 60)
    print("IMPORTAÇÃO COMPLETA DO CATÁLOGO N-1 EDIÇÕES")
    print("=" * 60)
    
    # Garantir diretório de imagens
    ensure_dir(IMAGES_DIR)
    
    # Carregar estrutura correta
    print("\n[1] Carregando estrutura do catálogo...")
    with open(STRUCTURE_FILE, 'r', encoding='utf-8') as f:
        structure = json.load(f)
    
    print(f"    Total de produtos: {len(structure)}")
    
    # Carregar produtos existentes para não reprocessar
    existing_products = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            existing = json.load(f)
            for p in existing:
                existing_products[p.get('slug', '')] = p
    
    print(f"    Produtos já existentes: {len(existing_products)}")
    
    # Processar todos os produtos
    all_products = []
    errors = []
    
    print("\n[2] Processando produtos...")
    
    for i, item in enumerate(structure):
        position = item.get('position', i + 1)
        title = item.get('title', '')
        url = item.get('url', '')
        cover_url = item.get('cover_image', '')
        slug = item.get('slug', generate_slug(title))
        
        print(f"\n[{position}/{len(structure)}] {title[:50]}...")
        
        # Verificar se já existe
        if slug in existing_products:
            print("    -> Já existe, mantendo dados")
            existing = existing_products[slug]
            # Atualizar posição se necessário
            all_products.append(existing)
            continue
        
        # Gerar SKU baseado na posição
        sku = f"N1-{position:05d}"
        
        # Extrair dados do produto
        data = extract_product_data(url, sku, position)
        
        if not data:
            print("    -> ERRO: não foi possível extrair dados")
            # Criar entrada mínima
            product = {
                '_id': f"catalog-{slug}",
                'id': f"catalog-{slug}",
                'title': title,
                'description': '',
                'shortDescription': '',
                'image': '',
                'images': [],
                'price': 0,
                'originalPrice': 0,
                'discount': 0,
                'sku': sku,
                'stock': None,
                'inStock': True,
                'tags': [],
                'categories': ['Livros'],
                'itemInfo': 'latest-product',
                'rating': {'average': 0, 'count': 0},
                'permalink': f"/livros/{slug}",
                'slug': slug,
                'catalogContent': '',
                'catalogImages': [],
                'catalogPdf': '',
                'source': 'catalog',
            }
            errors.append({'position': position, 'title': title, 'url': url})
        else:
            # Baixar capa principal
            cover_local = ''
            if cover_url:
                parsed = urlparse(cover_url)
                cover_filename = os.path.basename(parsed.path)
                cover_local_filename = f"cover_{sku}.{cover_filename.split('.')[-1]}"
                cover_local_path = os.path.join(IMAGES_DIR, cover_local_filename)
                
                if download_image(cover_url, cover_local_path):
                    cover_local = f"/images/{cover_local_filename}"
                    print(f"    -> Capa baixada: {cover_local_filename}")
            
            # Processar imagens do catálogo
            catalog_images_local, updated_content = process_catalog_images(
                data.get('catalog_images', []),
                sku,
                data.get('catalog_content', '')
            )
            
            if catalog_images_local:
                print(f"    -> {len(catalog_images_local)} imagens do catálogo baixadas")
            
            # Atualizar dados
            data['cover_image'] = cover_local
            data['images'] = [cover_local] + catalog_images_local if cover_local else catalog_images_local
            data['catalog_images'] = catalog_images_local
            data['catalog_content'] = updated_content
            data['sku'] = sku
            
            # Criar entrada do produto
            product = create_product_entry(data, item, position)
        
        all_products.append(product)
        
        # Salvar progresso a cada 10 produtos
        if (i + 1) % 10 == 0:
            print(f"\n    [Salvando progresso: {i + 1} produtos processados]")
            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(all_products, f, ensure_ascii=False, indent=2)
        
        # Pequena pausa para não sobrecarregar o servidor
        time.sleep(0.5)
    
    # Salvar resultado final
    print("\n[3] Salvando resultado final...")
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_products, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print("IMPORTAÇÃO CONCLUÍDA!")
    print(f"{'=' * 60}")
    print(f"Total de produtos: {len(all_products)}")
    print(f"Erros: {len(errors)}")
    
    if errors:
        print("\nProdutos com erro:")
        for err in errors:
            print(f"  - [{err['position']}] {err['title']}")
    
    print(f"\nArquivo salvo em: {DATA_FILE}")

if __name__ == '__main__':
    main()

