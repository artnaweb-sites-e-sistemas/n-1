#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Encontra todas as imagens MINI/site no catálogo e relaciona com produtos"""

import requests
from bs4 import BeautifulSoup
import re

catalog_url = 'https://n-1edicoes.org/catalogo/'
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(catalog_url, timeout=10, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Encontrar todos os h4 (títulos dos produtos)
all_h4 = soup.find_all('h4', class_=re.compile(r'eltdf-pli-title', re.I))

print(f"Total de produtos encontrados: {len(all_h4)}\n")
print("="*80)

for h4 in all_h4:
    title = h4.get_text(strip=True)
    print(f"\nProduto: {title}")
    
    # Procurar portfolio item
    portfolio_item = h4.find_parent(class_=re.compile(r'portfolio|eltdf-pli', re.I))
    if not portfolio_item:
        portfolio_item = h4.find_parent('article')
    if not portfolio_item:
        portfolio_item = h4.find_parent('div', class_=re.compile(r'item|entry', re.I))
    
    if portfolio_item:
        imgs = portfolio_item.find_all('img')
        print(f"  Imagens encontradas: {len(imgs)}")
        for img in imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if src:
                src_lower = src.lower()
                is_mini = 'mini' in src_lower or 'site' in src_lower
                marker = " [MINI/SITE]" if is_mini else ""
                print(f"    - {src}{marker}")
    else:
        print("  Portfolio item não encontrado")


