#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mapeia TODAS as imagens do catálogo relacionando com produtos"""

import requests
from bs4 import BeautifulSoup
import re
import sys
import json

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

catalog_url = 'https://n-1edicoes.org/catalogo/'
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(catalog_url, timeout=10, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Encontrar todos os articles (portfolio items)
articles = soup.find_all('article', class_=re.compile(r'eltdf-pl-item|portfolio-item', re.I))

print(f"Total de articles encontrados: {len(articles)}\n")
print("="*100)

image_mapping = []

for article in articles:
    # Buscar h4 dentro do article
    h4 = article.find('h4', class_=re.compile(r'eltdf-pli-title', re.I))
    if not h4:
        continue
    
    title = h4.get_text(strip=True)
    
    # Buscar TODAS as imagens dentro do article
    imgs = article.find_all('img')
    
    # Priorizar imagens MINI/site
    mini_images = []
    other_images = []
    
    for img in imgs:
        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
        if not src:
            continue
        
        src_lower = src.lower()
        if 'mini' in src_lower or 'site' in src_lower:
            mini_images.append(src)
        else:
            other_images.append(src)
    
    # Usar MINI se disponível, senão primeira imagem
    cover_image = mini_images[0] if mini_images else (other_images[0] if other_images else None)
    
    if cover_image:
        image_mapping.append({
            'title': title,
            'cover_image': cover_image,
            'is_mini': len(mini_images) > 0
        })

print(f"\nPRODUTOS COM IMAGENS ENCONTRADAS: {len(image_mapping)}\n")

# Mostrar primeiros 30
for i, item in enumerate(image_mapping[:30], 1):
    marker = "[MINI/SITE]" if item['is_mini'] else "[OUTRA]"
    print(f"[{i:3}] {marker} {item['title'][:60]:60} -> {item['cover_image'][:60]}")

print(f"\n{'='*100}")
print(f"Total mapeado: {len(image_mapping)} produtos")
print(f"Com MINI/site: {sum(1 for item in image_mapping if item['is_mini'])}")
print(f"Com outras imagens: {sum(1 for item in image_mapping if not item['is_mini'])}")
print(f"{'='*100}\n")

# Salvar mapeamento em JSON
with open('catalog_images_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(image_mapping, f, ensure_ascii=False, indent=2)

print("Mapeamento salvo em: catalog_images_mapping.json")


