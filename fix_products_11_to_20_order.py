#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir a ordem dos produtos 11 ao 20
"""

import json
import sys
from difflib import SequenceMatcher

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

def find_product_by_title(products, target_title):
    """Encontra produto pelo título (com matching flexível)"""
    normalized_target = normalize_title(target_title)
    
    # Extrair palavras-chave principais do título
    target_words = [w for w in normalized_target.split() if len(w) > 2]
    key_words = target_words[:4] if len(target_words) >= 4 else target_words
    
    best_match = None
    best_ratio = 0.0
    
    for product in products:
        product_title = product.get('title', '')
        normalized_product = normalize_title(product_title)
        
        # Match exato
        if normalized_target == normalized_product:
            return product
        
        # Verificar se o título do produto começa com as palavras-chave principais
        if key_words:
            key_phrase = ' '.join(key_words)
            product_starts_with_key = normalized_product.startswith(key_phrase)
            
            # OU verificar se todas as palavras-chave principais estão presentes
            all_key_words_present = all(word in normalized_product for word in key_words)
            
            # OU verificar se o título começa com as primeiras 2 palavras
            if len(key_words) >= 2:
                first_two_words = ' '.join(key_words[:2])
                starts_with_first_two = normalized_product.startswith(first_two_words)
            else:
                starts_with_first_two = False
            
            if product_starts_with_key or all_key_words_present or starts_with_first_two:
                ratio = SequenceMatcher(None, normalized_target, normalized_product).ratio()
                if product_starts_with_key:
                    ratio += 0.3
                elif starts_with_first_two:
                    ratio += 0.2
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = product
    
    # Se encontrou um match com boa similaridade, retornar
    if best_match and best_ratio > 0.4:
        return best_match
    
    return None

def main():
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    print("="*80)
    print("CORREÇÃO DA ORDEM DOS PRODUTOS 11 AO 20")
    print("="*80)
    
    # Carregar produtos
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"\nTotal de produtos: {len(products)}\n")
    
    # Criar nova lista ordenada
    new_ordered_products = []
    used_products = set()
    
    # Adicionar produtos 1-10 (já estão corretos)
    for i in range(10):
        if i < len(products):
            new_ordered_products.append(products[i])
            used_products.add(id(products[i]))
    
    print("Produtos 1-10 mantidos na ordem correta")
    
    # Encontrar e adicionar produtos 11-20 na ordem correta
    for i in range(11, 21):
        expected_title = PDF_ORDER[i]
        print(f"\nProcurando produto {i}: {expected_title}")
        
        # Procurar em todos os produtos (exceto os já usados)
        remaining_products = [p for p in products if id(p) not in used_products]
        found_product = find_product_by_title(remaining_products, expected_title)
        
        # Se não encontrou, tentar busca manual para casos específicos
        if not found_product:
            if "Futuros Menores" in expected_title:
                for p in remaining_products:
                    title = p.get('title', '').lower()
                    if 'futuros' in title and 'menores' in title:
                        found_product = p
                        break
            elif "A última guerra" in expected_title:
                for p in remaining_products:
                    title = p.get('title', '').lower()
                    if 'última' in title and 'guerra' in title:
                        found_product = p
                        break
            elif "Cartas a um velho terapeuta" in expected_title:
                for p in remaining_products:
                    title = p.get('title', '').lower()
                    if 'cartas' in title and 'terapeuta' in title:
                        found_product = p
                        break
            elif "Animacidades" in expected_title:
                for p in remaining_products:
                    title = p.get('title', '').lower()
                    if 'animacidades' in title:
                        found_product = p
                        break
            elif "O desencadeamento do mundo" in expected_title:
                for p in remaining_products:
                    title = p.get('title', '').lower()
                    if 'desencadeamento' in title and 'mundo' in title:
                        found_product = p
                        break
        
        if found_product:
            new_ordered_products.append(found_product)
            used_products.add(id(found_product))
            print(f"  ✓ Encontrado: {found_product.get('title', 'N/A')}")
        else:
            print(f"  ✗ NÃO ENCONTRADO: {expected_title}")
    
    # Adicionar produtos restantes (que não estão na ordem 11-20)
    remaining_products = [p for p in products if id(p) not in used_products]
    print(f"\nAdicionando {len(remaining_products)} produtos restantes ao final...")
    new_ordered_products.extend(remaining_products)
    
    # Salvar arquivo atualizado
    with open(catalog_products_file, 'w', encoding='utf-8') as f:
        json.dump(new_ordered_products, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*80)
    print("RESUMO")
    print("="*80)
    print(f"✓ Total de produtos: {len(new_ordered_products)}")
    print(f"✓ Produtos 1-10: mantidos")
    print(f"✓ Produtos 11-20: reordenados")
    print(f"✓ Arquivo salvo: {catalog_products_file}")
    print("="*80)
    
    # Mostrar ordem final dos produtos 11-20
    print("\nORDEM FINAL DOS PRODUTOS 11-20:")
    print("-" * 80)
    for i in range(10, 20):
        if i < len(new_ordered_products):
            product = new_ordered_products[i]
            print(f"{i+1}. {product.get('title', 'N/A')}")

if __name__ == "__main__":
    main()

