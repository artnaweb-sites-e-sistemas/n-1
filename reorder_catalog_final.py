#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para reordenar o catalog-products.json de acordo com catalog_correct_structure.json
"""

import json
import sys
from difflib import SequenceMatcher

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def similarity(a, b):
    """Calcular similaridade entre duas strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def normalize_title(title):
    """Normalizar título para comparação"""
    import re
    import unicodedata
    
    if not title:
        return ''
    
    # Converter para minúsculas
    title = title.lower()
    # Normalizar acentos
    title = unicodedata.normalize('NFD', title)
    title = ''.join(c for c in title if unicodedata.category(c) != 'Mn')
    # Remover caracteres especiais
    title = re.sub(r'[^a-z0-9\s]', '', title)
    # Remover espaços extras
    title = ' '.join(title.split())
    
    return title

def main():
    print("=" * 60)
    print("REORDENAÇÃO DO CATÁLOGO")
    print("=" * 60)
    
    # Carregar arquivos
    with open('catalog_correct_structure.json', 'r', encoding='utf-8') as f:
        structure = json.load(f)
    
    with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Estrutura correta: {len(structure)} items")
    print(f"Produtos atuais: {len(products)} items")
    
    # Criar mapeamento de slugs e títulos normalizados
    products_by_slug = {}
    products_by_title = {}
    
    for p in products:
        slug = p.get('slug', '')
        title = p.get('title', '')
        
        if slug:
            products_by_slug[slug.lower()] = p
        if title:
            products_by_title[normalize_title(title)] = p
    
    # Reordenar produtos de acordo com a estrutura
    ordered_products = []
    not_found = []
    used_slugs = set()
    
    for item in structure:
        struct_slug = item.get('slug', '').lower()
        struct_title = item.get('title', '')
        struct_title_norm = normalize_title(struct_title)
        
        # Tentar encontrar por slug
        product = products_by_slug.get(struct_slug)
        
        # Se não encontrou, tentar por título normalizado
        if not product:
            product = products_by_title.get(struct_title_norm)
        
        # Se ainda não encontrou, tentar por similaridade
        if not product:
            best_match = None
            best_score = 0
            
            for p in products:
                p_slug = p.get('slug', '').lower()
                if p_slug in used_slugs:
                    continue
                
                p_title_norm = normalize_title(p.get('title', ''))
                score = similarity(struct_title_norm, p_title_norm)
                
                if score > best_score and score > 0.7:
                    best_score = score
                    best_match = p
            
            if best_match:
                product = best_match
                print(f"Fuzzy match: '{struct_title[:40]}' -> '{best_match.get('title', '')[:40]}' ({best_score:.2f})")
        
        if product:
            ordered_products.append(product)
            used_slugs.add(product.get('slug', '').lower())
        else:
            not_found.append(struct_title)
            print(f"NÃO ENCONTRADO: {struct_title}")
    
    # Adicionar produtos que não estavam na estrutura no final
    remaining = []
    for p in products:
        if p.get('slug', '').lower() not in used_slugs:
            remaining.append(p)
    
    if remaining:
        print(f"\n{len(remaining)} produtos extras (não na estrutura):")
        for r in remaining[:10]:
            print(f"  - {r.get('title', '')[:50]}")
        if len(remaining) > 10:
            print(f"  ... e mais {len(remaining) - 10}")
    
    # Salvar resultado
    final_products = ordered_products + remaining
    
    with open('front-end/src/data/catalog-products.json', 'w', encoding='utf-8') as f:
        json.dump(final_products, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print("REORDENAÇÃO CONCLUÍDA!")
    print(f"{'=' * 60}")
    print(f"Produtos ordenados: {len(ordered_products)}")
    print(f"Não encontrados: {len(not_found)}")
    print(f"Extras: {len(remaining)}")
    print(f"Total final: {len(final_products)}")
    
    if not_found:
        print("\nProdutos não encontrados:")
        for title in not_found[:10]:
            print(f"  - {title}")

if __name__ == '__main__':
    main()

