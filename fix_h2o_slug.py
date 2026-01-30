#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir o slug do produto H₂O e as águas do esquecimento
"""

import json
import sys
import re
import unicodedata

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def create_slug(title):
    """Cria slug normalizado a partir do título"""
    if not title:
        return ""
    
    # Normalizar unicode (remover acentos, etc)
    slug = unicodedata.normalize('NFD', title)
    slug = ''.join(c for c in slug if unicodedata.category(c) != 'Mn')
    
    # Converter para minúsculas
    slug = slug.lower()
    
    # Substituir caracteres especiais comuns
    # Substituir ₂ (subscrito 2) por "2"
    slug = slug.replace('₂', '2').replace('²', '2')
    slug = slug.replace('₃', '3').replace('³', '3')
    slug = slug.replace('₄', '4').replace('⁴', '4')
    
    # Remover caracteres especiais, manter apenas letras, números, espaços e hífens
    slug = re.sub(r'[^\w\s-]', '', slug)
    
    # Remover aspas e caracteres problemáticos
    slug = slug.replace('`', '').replace("'", '').replace('"', '')
    
    # Substituir espaços e múltiplos hífens por um único hífen
    slug = re.sub(r'[-\s]+', '-', slug)
    
    # Remover hífens no início e fim
    slug = slug.strip('-')
    
    return slug

def main():
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    print("="*80)
    print("CORREÇÃO DO SLUG DO PRODUTO H₂O E AS ÁGUAS DO ESQUECIMENTO")
    print("="*80)
    
    # Carregar produtos
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # Encontrar o produto H₂O
    h2o_product = None
    for product in products:
        if 'H₂O' in product.get('title', '') or 'h2o' in product.get('title', '').lower():
            h2o_product = product
            break
    
    if not h2o_product:
        print("❌ Produto H₂O não encontrado!")
        return
    
    print(f"\nProduto encontrado: {h2o_product.get('title', 'N/A')}")
    print(f"Slug atual: {h2o_product.get('slug', 'N/A')}")
    
    # Gerar novo slug
    new_slug = create_slug(h2o_product.get('title', ''))
    print(f"Novo slug: {new_slug}")
    
    # Atualizar slug e permalink
    old_slug = h2o_product.get('slug', '')
    h2o_product['slug'] = new_slug
    h2o_product['permalink'] = f"/livros/{new_slug}"
    
    print(f"\n✓ Slug atualizado de '{old_slug}' para '{new_slug}'")
    print(f"✓ Permalink atualizado para '{h2o_product['permalink']}'")
    
    # Salvar arquivo atualizado
    with open(catalog_products_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Arquivo salvo: {catalog_products_file}")
    print("="*80)

if __name__ == "__main__":
    main()

