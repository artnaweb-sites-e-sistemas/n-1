#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir imagens com mapeamento manual das imagens MINI conhecidas
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import os
import sys
from urllib.parse import urljoin

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Mapeamento manual de imagens conhecidas do catálogo
IMAGE_MAPPING = {
    'nas-brechas-de-futuros-cancelados': 'https://n-1edicoes.org/wp-content/uploads/2026/01/site02.png',
    'coletanea-de-dramaturgias-a-marcha-das-mulheradas': 'https://n-1edicoes.org/wp-content/uploads/2026/01/IMG_MINI1.png',
    'ueinzz-territorio-de-transmutacao-poetica-e-politica': 'https://n-1edicoes.org/wp-content/uploads/2025/12/mockupsueinzz3d-scaled.png',
}

def download_file(url, folder, filename=None):
    """Baixa um arquivo e salva na pasta especificada"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, stream=True, timeout=30, headers=headers)
        response.raise_for_status()
        
        if filename is None:
            from urllib.parse import urlparse
            filename = os.path.basename(urlparse(url).path)
            if not filename or '.' not in filename:
                ext = 'jpg' if 'image' in response.headers.get('Content-Type', '') else 'png'
                filename = f"cover_{hash(url) % 10000}.{ext}"
        
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return filepath
    except Exception as e:
        return None

def get_mini_image_from_catalog(catalog_url, product_title, product_slug):
    """Busca a imagem MINI do produto no catálogo principal"""
    # Primeiro, verificar mapeamento manual
    if product_slug in IMAGE_MAPPING:
        return IMAGE_MAPPING[product_slug]
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(catalog_url, timeout=10, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Normalizar título para busca
            search_title = product_title.lower()
            search_title = re.sub(r'[^\w\s]', '', search_title)
            search_words = search_title.split()[:5]
            
            # Procurar por h4 com o título do produto
            h4_elem = None
            for h4 in soup.find_all('h4'):
                h4_text = h4.get_text(strip=True).lower()
                # Verificar se contém palavras-chave do título
                if any(word in h4_text for word in search_words if len(word) > 3):
                    h4_elem = h4
                    break
            
            if h4_elem:
                # Procurar o elemento portfolio item que contém o h4
                portfolio_item = h4_elem.find_parent(class_=re.compile(r'portfolio|eltdf-pli', re.I))
                if not portfolio_item:
                    portfolio_item = h4_elem.find_parent('article')
                if not portfolio_item:
                    portfolio_item = h4_elem.find_parent('div', class_=re.compile(r'item|entry', re.I))
                
                if portfolio_item:
                    # Buscar todas as imagens no portfolio item
                    imgs = portfolio_item.find_all('img')
                    
                    # Priorizar imagens MINI ou site
                    for img in imgs:
                        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                        if src:
                            src_lower = src.lower()
                            if 'mini' in src_lower or 'site' in src_lower:
                                return urljoin(catalog_url, src)
                    
                    # Se não encontrou MINI, pegar a primeira imagem
                    if imgs:
                        src = imgs[0].get('src', '') or imgs[0].get('data-src', '') or imgs[0].get('data-lazy-src', '')
                        if src:
                            return urljoin(catalog_url, src)
    except Exception as e:
        print(f"    [X] Erro ao buscar imagem: {str(e)[:50]}")
    return None

def fix_catalog_images():
    """Corrige as imagens buscando as MINI corretas do catálogo"""
    catalog_file = 'front-end/src/data/catalog-products.json'
    images_dir = 'front-end/public/images'
    catalog_url = 'https://n-1edicoes.org/catalogo/'
    
    # Carregar catálogo
    if not os.path.exists(catalog_file):
        print(f"Arquivo {catalog_file} nao encontrado!")
        return
    
    with open(catalog_file, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"Total de produtos no catalogo: {len(catalog)}")
    print(f"Buscando imagens MINI corretas do catalogo...\n")
    
    fixed = 0
    skipped = 0
    errors = 0
    
    for i, product in enumerate(catalog, 1):
        title = product.get('title', '')
        slug = product.get('slug', '')
        sku = product.get('sku', 'product')
        
        print(f"[{i}/{len(catalog)}] {title[:50]}...")
        
        # Buscar imagem MINI no catálogo
        mini_image_url = get_mini_image_from_catalog(catalog_url, title, slug)
        
        # Se não encontrou no catálogo, tentar buscar do catalogContent (fallback)
        if not mini_image_url:
            catalog_content = product.get('catalogContent', '')
            if catalog_content:
                from bs4 import BeautifulSoup as BS
                content_soup = BS(catalog_content, 'html.parser')
                imgs = content_soup.find_all('img')
                
                # Priorizar mockup
                for img in imgs:
                    src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                    if src and 'mockup' in src.lower():
                        mini_image_url = src if src.startswith('http') else urljoin('https://n-1edicoes.org', src)
                        print(f"  [*] Imagem mockup encontrada no catalogContent")
                        break
                
                # Se não encontrou mockup, pegar primeira imagem grande (geralmente a capa)
                if not mini_image_url and imgs:
                    for img in imgs:
                        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                        if src:
                            # Filtrar logos e ícones
                            if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                                continue
                            # Verificar se é imagem grande (típica de capa)
                            width = img.get('width')
                            height = img.get('height')
                            if width and height:
                                w, h = int(width), int(height)
                                if w > 300 and h > 400:  # Tamanho típico de capa
                                    mini_image_url = src if src.startswith('http') else urljoin('https://n-1edicoes.org', src)
                                    print(f"  [*] Imagem grande encontrada no catalogContent")
                                    break
                    
                    # Último fallback: primeira imagem válida
                    if not mini_image_url:
                        for img in imgs:
                            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                            if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                                mini_image_url = src if src.startswith('http') else urljoin('https://n-1edicoes.org', src)
                                print(f"  [*] Primeira imagem encontrada no catalogContent")
                                break
        
        if not mini_image_url:
            print(f"  [!] Imagem MINI nao encontrada")
            errors += 1
            continue
        
        print(f"  [*] Imagem MINI encontrada: {mini_image_url[:60]}...")
        
        # Baixar imagem
        cover_filename = f"cover_{sku}.jpg"
        cover_image_local = download_file(mini_image_url, images_dir, cover_filename)
        
        if not cover_image_local:
            print(f"  [X] Falha ao baixar imagem")
            errors += 1
            continue
        
        # Atualizar produto
        image_path = f"/images/{cover_filename}"
        product['image'] = image_path
        if product.get('images'):
            product['images'][0] = image_path
        else:
            product['images'] = [image_path]
        
        print(f"  [+] Imagem MINI baixada e atualizada: {cover_filename}")
        fixed += 1
    
    # Salvar catálogo atualizado
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Correcao concluida!")
    print(f"  [+] Corrigidos: {fixed}")
    print(f"  [>] Pulados: {skipped}")
    print(f"  [X] Erros: {errors}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    fix_catalog_images()

