#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar a ordem dos produtos 3, 4 e 5
"""

import json
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ordem correta do PDF
PDF_ORDER = {
    1: "Nas brechas de futuros cancelados",
    2: "Coletânea de Dramaturgias \"A Marcha das Mulheradas\"",
    3: "Ueinzz: território de transmutação poética e política",
    4: "Pensar Gaza – entrevista com Étienne Balibar",
    5: "psicanálise e amefricanidade",
    6: "Os involuntários da pátria",
    7: "Sonhos em série",
    8: "Dinâmicas do pensamento por imagens",
    9: "A comunidade terrestre",
    10: "Sobre a pintura"
}

def main():
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    print("="*80)
    print("VERIFICAÇÃO DA ORDEM DOS PRODUTOS 6, 7, 8, 9 e 10")
    print("="*80)
    
    # Carregar produtos importados
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"\nTotal de produtos: {len(products)}\n")
    print("="*80)
    print("ORDEM ESPERADA (PDF):")
    print("="*80)
    for i in range(6, 11):
        print(f"{i}. {PDF_ORDER[i]}")
    
    print("\n" + "="*80)
    print("ORDEM ATUAL NO ARQUIVO:")
    print("="*80)
    
    for i in range(5, 10):  # Produtos 6, 7, 8, 9, 10 (índices 5-9)
        if i < len(products):
            product = products[i]
            title = product.get('title', 'N/A')
            sku = product.get('sku', 'N/A')
            image = product.get('image', 'N/A')
            
            # Verificar se corresponde ao esperado
            expected = PDF_ORDER.get(i + 1, '')
            # Normalizar para comparação
            title_norm = title.lower().replace('``', '"').replace("''", '"')
            expected_norm = expected.lower().replace('``', '"').replace("''", '"')
            match = "✓" if expected and (expected_norm in title_norm or title_norm in expected_norm or 
                      any(word in title_norm for word in expected_norm.split() if len(word) > 4)) else "✗"
            
            print(f"{i+1}. {match} {title}")
            print(f"   SKU: {sku}")
            print(f"   Imagem: {image}")
            print()
    
    print("="*80)
    print("DETALHES DOS PRODUTOS 6, 7, 8, 9 e 10:")
    print("="*80)
    
    for i in [5, 6, 7, 8, 9]:  # Índices 5-9 (produtos 6, 7, 8, 9, 10)
        if i < len(products):
            product = products[i]
            print(f"\nPRODUTO {i+1}:")
            print(f"  Título: {product.get('title', 'N/A')}")
            print(f"  SKU: {product.get('sku', 'N/A')}")
            print(f"  Imagem: {product.get('image', 'N/A')}")
            print(f"  bookTitle: {product.get('bookTitle', 'N/A')}")
            print(f"  authors: {product.get('authors', 'N/A')}")
            print(f"  year: {product.get('year', 'N/A')}")
            print(f"  isbn: {product.get('isbn', 'N/A')}")
            print(f"  price: {product.get('price', 'N/A')}")
            print(f"  catalogImages: {len(product.get('catalogImages', []))} imagem(ns)")
            print(f"  catalogContent: {'Sim' if product.get('catalogContent') else 'Não'}")
    
    print("\n" + "="*80)

if __name__ == "__main__":
    main()

