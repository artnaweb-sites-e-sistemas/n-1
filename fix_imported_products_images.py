#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir imagens dos produtos já importados
Baixa as imagens MINI do catálogo e atualiza o JSON
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

def get_product_image_from_catalog(catalog_url, product_title, product_slug):
    """Busca a imagem MINI do produto no catálogo"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(catalog_url, timeout=10, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Normalizar título para busca (remover caracteres especiais)
            search_title = product_title.lower()
            search_title = re.sub(r'[^\w\s]', '', search_title)
            search_words = search_title.split()[:5]  # Primeiras 5 palavras
            
            # Procurar por h4 com o título do produto
            if product_title:
                # Tentar diferentes variações do título
                h4_elem = None
                for h4 in soup.find_all('h4'):
                    h4_text = h4.get_text(strip=True).lower()
                    # Verificar se contém palavras-chave do título
                    if any(word in h4_text for word in search_words if len(word) > 3):
                        h4_elem = h4
                        break
                
                if h4_elem:
                    # Procurar imagem próxima ao h4
                    parent = h4_elem.find_parent('a')
                    if not parent:
                        parent = h4_elem.find_parent()
                    if parent:
                        img = parent.find('img')
                        if img:
                            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                            if src:
                                return urljoin(catalog_url, src)
            
            # Fallback: procurar link que contenha o slug
            if product_slug:
                product_link = soup.find('a', href=re.compile(product_slug, re.I))
                if product_link:
                    img = product_link.find('img')
                    if not img:
                        parent = product_link.find_parent()
                        if parent:
                            img = parent.find('img')
                    if img:
                        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                        if src:
                            return urljoin(catalog_url, src)
            
            # Último fallback: procurar qualquer link que contenha palavras do título
            if search_words:
                for link in soup.find_all('a', href=re.compile(r'/publicacoes/', re.I)):
                    link_text = link.get_text(strip=True).lower()
                    if any(word in link_text for word in search_words if len(word) > 3):
                        img = link.find('img')
                        if not img:
                            parent = link.find_parent()
                            if parent:
                                img = parent.find('img')
                        if img:
                            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                            if src:
                                return urljoin(catalog_url, src)
    except Exception as e:
        print(f"    [X] Erro ao buscar imagem: {str(e)[:50]}")
    return None

def fix_product_images():
    """Corrige as imagens dos produtos já importados"""
    catalog_file = 'front-end/src/data/catalog-products.json'
    catalog_url = 'https://n-1edicoes.org/catalogo/'
    images_dir = 'front-end/public/images'
    
    # Carregar catálogo
    if not os.path.exists(catalog_file):
        print(f"Arquivo {catalog_file} nao encontrado!")
        return
    
    with open(catalog_file, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"Total de produtos no catalogo: {len(catalog)}")
    print(f"Corrigindo imagens...\n")
    
    fixed = 0
    skipped = 0
    errors = 0
    
    for i, product in enumerate(catalog, 1):
        title = product.get('title', '')
        slug = product.get('slug', '')
        sku = product.get('sku', 'product')
        current_image = product.get('image', '')
        
        # Verificar se a imagem já existe localmente
        if current_image and current_image.startswith('/images/'):
            image_filename = os.path.basename(current_image)
            image_path = os.path.join(images_dir, image_filename)
            if os.path.exists(image_path):
                print(f"[{i}/{len(catalog)}] {title[:50]}... - Imagem ja existe")
                skipped += 1
                continue
        
        print(f"[{i}/{len(catalog)}] {title[:50]}...")
        
        # Buscar imagem no catálogo
        cover_image_url = get_product_image_from_catalog(catalog_url, title, slug)
        
        if not cover_image_url:
            print(f"  [!] Imagem nao encontrada no catalogo")
            errors += 1
            continue
        
        print(f"  [*] Imagem encontrada: {cover_image_url[:60]}...")
        
        # Baixar imagem
        cover_filename = f"cover_{sku}.jpg"
        cover_image_local = download_file(cover_image_url, images_dir, cover_filename)
        
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
        
        print(f"  [+] Imagem baixada e atualizada: {cover_filename}")
        fixed += 1
    
    # Salvar catálogo atualizado
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Correcao concluida!")
    print(f"  [+] Corrigidos: {fixed}")
    print(f"  [>] Pulados (ja existem): {skipped}")
    print(f"  [X] Erros: {errors}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    fix_product_images()

