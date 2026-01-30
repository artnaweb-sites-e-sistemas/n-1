#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar quais produtos faltam importar
"""

import json
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def main():
    correct_structure_file = 'catalog_correct_structure.json'
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    # Carregar estrutura correta
    with open(correct_structure_file, 'r', encoding='utf-8') as f:
        correct_structure = json.load(f)
    
    # Carregar produtos importados
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    # Criar sets de slugs para comparação
    imported_slugs = {p.get('slug', '') for p in imported_products if p.get('slug')}
    correct_slugs = {p.get('slug', '') for p in correct_structure if p.get('slug')}
    
    # Encontrar produtos faltantes
    missing_products = []
    for product in correct_structure:
        slug = product.get('slug', '')
        if slug and slug not in imported_slugs:
            missing_products.append(product)
    
    print("="*80)
    print("VERIFICAÇÃO DE PRODUTOS FALTANTES")
    print("="*80)
    print(f"\nTotal no catálogo correto: {len(correct_structure)}")
    print(f"Total importados: {len(imported_products)}")
    print(f"Faltam importar: {len(missing_products)}")
    
    if missing_products:
        print("\n" + "="*80)
        print("PRODUTOS FALTANTES (primeiros 20):")
        print("="*80)
        for i, product in enumerate(missing_products[:20], 1):
            title = product.get('title', 'N/A')
            url = product.get('url', 'N/A')
            print(f"\n{i}. {title}")
            print(f"   URL: {url}")
            print(f"   Slug: {product.get('slug', 'N/A')}")
    
    print("\n" + "="*80)
    
    return missing_products

if __name__ == "__main__":
    missing = main()
