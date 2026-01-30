#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Atualiza as imagens do primeiro lote usando o mapeamento correto"""

import json
import requests
import os
import re
import sys
from urllib.parse import urlparse
from pathlib import Path

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def normalize_title(title):
    """Normaliza título para comparação"""
    if not title:
        return ""
    # Remove acentos, espaços extras, converte para minúsculas
    title = title.lower().strip()
    # Remove caracteres especiais
    title = re.sub(r'[^\w\s]', '', title)
    # Remove espaços múltiplos
    title = re.sub(r'\s+', ' ', title)
    return title

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

# Carregar mapeamento de imagens
print("Carregando mapeamento de imagens...")
with open('catalog_images_mapping.json', 'r', encoding='utf-8') as f:
    image_mapping = json.load(f)

# Criar dicionário por título normalizado
mapping_dict = {}
for item in image_mapping:
    normalized = normalize_title(item['title'])
    mapping_dict[normalized] = item['cover_image']

print(f"Total de {len(mapping_dict)} imagens no mapeamento\n")

# Carregar produtos do catálogo
print("Carregando produtos do catálogo...")
catalog_path = 'front-end/src/data/catalog-products.json'
with open(catalog_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

print(f"Total de {len(products)} produtos no catálogo\n")
print("="*100)

updated_count = 0
downloaded_count = 0

for product in products:
    title = product.get('title', '')
    normalized_title = normalize_title(title)
    
    # Buscar imagem no mapeamento
    if normalized_title in mapping_dict:
        correct_image_url = mapping_dict[normalized_title]
        
        print(f"\n[{updated_count + 1}] {title[:60]}")
        print(f"  URL atual: {product.get('image', 'N/A')[:80]}")
        print(f"  URL correta: {correct_image_url[:80]}")
        
        # Extrair nome do arquivo da URL
        parsed_url = urlparse(correct_image_url)
        filename = os.path.basename(parsed_url.path)
        
        # Gerar nome local baseado no SKU ou título
        sku = product.get('sku', '')
        if sku:
            # Usar SKU para nome do arquivo
            ext = os.path.splitext(filename)[1] or '.jpg'
            local_filename = f"cover_{sku}{ext}"
        else:
            # Fallback: usar nome do arquivo original
            local_filename = filename
        
        local_path = f"front-end/public/images/{local_filename}"
        local_url = f"/images/{local_filename}"
        
        # Baixar imagem
        print(f"  Baixando para: {local_path}")
        if download_image(correct_image_url, local_path):
            downloaded_count += 1
            print(f"  ✓ Imagem baixada com sucesso")
            
            # Atualizar produto
            product['image'] = local_url
            if 'images' in product and len(product['images']) > 0:
                product['images'][0] = local_url
            else:
                product['images'] = [local_url]
            
            updated_count += 1
        else:
            print(f"  ✗ Falha ao baixar imagem")
    else:
        print(f"\n[?] {title[:60]}")
        print(f"  ⚠ Não encontrado no mapeamento")

print(f"\n{'='*100}")
print(f"Resumo:")
print(f"  Produtos atualizados: {updated_count}")
print(f"  Imagens baixadas: {downloaded_count}")
print(f"{'='*100}\n")

# Salvar produtos atualizados
if updated_count > 0:
    print("Salvando produtos atualizados...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print(f"✓ Arquivo {catalog_path} atualizado com sucesso!")
else:
    print("Nenhuma atualização necessária.")


