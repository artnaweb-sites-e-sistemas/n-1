#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir imagens faltantes extraindo do catalogContent HTML
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

def extract_image_from_html(html_content):
    """Extrai a melhor imagem (priorizando mockup) do HTML do catalogContent"""
    if not html_content:
        return None
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        imgs = soup.find_all('img')
        
        if not imgs:
            return None
        
        # Coletar todas as imagens com prioridade
        candidates = []
        
        for img in imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if not src:
                continue
            
            # Filtrar logos e ícones
            if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                continue
            
            priority = 0
            src_lower = src.lower()
            
            # Máxima prioridade para mockup (imagens 3D/com efeito)
            if 'mockup' in src_lower:
                priority = 100
            # Alta prioridade para capa/frente
            elif any(x in src_lower for x in ['cover', 'capa', 'frente']):
                priority = 50
            # Prioridade média para imagens grandes
            else:
                width = img.get('width')
                height = img.get('height')
                if width and height:
                    w, h = int(width), int(height)
                    if w > 300 and h > 400:
                        priority = 25
            
            if priority > 0:
                candidates.append((priority, src))
        
        # Ordenar por prioridade e retornar a melhor
        if candidates:
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
        
        # Fallback: primeira imagem válida
        for img in imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                return src
    except:
        pass
    
    return None

def fix_missing_images():
    """Corrige as imagens faltantes extraindo do catalogContent"""
    catalog_file = 'front-end/src/data/catalog-products.json'
    images_dir = 'front-end/public/images'
    
    # Carregar catálogo
    if not os.path.exists(catalog_file):
        print(f"Arquivo {catalog_file} nao encontrado!")
        return
    
    with open(catalog_file, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"Total de produtos no catalogo: {len(catalog)}")
    print(f"Corrigindo imagens faltantes...\n")
    
    fixed = 0
    skipped = 0
    errors = 0
    
    for i, product in enumerate(catalog, 1):
        title = product.get('title', '')
        sku = product.get('sku', 'product')
        current_image = product.get('image', '')
        catalog_content = product.get('catalogContent', '')
        
        # Verificar se a imagem já existe localmente
        if current_image and current_image.startswith('/images/'):
            image_filename = os.path.basename(current_image)
            image_path = os.path.join(images_dir, image_filename)
            if os.path.exists(image_path):
                print(f"[{i}/{len(catalog)}] {title[:50]}... - Imagem ja existe")
                skipped += 1
                continue
        
        # Verificar se SKU está incompleto
        if current_image and '/images/cover_978.jpg' in current_image:
            print(f"[{i}/{len(catalog)}] {title[:50]}... - SKU incompleto detectado")
            # Tentar extrair SKU do catalogContent
            isbn_match = re.search(r'ISBN[:\s]+([0-9\-]+)', catalog_content, re.I)
            if isbn_match:
                isbn = isbn_match.group(1).strip()
                sku = isbn.replace('-', '').replace(' ', '')
                product['sku'] = sku
                print(f"  [*] SKU corrigido: {sku}")
        
        print(f"[{i}/{len(catalog)}] {title[:50]}...")
        
        # Tentar extrair imagem do catalogContent
        image_url = extract_image_from_html(catalog_content)
        
        if not image_url:
            print(f"  [!] Imagem nao encontrada no catalogContent")
            errors += 1
            continue
        
        # Garantir URL completa
        if not image_url.startswith('http'):
            image_url = urljoin('https://n-1edicoes.org', image_url)
        
        print(f"  [*] Imagem encontrada no catalogContent: {image_url[:60]}...")
        
        # Baixar imagem
        cover_filename = f"cover_{sku}.jpg"
        cover_image_local = download_file(image_url, images_dir, cover_filename)
        
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
    fix_missing_images()

