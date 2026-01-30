#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Remove informações de metadados do HTML do catalogContent para evitar duplicação"""

import json
from bs4 import BeautifulSoup
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def remove_metadata_from_html(html_content):
    """Remove parágrafo com metadados do HTML"""
    if not html_content:
        return html_content
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Procurar parágrafos que contêm informações técnicas
    paragraphs = soup.find_all('p')
    
    for p in paragraphs:
        text = p.get_text()
        # Verificar se contém os campos de metadados
        if ('Título:' in text or 'Autor:' in text or 'ISBN:' in text) and \
           ('Ano:' in text or 'Dimensões:' in text or 'Preço:' in text):
            # Este é o parágrafo com metadados - remover
            p.decompose()
            break
    
    return str(soup)

# Carregar produtos
with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("Removendo metadados do HTML...\n")

updated_count = 0

for product in products:
    title = product.get('title', '')[:50]
    catalog_content = product.get('catalogContent', '')
    
    if not catalog_content:
        continue
    
    # Verificar se tem metadados extraídos (se sim, remover do HTML)
    has_metadata = any([
        product.get('bookTitle'),
        product.get('author'),
        product.get('authors'),
        product.get('isbn')
    ])
    
    if has_metadata:
        original_content = catalog_content
        updated_content = remove_metadata_from_html(catalog_content)
        
        if updated_content != original_content:
            product['catalogContent'] = updated_content
            updated_count += 1
            print(f"[{updated_count}] {title} - Metadados removidos do HTML")

print(f"\nTotal de produtos atualizados: {updated_count}")

# Salvar
if updated_count > 0:
    with open('front-end/src/data/catalog-products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print("Arquivo salvo!")


