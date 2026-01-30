#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir todas as capas e reordenar o catálogo baseado na estrutura correta
"""

import json
import sys
import requests
import os
from difflib import SequenceMatcher
from urllib.parse import urlparse

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def normalize_title(title):
    """Normaliza o título para comparação"""
    if not title:
        return ""
    normalized = title.lower()
    normalized = normalized.replace('``', '"').replace("''", '"')
    normalized = normalized.replace('—', '-').replace('–', '-')
    normalized = normalized.replace(':', '').replace(';', '')
    normalized = normalized.replace('?', '').replace('!', '')
    normalized = normalized.replace('.', '').strip()
    return normalized

def find_best_match(target_title, available_items):
    """Encontra o melhor match para um título"""
    best_match = None
    highest_ratio = 0.0
    normalized_target = normalize_title(target_title)

    for item in available_items:
        item_title = item.get('title', '')
        normalized_item = normalize_title(item_title)
        
        if normalized_target == normalized_item:
            return item, 1.0
        
        if normalized_target in normalized_item or normalized_item in normalized_target:
            ratio = max(
                SequenceMatcher(None, normalized_target, normalized_item).ratio(),
                SequenceMatcher(None, normalized_item, normalized_target).ratio()
            )
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = item
        
        ratio = SequenceMatcher(None, normalized_target, normalized_item).ratio()
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = item
    
    if highest_ratio >= 0.7:
        return best_match, highest_ratio
    return None, highest_ratio

def download_image(url, local_path):
    """Baixa uma imagem e salva localmente"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, timeout=30, stream=True, headers=headers)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"    ✗ Erro ao baixar: {e}")
        return False

def main():
    correct_structure_file = 'catalog_correct_structure.json'
    catalog_file = 'front-end/src/data/catalog-products.json'
    
    # Carregar estrutura correta
    with open(correct_structure_file, 'r', encoding='utf-8') as f:
        correct_structure = json.load(f)
    
    # Carregar produtos atuais
    with open(catalog_file, 'r', encoding='utf-8') as f:
        current_products = json.load(f)
    
    print(f"Estrutura correta: {len(correct_structure)} produtos")
    print(f"Produtos atuais: {len(current_products)} produtos")
    print()
    
    # Criar dicionário de produtos atuais por título (para busca rápida)
    products_by_title = {}
    for product in current_products:
        title = product.get('title', '')
        if title:
            products_by_title[title] = product
    
    # Reordenar e corrigir capas
    ordered_products = []
    remaining_products = list(current_products)
    updated_covers = 0
    downloaded_images = 0
    
    print("="*80)
    print("REORDENANDO E CORRIGINDO CAPAS")
    print("="*80)
    print()
    
    for idx, correct_product in enumerate(correct_structure, 1):
        correct_title = correct_product['title']
        correct_cover = correct_product.get('cover_image')
        correct_slug = correct_product.get('slug')
        
        # Encontrar produto correspondente
        best_match, ratio = find_best_match(correct_title, remaining_products)
        
        if best_match and ratio >= 0.7:
            # Atualizar capa se necessário
            current_image = best_match.get('image', '')
            sku = best_match.get('sku', '')
            
            if correct_cover and sku:
                # Verificar se precisa atualizar
                needs_update = False
                
                # Se a imagem atual é local mas a correta é diferente
                if current_image.startswith('/images/'):
                    # Verificar se a URL correta é diferente
                    # Baixar a capa correta
                    local_path = f"front-end/public/images/cover_{sku}.jpg"
                    if download_image(correct_cover, local_path):
                        best_match['image'] = f"/images/cover_{sku}.jpg"
                        if best_match.get('images') and len(best_match['images']) > 0:
                            best_match['images'][0] = f"/images/cover_{sku}.jpg"
                        updated_covers += 1
                        downloaded_images += 1
                        print(f"[{idx:3d}] ✓ {correct_title[:60]}")
                        print(f"      Capa atualizada: {os.path.basename(correct_cover)}")
                elif current_image != correct_cover:
                    # Imagem externa diferente - baixar e atualizar
                    local_path = f"front-end/public/images/cover_{sku}.jpg"
                    if download_image(correct_cover, local_path):
                        best_match['image'] = f"/images/cover_{sku}.jpg"
                        if best_match.get('images') and len(best_match['images']) > 0:
                            best_match['images'][0] = f"/images/cover_{sku}.jpg"
                        updated_covers += 1
                        downloaded_images += 1
                        print(f"[{idx:3d}] ✓ {correct_title[:60]}")
                        print(f"      Capa atualizada: {os.path.basename(correct_cover)}")
                else:
                    # Capa já está correta
                    print(f"[{idx:3d}] → {correct_title[:60]} (capa OK)")
            else:
                print(f"[{idx:3d}] → {correct_title[:60]} (sem capa no catálogo)")
            
            # Atualizar slug se necessário
            if correct_slug and best_match.get('slug') != correct_slug:
                best_match['slug'] = correct_slug
                best_match['permalink'] = f"/livros/{correct_slug}"
            
            ordered_products.append(best_match)
            remaining_products.remove(best_match)
        else:
            # Produto não encontrado nos importados
            print(f"[{idx:3d}] ✗ {correct_title[:60]} (não importado)")
    
    # Adicionar produtos restantes (que não estavam na estrutura correta) ao final
    ordered_products.extend(remaining_products)
    
    # Salvar catálogo reordenado e atualizado
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(ordered_products, f, indent=2, ensure_ascii=False)
    
    print()
    print("="*80)
    print("RESUMO")
    print("="*80)
    print(f"✓ Produtos reordenados: {len(ordered_products)}")
    print(f"✓ Capas atualizadas: {updated_covers}")
    print(f"✓ Imagens baixadas: {downloaded_images}")
    print(f"✓ Produtos não encontrados: {len(correct_structure) - len([p for p in ordered_products if p in [cp for cp in correct_structure]])}")
    print("="*80)

if __name__ == "__main__":
    main()

