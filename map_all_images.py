#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mapeia todas as imagens MINI/site e relaciona com produtos"""

import requests
from bs4 import BeautifulSoup
import re
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

catalog_url = 'https://n-1edicoes.org/catalogo/'
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(catalog_url, timeout=10, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Encontrar todas as imagens MINI/site
all_imgs = soup.find_all('img')
mini_images = []

for img in all_imgs:
    src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
    if src:
        src_lower = src.lower()
        if 'mini' in src_lower or 'site' in src_lower:
            # Procurar h4 próximo
            img_parent = img.find_parent()
            h4_nearby = None
            
            # Procurar h4 no mesmo elemento ou próximo
            for elem in [img_parent, img_parent.find_parent() if img_parent else None]:
                if elem:
                    h4_nearby = elem.find('h4')
                    if not h4_nearby:
                        # Procurar h4 irmão
                        h4_nearby = elem.find_next_sibling('h4')
                    if h4_nearby:
                        break
            
            title = h4_nearby.get_text(strip=True) if h4_nearby else "SEM TITULO"
            mini_images.append((title, src))

print(f"Imagens MINI/SITE encontradas: {len(mini_images)}\n")
for title, src in mini_images[:20]:  # Primeiras 20
    print(f"{title[:60]:60} -> {src}")


