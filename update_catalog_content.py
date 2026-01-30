#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar o catalog_content com as URLs corretas das imagens
e extrair o iframe do Issuu
"""

import json
import re
from urllib.parse import urlparse

# Ler o JSON atual
with open('product_meta_fields.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

catalog_content = data['catalog_content']

# Mapear imagens antigas para novas URLs
image_mapping = {
    'renan_site01-scaled.png': 'https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_9786561190763_1.png',
    'IMG_3825.png': 'https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_2.png',
    'IMG_38661.png': 'https://n-1.artnaweb.com.br/wp-content/uploads/2026/01/catalog_image_product_3.png',
}

# Substituir todas as URLs de imagens no HTML
for old_name, new_url in image_mapping.items():
    # Substituir em src
    catalog_content = re.sub(
        r'src=["\']https://n-1edicoes\.org/wp-content/uploads/[^"\']*' + re.escape(old_name) + r'[^"\']*["\']',
        f'src="{new_url}"',
        catalog_content,
        flags=re.IGNORECASE
    )
    # Substituir em srcset
    catalog_content = re.sub(
        r'https://n-1edicoes\.org/wp-content/uploads/[^"\']*' + re.escape(old_name) + r'[^"\']*',
        new_url,
        catalog_content,
        flags=re.IGNORECASE
    )

# Extrair todas as imagens do conteúdo para o array catalog_images
image_urls = re.findall(r'src=["\']([^"\']+\.(?:png|jpg|jpeg|gif|webp))["\']', catalog_content, re.IGNORECASE)
# Filtrar apenas as imagens que são do nosso domínio ou são as que mapeamos
filtered_images = []
for img_url in image_urls:
    if 'n-1.artnaweb.com.br' in img_url:
        if img_url not in filtered_images:
            filtered_images.append(img_url)
    elif any(old_name in img_url for old_name in image_mapping.keys()):
        # Se for uma das imagens mapeadas, usar a nova URL
        for old_name, new_url in image_mapping.items():
            if old_name in img_url:
                if new_url not in filtered_images:
                    filtered_images.append(new_url)
                break

# Extrair iframe do Issuu
issuu_iframe_match = re.search(
    r'<iframe[^>]+src=["\']([^"\']*issuu[^"\']*)["\'][^>]*>',
    catalog_content,
    re.IGNORECASE
)

issuu_url = ''
if issuu_iframe_match:
    issuu_url = issuu_iframe_match.group(1)
    # Decodificar entidades HTML
    issuu_url = issuu_url.replace('&amp;', '&')

# Atualizar o JSON
data['catalog_content'] = catalog_content
data['catalog_images'] = filtered_images if filtered_images else data['catalog_images']
data['catalog_pdf'] = issuu_url  # Salvar URL do Issuu como PDF (ou podemos criar catalog_issuu)

# Salvar
with open('product_meta_fields.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Atualizado product_meta_fields.json")
print(f"Imagens encontradas: {len(filtered_images)}")
print(f"URL do Issuu: {issuu_url[:100] if issuu_url else 'Nao encontrado'}...")


