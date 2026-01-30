#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analisa TODAS as imagens MINI/site do catálogo e relaciona com produtos"""

import requests
from bs4 import BeautifulSoup
import re
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

catalog_url = 'https://n-1edicoes.org/catalogo/'
headers = {'User-Agent': 'Mozilla/5.0'}

print("Analisando catálogo completo...")
response = requests.get(catalog_url, timeout=10, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Encontrar todos os h4 (títulos dos produtos)
all_h4 = soup.find_all('h4', class_=re.compile(r'eltdf-pli-title', re.I))

print(f"\nTotal de produtos encontrados: {len(all_h4)}\n")
print("="*100)

product_image_map = []

for h4 in all_h4:
    title = h4.get_text(strip=True)
    
    # Procurar portfolio item
    portfolio_item = h4.find_parent(class_=re.compile(r'portfolio|eltdf-pli', re.I))
    if not portfolio_item:
        portfolio_item = h4.find_parent('article')
    if not portfolio_item:
        portfolio_item = h4.find_parent('div', class_=re.compile(r'item|entry', re.I))
    
    images_found = []
    
    if portfolio_item:
        imgs = portfolio_item.find_all('img')
        for img in imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if src:
                src_lower = src.lower()
                is_mini = 'mini' in src_lower or 'site' in src_lower
                images_found.append((src, is_mini))
    
    # Se não encontrou no portfolio item, procurar em elementos próximos
    if not images_found:
        parent = h4.find_parent()
        if parent:
            # Procurar em todos os elementos próximos
            for elem in [parent, parent.find_previous_sibling(), parent.find_next_sibling()]:
                if elem:
                    imgs = elem.find_all('img')
                    for img in imgs:
                        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                        if src:
                            src_lower = src.lower()
                            is_mini = 'mini' in src_lower or 'site' in src_lower
                            images_found.append((src, is_mini))
                    if images_found:
                        break
    
    # Filtrar apenas imagens MINI/site
    mini_images = [src for src, is_mini in images_found if is_mini]
    all_images = [src for src, _ in images_found]
    
    product_image_map.append({
        'title': title,
        'mini_images': mini_images,
        'all_images': all_images[:3]  # Primeiras 3 para não poluir
    })

# Mostrar resultados
print("\nPRODUTOS COM IMAGENS MINI/SITE ENCONTRADAS:\n")
found_count = 0
for item in product_image_map:
    if item['mini_images']:
        found_count += 1
        print(f"[{found_count}] {item['title'][:70]}")
        for img in item['mini_images']:
            print(f"    -> {img}")
        print()

print(f"\n{'='*100}")
print(f"Total de produtos com imagens MINI/site: {found_count} de {len(product_image_map)}")
print(f"{'='*100}\n")

# Mostrar produtos SEM imagens MINI
print("\nPRODUTOS SEM IMAGENS MINI/SITE (primeiros 20):\n")
no_mini = [item for item in product_image_map if not item['mini_images']]
for i, item in enumerate(no_mini[:20], 1):
    print(f"[{i}] {item['title'][:70]}")
    if item['all_images']:
        print(f"    (Tem {len(item['all_images'])} imagem(ns) mas não é MINI/site)")
    else:
        print(f"    (Nenhuma imagem encontrada)")
    print()


