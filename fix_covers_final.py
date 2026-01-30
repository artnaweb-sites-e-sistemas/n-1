#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para corrigir as capas dos produtos que não estão com a imagem correta.
"""

import json
import os
import sys
import requests
from urllib.parse import urlparse

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

IMAGES_DIR = 'front-end/public/images'
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

def download_image(url, local_path):
    """Baixar imagem"""
    if os.path.exists(local_path):
        return True
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        if response.status_code == 200:
            with open(local_path, 'wb') as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"  ERRO: {e}")
    return False

def main():
    print("=" * 60)
    print("VERIFICAÇÃO E CORREÇÃO DE CAPAS")
    print("=" * 60)
    
    # Carregar arquivos
    with open('catalog_correct_structure.json', 'r', encoding='utf-8') as f:
        structure = json.load(f)
    
    with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # Criar mapeamento estrutura por posição
    structure_by_pos = {item.get('position', i+1): item for i, item in enumerate(structure)}
    
    updates = 0
    for i, product in enumerate(products):
        position = i + 1
        struct_item = structure_by_pos.get(position)
        
        if not struct_item:
            continue
        
        correct_cover_url = struct_item.get('cover_image', '')
        current_cover = product.get('image', '')
        
        # Se não tem capa ou capa é externa, baixar a correta
        if not current_cover or not current_cover.startswith('/images/') or 'n-1edicoes.org' in current_cover:
            if correct_cover_url:
                parsed = urlparse(correct_cover_url)
                ext = os.path.splitext(parsed.path)[1] or '.jpg'
                sku = product.get('sku', f'N1-{position:05d}')
                local_filename = f"cover_{sku}{ext}"
                local_path = os.path.join(IMAGES_DIR, local_filename)
                
                print(f"[{position}] {product.get('title', '')[:40]}...")
                print(f"  Baixando: {correct_cover_url[:60]}...")
                
                if download_image(correct_cover_url, local_path):
                    local_ref = f"/images/{local_filename}"
                    product['image'] = local_ref
                    
                    # Atualizar images também
                    if product.get('images'):
                        product['images'][0] = local_ref
                    else:
                        product['images'] = [local_ref]
                    
                    updates += 1
                    print(f"  OK: {local_filename}")
    
    # Salvar
    with open('front-end/src/data/catalog-products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"Capas atualizadas: {updates}")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    main()

