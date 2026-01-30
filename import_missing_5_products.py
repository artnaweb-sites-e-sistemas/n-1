#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar os 5 produtos faltantes do catálogo
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import os
import sys
from urllib.parse import urljoin
from difflib import SequenceMatcher

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

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

def get_all_product_links(catalog_url):
    """Extrai todos os links de produtos do catálogo"""
    print(f"Acessando catálogo: {catalog_url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(catalog_url, timeout=30, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Procurar todos os links que apontam para /publicacoes/
    links = soup.find_all('a', href=re.compile(r'/publicacoes/', re.I))
    
    product_links = []
    seen = set()
    
    for link in links:
        href = link.get('href', '')
        if href and '/publicacoes/' in href:
            # Normalizar URL
            if href.startswith('/'):
                full_url = urljoin(catalog_url, href)
            else:
                full_url = href
            
            # Remover duplicatas
            if full_url not in seen:
                seen.add(full_url)
                product_links.append(full_url)
    
    print(f"Encontrados {len(product_links)} produtos no catálogo")
    return product_links

def identify_missing_products():
    """Identifica produtos que estão no catálogo mas não foram importados"""
    catalog_url = "https://n-1edicoes.org/catalogo/"
    catalog_file = 'front-end/src/data/catalog-products.json'
    
    # Obter todos os links do catálogo
    catalog_links = get_all_product_links(catalog_url)
    
    # Ler produtos importados
    with open(catalog_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    print(f"\nProdutos importados: {len(imported_products)}")
    print(f"Produtos no catálogo: {len(catalog_links)}")
    
    # Para cada link do catálogo, verificar se o produto foi importado
    missing_products = []
    
    for link_url in catalog_links:
        # Extrair título da URL ou da página
        try:
            response = requests.get(link_url, timeout=30)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Tentar encontrar título
            title_elem = soup.find('h2', class_=re.compile(r'eltdf-st-title', re.I))
            if not title_elem:
                title_elem = soup.find('h1')
            if not title_elem:
                meta_title = soup.find('title')
                if meta_title:
                    title = meta_title.get_text(strip=True).replace(' - N-1 Edições', '').replace(' - N-1 Edicoes', '').strip()
                else:
                    continue
            else:
                title = title_elem.get_text(strip=True)
            
            # Verificar se produto foi importado
            best_match, ratio = find_best_match(title, imported_products)
            
            if not best_match or ratio < 0.7:
                missing_products.append({
                    'title': title,
                    'url': link_url
                })
                print(f"\n[FALTANTE] {title}")
                print(f"  URL: {link_url}")
                print(f"  Ratio: {ratio:.2f}")
                
                if len(missing_products) >= 5:
                    break
        except Exception as e:
            print(f"Erro ao processar {link_url}: {e}")
            continue
    
    return missing_products

def main():
    print("="*60)
    print("IDENTIFICANDO PRODUTOS FALTANTES")
    print("="*60)
    
    missing = identify_missing_products()
    
    print(f"\n{'='*60}")
    print(f"PRODUTOS FALTANTES ENCONTRADOS: {len(missing)}")
    print('='*60)
    
    for i, product in enumerate(missing, 1):
        print(f"\n{i}. {product['title']}")
        print(f"   URL: {product['url']}")
    
    if missing:
        print(f"\n{'='*60}")
        print("Para importar estes produtos, use o script import_all_products.py")
        print("ou execute manualmente para cada URL acima.")
        print('='*60)
    else:
        print("\n✓ Nenhum produto faltante encontrado!")

if __name__ == "__main__":
    main()

