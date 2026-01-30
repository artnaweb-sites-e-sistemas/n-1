#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Resumo final da importação do catálogo.
"""

import json
import os
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def main():
    with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # Contadores
    total = len(products)
    with_cover = sum(1 for p in products if p.get('image') and p['image'].startswith('/images/'))
    with_catalog_content = sum(1 for p in products if p.get('catalogContent'))
    with_catalog_images = sum(1 for p in products if p.get('catalogImages'))
    with_pdf = sum(1 for p in products if p.get('catalogPdf'))
    with_metadata = sum(1 for p in products if any([
        p.get('bookTitle'), p.get('authors'), p.get('year'), 
        p.get('pages'), p.get('isbn'), p.get('dimensions')
    ]))
    
    # Imagens
    images_dir = 'front-end/public/images'
    total_images = len([f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))])
    
    print("=" * 60)
    print("RESUMO FINAL DA IMPORTAÇÃO - CATÁLOGO N-1 EDIÇÕES")
    print("=" * 60)
    print(f"\n📚 PRODUTOS:")
    print(f"   Total de produtos: {total}")
    print(f"   Com capa local: {with_cover} ({with_cover*100//total}%)")
    print(f"   Com conteúdo do catálogo: {with_catalog_content} ({with_catalog_content*100//total}%)")
    print(f"   Com imagens internas: {with_catalog_images} ({with_catalog_images*100//total}%)")
    print(f"   Com PDF/Issuu: {with_pdf} ({with_pdf*100//total}%)")
    print(f"   Com metadados estruturados: {with_metadata} ({with_metadata*100//total}%)")
    
    print(f"\n🖼️  IMAGENS:")
    print(f"   Total de imagens baixadas: {total_images}")
    
    print(f"\n📋 PRIMEIROS 10 PRODUTOS:")
    for i, p in enumerate(products[:10]):
        title = p.get('title', '')[:45]
        has_cover = "✓" if p.get('image', '').startswith('/images/') else "✗"
        has_content = "✓" if p.get('catalogContent') else "✗"
        print(f"   {i+1:2}. [{has_cover}][{has_content}] {title}")
    
    print(f"\n📋 ÚLTIMOS 10 PRODUTOS:")
    for i, p in enumerate(products[-10:]):
        idx = total - 10 + i + 1
        title = p.get('title', '')[:45]
        has_cover = "✓" if p.get('image', '').startswith('/images/') else "✗"
        has_content = "✓" if p.get('catalogContent') else "✗"
        print(f"  {idx:3}. [{has_cover}][{has_content}] {title}")
    
    print(f"\n{'=' * 60}")
    print("IMPORTAÇÃO COMPLETA!")
    print("=" * 60)

if __name__ == '__main__':
    main()

