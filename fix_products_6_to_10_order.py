#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir a ordem dos produtos 6, 7, 8, 9 e 10
"""

import json
import sys
from difflib import SequenceMatcher

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

def normalize_title(title):
    """Normaliza título para comparação"""
    if not title:
        return ""
    title = title.lower()
    title = title.replace('``', '"').replace("''", '"').replace('"', '"')
    title = title.replace('–', '-').replace('—', '-')
    # Não remover ':' pois pode ser importante para matching (ex: "Sonhos em série:")
    title = title.replace(';', '').replace('?', '').replace('!', '')
    title = title.replace('.', '').strip()
    return title

def find_product_by_title(products, target_title):
    """Encontra produto pelo título (com matching flexível)"""
    normalized_target = normalize_title(target_title)
    
    # Extrair palavras-chave principais do título (primeiras palavras significativas)
    target_words = [w for w in normalized_target.split() if len(w) > 2]
    # Pegar as primeiras 3-4 palavras como chave principal
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
        # Isso funciona para casos como "Sonhos em série" que tem subtítulo
        if key_words:
            # Verificar se o produto começa com as palavras-chave
            key_phrase = ' '.join(key_words)
            product_starts_with_key = normalized_product.startswith(key_phrase)
            
            # OU verificar se todas as palavras-chave principais estão presentes
            all_key_words_present = all(word in normalized_product for word in key_words)
            
            # OU verificar se o título começa com as primeiras 2 palavras (para casos como "Sonhos em série")
            if len(key_words) >= 2:
                first_two_words = ' '.join(key_words[:2])
                starts_with_first_two = normalized_product.startswith(first_two_words)
            else:
                starts_with_first_two = False
            
            if product_starts_with_key or all_key_words_present or starts_with_first_two:
                # Calcular similaridade
                ratio = SequenceMatcher(None, normalized_target, normalized_product).ratio()
                # Dar bônus se começar com as palavras-chave
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
    print("CORREÇÃO DA ORDEM DOS PRODUTOS 6, 7, 8, 9 e 10")
    print("="*80)
    
    # Carregar produtos
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"\nTotal de produtos: {len(products)}\n")
    
    # Criar nova lista ordenada
    new_ordered_products = []
    used_products = set()
    
    # Adicionar produtos 1-5 (já estão corretos)
    for i in range(5):
        if i < len(products):
            new_ordered_products.append(products[i])
            used_products.add(id(products[i]))
    
    print("Produtos 1-5 mantidos na ordem correta")
    
    # Encontrar e adicionar produtos 6-10 na ordem correta
    for i in range(6, 11):
        expected_title = PDF_ORDER[i]
        print(f"\nProcurando produto {i}: {expected_title}")
        
        # Procurar em todos os produtos (exceto os já usados)
        remaining_products = [p for p in products if id(p) not in used_products]
        found_product = find_product_by_title(remaining_products, expected_title)
        
        # Se não encontrou, tentar busca manual para casos específicos
        if not found_product:
            if "Sonhos em série" in expected_title:
                # Busca específica para "Sonhos em série"
                for p in remaining_products:
                    title = p.get('title', '').lower()
                    if 'sonhos' in title and 'série' in title:
                        found_product = p
                        break
        
        if found_product:
            new_ordered_products.append(found_product)
            used_products.add(id(found_product))
            print(f"  ✓ Encontrado: {found_product.get('title', 'N/A')}")
        else:
            print(f"  ✗ NÃO ENCONTRADO: {expected_title}")
    
    # Adicionar produtos restantes (que não estão na ordem 6-10)
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
    print(f"✓ Produtos 1-5: mantidos")
    print(f"✓ Produtos 6-10: reordenados")
    print(f"✓ Arquivo salvo: {catalog_products_file}")
    print("="*80)
    
    # Mostrar ordem final dos produtos 6-10
    print("\nORDEM FINAL DOS PRODUTOS 6-10:")
    print("-" * 80)
    for i in range(5, 10):
        if i < len(new_ordered_products):
            product = new_ordered_products[i]
            print(f"{i+1}. {product.get('title', 'N/A')}")

if __name__ == "__main__":
    main()

