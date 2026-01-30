#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Baixa TODAS as imagens dos produtos (capas, catalogImages e imagens do catalogContent HTML)"""

import json
import requests
import os
import re
import sys
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
from pathlib import Path

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def download_image(url, local_path):
    """Baixa imagem da URL e salva localmente"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, timeout=30, headers=headers)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with open(local_path, 'wb') as f:
            f.write(response.content)
        return True
    except Exception as e:
        print(f"  ERRO ao baixar {url}: {e}")
        return False

def extract_images_from_html(html_content):
    """Extrai todas as URLs de imagens do HTML"""
    if not html_content:
        return []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    images = []
    
    for img in soup.find_all('img'):
        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
        if src and (src.startswith('http') or src.startswith('//')):
            # Converter URLs relativas para absolutas se necessário
            if src.startswith('//'):
                src = 'https:' + src
            images.append(src)
    
    return images

def get_local_image_path(url, sku, image_type='internal', index=0):
    """Gera caminho local para a imagem"""
    parsed_url = urlparse(url)
    filename = os.path.basename(parsed_url.path)
    
    # Remover query strings e fragmentos
    filename = filename.split('?')[0].split('#')[0]
    
    # Se não tiver extensão, tentar detectar pelo Content-Type ou usar .jpg
    if '.' not in filename:
        filename += '.jpg'
    
    # Gerar nome único baseado no SKU e tipo
    if image_type == 'cover':
        local_filename = f"cover_{sku}{os.path.splitext(filename)[1]}"
    elif image_type == 'catalog':
        # Usar nome original mas com prefixo do SKU
        name_part = os.path.splitext(filename)[0]
        ext = os.path.splitext(filename)[1]
        local_filename = f"catalog_{sku}_{index}_{name_part}{ext}"
    else:  # internal
        name_part = os.path.splitext(filename)[0]
        ext = os.path.splitext(filename)[1]
        local_filename = f"internal_{sku}_{index}_{name_part}{ext}"
    
    return f"front-end/public/images/{local_filename}", f"/images/{local_filename}"

def replace_urls_in_html(html_content, url_mapping):
    """Substitui URLs externas por locais no HTML"""
    if not html_content:
        return html_content
    
    result = html_content
    
    # Criar mapeamento reverso: URL base -> URL local
    # Isso ajuda a substituir variações de tamanho (ex: image-300x169.png -> /images/image.png)
    base_url_mapping = {}
    for external_url, local_url in url_mapping.items():
        # Extrair URL base (sem tamanhos)
        base_external = re.sub(r'-\d+x\d+\.', '.', external_url)
        base_external = re.sub(r'-\d+w\.', '.', base_external)
        base_external = re.sub(r'-scaled\.', '.', base_external)
        if base_external not in base_url_mapping:
            base_url_mapping[base_external] = local_url
    
    # Substituir todas as URLs (incluindo variações)
    for external_url, local_url in url_mapping.items():
        # Substituir URL exata
        result = result.replace(external_url, local_url)
        
        # Substituir variações de tamanho (ex: image-300x169.png -> /images/image.png)
        base_external = re.sub(r'-\d+x\d+\.', '.', external_url)
        base_external = re.sub(r'-\d+w\.', '.', base_external)
        base_external = re.sub(r'-scaled\.', '.', base_external)
        if base_external in base_url_mapping:
            # Substituir todas as variações desta imagem
            pattern = re.escape(base_external).replace(r'\.', r'[.-]')
            pattern = pattern.replace(r'/', r'[/]')
            # Procurar por variações como image-300x169.png, image-1024x576.png, etc.
            variations = re.findall(rf'{pattern}[^\s"\'<>]+', result)
            for variation in variations:
                result = result.replace(variation, local_url)
    
    # Substituir também URLs base que não foram mapeadas diretamente
    for base_external, local_url in base_url_mapping.items():
        if base_external != local_url:
            # Substituir URL base e suas variações
            pattern = re.escape(base_external)
            result = re.sub(rf'{pattern}(-\d+x\d+)?(-\d+w)?(-scaled)?(\.\w+)?', local_url, result)
    
    return result

# Carregar produtos
print("Carregando produtos do catálogo...")
catalog_path = 'front-end/src/data/catalog-products.json'
with open(catalog_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total de produtos: {len(products)}\n")
print("="*100)

total_downloaded = 0
total_updated = 0

for product_idx, product in enumerate(products, 1):
    title = product.get('title', '')[:50]
    sku = product.get('sku', '')
    
    if not sku:
        print(f"\n[{product_idx}] {title}")
        print(f"  ⚠ SKU não encontrado, pulando...")
        continue
    
    print(f"\n[{product_idx}] {title}")
    print(f"  SKU: {sku}")
    
    url_mapping = {}  # Mapeia URL externa -> URL local
    downloaded_count = 0
    
    # 1. Baixar imagem de capa (se ainda for externa)
    cover_image = product.get('image', '')
    if cover_image and cover_image.startswith('http'):
        local_path, local_url = get_local_image_path(cover_image, sku, 'cover')
        print(f"  [Capa] Baixando: {os.path.basename(local_path)}")
        if download_image(cover_image, local_path):
            url_mapping[cover_image] = local_url
            product['image'] = local_url
            downloaded_count += 1
    
    # 2. Baixar imagens do array images (se ainda forem externas)
    images_array = product.get('images', [])
    for idx, img_url in enumerate(images_array):
        if img_url and img_url.startswith('http'):
            local_path, local_url = get_local_image_path(img_url, sku, 'internal', idx)
            print(f"  [Images[{idx}]] Baixando: {os.path.basename(local_path)}")
            if download_image(img_url, local_path):
                url_mapping[img_url] = local_url
                images_array[idx] = local_url
                downloaded_count += 1
    product['images'] = images_array
    
    # 3. Baixar imagens do catalogImages (se ainda forem externas)
    catalog_images = product.get('catalogImages', [])
    for idx, img_url in enumerate(catalog_images):
        if img_url and img_url.startswith('http'):
            local_path, local_url = get_local_image_path(img_url, sku, 'catalog', idx)
            print(f"  [CatalogImages[{idx}]] Baixando: {os.path.basename(local_path)}")
            if download_image(img_url, local_path):
                url_mapping[img_url] = local_url
                catalog_images[idx] = local_url
                downloaded_count += 1
    product['catalogImages'] = catalog_images
    
    # 4. Extrair e baixar imagens do catalogContent HTML
    catalog_content = product.get('catalogContent', '')
    if catalog_content:
        html_images = extract_images_from_html(catalog_content)
        for idx, img_url in enumerate(html_images):
            # Evitar duplicatas (já baixadas)
            if img_url not in url_mapping:
                local_path, local_url = get_local_image_path(img_url, sku, 'internal', len(images_array) + idx)
                print(f"  [HTML[{idx}]] Baixando: {os.path.basename(local_path)}")
                if download_image(img_url, local_path):
                    url_mapping[img_url] = local_url
                    downloaded_count += 1
        
        # Substituir URLs no HTML
        if url_mapping:
            product['catalogContent'] = replace_urls_in_html(catalog_content, url_mapping)
    
    if downloaded_count > 0:
        total_downloaded += downloaded_count
        total_updated += 1
        print(f"  ✓ {downloaded_count} imagem(ns) baixada(s) e atualizada(s)")
    else:
        print(f"  ✓ Nenhuma imagem externa encontrada (já local)")

print(f"\n{'='*100}")
print(f"Resumo:")
print(f"  Produtos processados: {len(products)}")
print(f"  Produtos atualizados: {total_updated}")
print(f"  Total de imagens baixadas: {total_downloaded}")
print(f"{'='*100}\n")

# Salvar produtos atualizados
if total_updated > 0:
    print("Salvando produtos atualizados...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"✓ Arquivo {catalog_path} atualizado com sucesso!")
    print(f"\n✓ Todas as imagens foram baixadas e estão em: front-end/public/images/")
    print(f"✓ Todas as URLs foram substituídas por caminhos locais (/images/...)")
else:
    print("Nenhuma atualização necessária - todas as imagens já estão locais.")

