#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Corrige os 2 produtos restantes com busca mais flexível"""

import json
import requests
import os
import re
import sys
from urllib.parse import urlparse

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def normalize_title(title):
    """Normaliza título para comparação"""
    if not title:
        return ""
    title = title.lower().strip()
    title = re.sub(r'[^\w\s]', '', title)
    title = re.sub(r'\s+', ' ', title)
    return title

def get_keywords(title):
    """Extrai palavras-chave principais do título"""
    if not title:
        return []
    normalized = normalize_title(title)
    # Remove palavras comuns
    stop_words = ['de', 'da', 'do', 'das', 'dos', 'em', 'e', 'a', 'o', 'as', 'os', 'um', 'uma', 'com', 'por', 'para']
    words = [w for w in normalized.split() if len(w) > 3 and w not in stop_words]
    return words[:5]  # Primeiras 5 palavras significativas

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

# Carregar mapeamento
with open('catalog_images_mapping.json', 'r', encoding='utf-8') as f:
    image_mapping = json.load(f)

# Carregar produtos
catalog_path = 'front-end/src/data/catalog-products.json'
with open(catalog_path, 'r', encoding='utf-8') as f:
    products = json.load(f)

# Produtos que precisam correção
products_to_fix = [
    {
        'title_in_catalog': 'Sonhos em série: arquitetura e pré-fabricação nas margens do',
        'title_in_mapping': 'Sonhos em série',
        'sku': None  # Vamos encontrar pelo título
    },
    {
        'title_in_catalog': 'Os involuntários da pátria: ensaios de antropologia II',
        'title_in_mapping': 'Os involuntários da pátria',
        'sku': None
    }
]

print("Corrigindo produtos restantes...\n")

for fix_info in products_to_fix:
    # Encontrar produto no catálogo
    product = None
    for p in products:
        if fix_info['title_in_catalog'] in p.get('title', ''):
            product = p
            break
    
    if not product:
        print(f"⚠ Produto não encontrado: {fix_info['title_in_catalog']}")
        continue
    
    # Encontrar no mapeamento
    mapping_item = None
    for item in image_mapping:
        if normalize_title(item['title']) == normalize_title(fix_info['title_in_mapping']):
            mapping_item = item
            break
    
    if not mapping_item:
        print(f"⚠ Mapeamento não encontrado: {fix_info['title_in_mapping']}")
        continue
    
    correct_image_url = mapping_item['cover_image']
    title = product.get('title', '')
    sku = product.get('sku', '')
    
    print(f"Produto: {title[:60]}")
    print(f"  URL atual: {product.get('image', 'N/A')[:80]}")
    print(f"  URL correta: {correct_image_url[:80]}")
    
    # Extrair nome do arquivo
    parsed_url = urlparse(correct_image_url)
    filename = os.path.basename(parsed_url.path)
    
    # Gerar nome local
    if sku:
        ext = os.path.splitext(filename)[1] or '.png'
        local_filename = f"cover_{sku}{ext}"
    else:
        local_filename = filename
    
    local_path = f"front-end/public/images/{local_filename}"
    local_url = f"/images/{local_filename}"
    
    # Baixar imagem
    print(f"  Baixando para: {local_path}")
    if download_image(correct_image_url, local_path):
        print(f"  ✓ Imagem baixada com sucesso")
        
        # Atualizar produto
        product['image'] = local_url
        if 'images' in product and len(product['images']) > 0:
            product['images'][0] = local_url
        else:
            product['images'] = [local_url]
    else:
        print(f"  ✗ Falha ao baixar imagem")
    print()

# Salvar produtos atualizados
print("Salvando produtos atualizados...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
print(f"✓ Arquivo {catalog_path} atualizado!")


