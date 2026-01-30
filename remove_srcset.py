#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Remover srcset problemático do HTML - deixar apenas src"""

import json
from bs4 import BeautifulSoup
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def remove_srcset(html_content):
    """Remove srcset do HTML - deixa apenas src"""
    if not html_content:
        return html_content
    
    soup = BeautifulSoup(html_content, 'html.parser')
    updated_count = 0
    
    for img_tag in soup.find_all('img'):
        # Se tem srcset, remover
        if img_tag.get('srcset'):
            del img_tag['srcset']
            updated_count += 1
    
    return str(soup), updated_count

# Carregar produtos
with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("Removendo srcset do HTML...\n")

total_updated = 0

for product in products:
    title = product.get('title', '')[:50]
    catalog_content = product.get('catalogContent', '')
    
    if not catalog_content:
        continue
    
    updated_content, count = remove_srcset(catalog_content)
    
    if count > 0:
        product['catalogContent'] = updated_content
        total_updated += count
        print(f"[{total_updated}] {title} - {count} srcset(s) removido(s)")

print(f"\nTotal de srcset removidos: {total_updated}")

# Salvar
if total_updated > 0:
    with open('front-end/src/data/catalog-products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print("Arquivo salvo!")


