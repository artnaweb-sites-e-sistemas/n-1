#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Substitui URLs externas restantes no HTML (principalmente srcset)"""

import json
import re
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def normalize_image_url(url):
    """Normaliza URL de imagem removendo variações de tamanho"""
    # Remover variações como -300x169, -1024x576, -scaled, etc.
    url = re.sub(r'-\d+x\d+\.', '.', url)
    url = re.sub(r'-\d+w\.', '.', url)
    url = re.sub(r'-scaled\.', '.', url)
    return url

def get_image_base_name(url):
    """Extrai nome base da imagem"""
    # Ex: https://n-1edicoes.org/wp-content/uploads/2026/01/IMG_CATA1.png -> IMG_CATA1.png
    match = re.search(r'/([^/]+\.(png|jpg|jpeg|gif|webp))', url, re.I)
    if match:
        return match.group(1)
    return None

# Carregar produtos
with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("Substituindo URLs externas no HTML...\n")

updated_count = 0

for product in products:
    title = product.get('title', '')[:50]
    sku = product.get('sku', '')
    catalog_content = product.get('catalogContent', '')
    
    if not catalog_content or not sku:
        continue
    
    original_content = catalog_content
    updated_content = catalog_content
    
    # Encontrar todas as URLs de imagens no HTML
    image_urls = re.findall(r'https://[^\s"\'<>]+\.(png|jpg|jpeg|gif|webp)', catalog_content, re.I)
    
    # Criar mapeamento: URL base -> caminho local
    url_mapping = {}
    
    # Verificar imagens já baixadas (catalogImages e images)
    for img_url in product.get('catalogImages', []) + product.get('images', []):
        if img_url.startswith('/images/'):
            # Extrair nome do arquivo
            filename = img_url.split('/')[-1]
            # Tentar encontrar URL original correspondente
            # Ex: catalog_9786561190626_0_IMG_CATA1.png -> IMG_CATA1.png
            base_name = re.sub(r'^(catalog|internal|cover)_\d+_\d+_', '', filename)
            url_mapping[base_name] = img_url
    
    # Substituir todas as URLs externas por locais
    # Padrão: https://n-1edicoes.org/.../NOME_IMAGEM.png -> /images/catalog_SKU_INDEX_NOME_IMAGEM.png
    def replace_url(match):
        full_url = match.group(0)
        base_name = get_image_base_name(full_url)
        if base_name:
            # Procurar imagem local correspondente
            for local_img in product.get('catalogImages', []) + product.get('images', []):
                if local_img.startswith('/images/') and base_name in local_img:
                    return local_img
            # Se não encontrou, usar primeira imagem local disponível
            if product.get('catalogImages'):
                return product['catalogImages'][0]
            if product.get('images'):
                return product['images'][0]
        return full_url
    
    # Substituir URLs em src, data-src, srcset
    updated_content = re.sub(
        r'https://[^\s"\'<>]+\.(png|jpg|jpeg|gif|webp)',
        replace_url,
        updated_content,
        flags=re.I
    )
    
    # Substituir também variações de tamanho (ex: IMG_CATA1-300x169.png)
    for base_name, local_url in url_mapping.items():
        if base_name:
            # Substituir todas as variações desta imagem
            pattern = re.escape(base_name).replace(r'\.', r'[.-]')
            pattern = rf'{pattern}(-\d+x\d+)?(-\d+w)?(-scaled)?(\.\w+)?'
            updated_content = re.sub(
                rf'https://[^\s"\'<>]*{pattern}',
                local_url,
                updated_content,
                flags=re.I
            )
    
    if updated_content != original_content:
        product['catalogContent'] = updated_content
        updated_count += 1
        print(f"[{updated_count}] {title} - URLs substituidas no HTML")

print(f"\nTotal de produtos atualizados: {updated_count}")

# Salvar
if updated_count > 0:
    with open('front-end/src/data/catalog-products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print("Arquivo salvo!")


