#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar a ordem dos produtos 11 ao 20
"""

import json
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ordem correta do PDF (produtos 11-20)
PDF_ORDER = {
    11: "Aprender com as águas do Cercadinho",
    12: "H₂O e as águas do esquecimento",
    13: "O desencadeamento do mundo",
    14: "Animacidades",
    15: "O cogumelo no fim do mundo",
    16: "O menino e o gato na floresta de aço",
    17: "Futuros Menores",
    18: "A última guerra?",
    19: "Cartas a um velho terapeuta",
    20: "Ivone, Princesa da Borgonha"
}

def normalize_title(title):
    """Normaliza título para comparação"""
    if not title:
        return ""
    title = title.lower()
    title = title.replace('``', '"').replace("''", '"').replace('"', '"')
    title = title.replace('–', '-').replace('—', '-')
    title = title.replace(';', '').replace('?', '').replace('!', '')
    title = title.replace('.', '').strip()
    return title

def main():
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    print("="*80)
    print("VERIFICAÇÃO DA ORDEM DOS PRODUTOS 11 AO 20")
    print("="*80)
    
    # Carregar produtos importados
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"\nTotal de produtos: {len(products)}\n")
    print("="*80)
    print("ORDEM ESPERADA (PDF):")
    print("="*80)
    for i in range(11, 21):
        print(f"{i}. {PDF_ORDER[i]}")
    
    print("\n" + "="*80)
    print("ORDEM ATUAL NO ARQUIVO:")
    print("="*80)
    
    for i in range(10, 20):  # Produtos 11-20 (índices 10-19)
        if i < len(products):
            product = products[i]
            title = product.get('title', 'N/A')
            sku = product.get('sku', 'N/A')
            image = product.get('image', 'N/A')
            
            # Verificar se corresponde ao esperado
            expected = PDF_ORDER.get(i + 1, '')
            # Normalizar para comparação
            title_norm = normalize_title(title)
            expected_norm = normalize_title(expected)
            
            # Verificar match
            match = "✓"
            if expected:
                # Verificar se as palavras-chave principais estão presentes
                expected_words = [w for w in expected_norm.split() if len(w) > 3]
                if expected_words:
                    if not all(word in title_norm for word in expected_words[:3]):
                        match = "✗"
                elif expected_norm not in title_norm and title_norm not in expected_norm:
                    match = "✗"
            
            print(f"{i+1}. {match} {title}")
            print(f"   SKU: {sku}")
            print(f"   Imagem: {image}")
            print()
    
    print("="*80)
    print("DETALHES DOS PRODUTOS 11 AO 20:")
    print("="*80)
    
    for i in [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]:  # Índices 10-19 (produtos 11-20)
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

