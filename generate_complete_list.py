#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gera lista completa de produtos na ordem correta
"""

import json
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def main():
    with open('catalog_correct_structure.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    output_lines = [
        '# LISTA COMPLETA DE PRODUTOS - ORDEM CORRETA DO CATÁLOGO',
        '',
        f'Total: {len(products)} produtos',
        '',
        '---',
        ''
    ]
    
    for i, product in enumerate(products, 1):
        title = product.get('title', 'N/A')
        url = product.get('url', 'N/A')
        slug = product.get('slug', 'N/A')
        cover = product.get('cover_image', 'N/A')
        
        output_lines.append(f'{i}. **{title}**')
        output_lines.append(f'   - URL: {url}')
        output_lines.append(f'   - Slug: {slug}')
        output_lines.append(f'   - Capa: {cover}')
        output_lines.append('')
    
    with open('LISTA_COMPLETA_PRODUTOS_ORDEM_CORRETA.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"✓ Lista gerada com {len(products)} produtos")
    print(f"✓ Arquivo salvo: LISTA_COMPLETA_PRODUTOS_ORDEM_CORRETA.md")

if __name__ == "__main__":
    main()

