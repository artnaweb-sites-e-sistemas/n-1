#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extrai metadados do produto do HTML e salva em campos separados"""

import json
import re
from bs4 import BeautifulSoup
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_metadata_from_html(html_content):
    """Extrai metadados do HTML"""
    if not html_content:
        return {}
    
    soup = BeautifulSoup(html_content, 'html.parser')
    metadata = {}
    
    # Procurar parágrafo com informações do produto
    # Padrão: <p><strong>Título:</strong> ... <br/><strong>Autor:</strong> ... etc
    paragraphs = soup.find_all('p')
    
    for p in paragraphs:
        text = p.get_text()
        # Verificar se contém os campos que procuramos
        if 'Título:' in text or 'Autor:' in text or 'ISBN:' in text:
            # Extrair cada campo
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        
                        # Mapear chaves
                        if 'Título' in key:
                            metadata['bookTitle'] = value
                        elif 'Título Original' in key:
                            metadata['originalTitle'] = value
                        elif 'Autor' in key and 'Autores' not in key and 'Autoras' not in key:
                            metadata['author'] = value
                        elif 'Autores' in key or 'Autoras' in key:
                            metadata['authors'] = value
                        elif 'Organização' in key or 'Organizador' in key or 'Organizadores' in key:
                            metadata['organization'] = value
                        elif 'Tradução' in key:
                            metadata['translation'] = value
                        elif 'Preparação' in key:
                            metadata['preparation'] = value
                        elif 'Revisão' in key:
                            metadata['revision'] = value
                        elif 'Ano' in key:
                            metadata['year'] = value
                        elif 'páginas' in key or 'Páginas' in key:
                            metadata['pages'] = value
                        elif 'Dimensões' in key:
                            metadata['dimensions'] = value
                        elif 'ISBN' in key:
                            metadata['isbn'] = value
                        elif 'Preço' in key:
                            metadata['price'] = value
    
    return metadata

# Carregar produtos
with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("Extraindo metadados dos produtos...\n")

updated_count = 0

for product in products:
    title = product.get('title', '')[:50]
    catalog_content = product.get('catalogContent', '')
    
    if not catalog_content:
        continue
    
    metadata = extract_metadata_from_html(catalog_content)
    
    if metadata:
        # Adicionar metadados ao produto
        for key, value in metadata.items():
            product[key] = value
        
        updated_count += 1
        print(f"[{updated_count}] {title}")
        for key, value in metadata.items():
            print(f"  {key}: {value[:60] if value else 'N/A'}")

print(f"\nTotal de produtos atualizados: {updated_count}")

# Salvar
if updated_count > 0:
    with open('front-end/src/data/catalog-products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    print("Arquivo salvo!")


