#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para extrair a estrutura correta do catálogo com ordem e capas
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import sys
from urllib.parse import urljoin

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def extract_catalog_structure(catalog_url):
    """Extrai a estrutura completa do catálogo: ordem e capas"""
    print(f"Acessando catálogo: {catalog_url}")
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(catalog_url, timeout=30, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        products = []
        
        # Estratégia 1: Procurar por links de produtos com suas imagens
        product_links = soup.find_all('a', href=lambda x: x and '/publicacoes/' in x)
        
        seen_urls = set()
        
        for link in product_links:
            href = link.get('href', '')
            if not href:
                continue
            
            # Normalizar URL
            if href.startswith('/'):
                full_url = urljoin(catalog_url, href)
            else:
                full_url = href
            
            # Evitar duplicatas
            if full_url in seen_urls:
                continue
            seen_urls.add(full_url)
            
            # Extrair título
            title = link.get_text(strip=True)
            
            # Se não tem texto no link, procurar na imagem ou elemento pai
            if not title or len(title) < 5:
                img = link.find('img')
                if img:
                    title = img.get('alt', '') or img.get('title', '')
            
            # Se ainda não tem, procurar no elemento pai
            if not title or len(title) < 5:
                parent = link.find_parent(['div', 'article', 'li'])
                if parent:
                    title_elem = parent.find(['h2', 'h3', 'h4', 'h5'])
                    if title_elem:
                        title = title_elem.get_text(strip=True)
            
            if not title or len(title) < 5:
                continue
            
            # Extrair imagem de capa
            cover_image = None
            img = link.find('img')
            if img:
                img_src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                if img_src:
                    cover_image = urljoin(catalog_url, img_src)
            
            # Se não encontrou imagem no link, procurar no elemento pai
            if not cover_image:
                parent = link.find_parent(['div', 'article', 'li'])
                if parent:
                    img = parent.find('img')
                    if img:
                        img_src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                        if img_src:
                            cover_image = urljoin(catalog_url, img_src)
            
            # Extrair slug da URL
            slug_match = re.search(r'/publicacoes/([^/]+)/?', full_url)
            slug = slug_match.group(1) if slug_match else ''
            
            products.append({
                'title': title,
                'url': full_url,
                'slug': slug,
                'cover_image': cover_image,
                'position': len(products) + 1
            })
        
        # Se não encontrou produtos com a primeira estratégia, tentar outra
        if not products:
            print("Tentando estratégia alternativa...")
            # Procurar por elementos de portfolio/item
            portfolio_items = soup.find_all(['div', 'article', 'li'], class_=lambda x: x and any(
                keyword in str(x).lower() for keyword in ['portfolio', 'product', 'item', 'entry']
            ))
            
            for item in portfolio_items:
                link = item.find('a', href=lambda x: x and '/publicacoes/' in x)
                if not link:
                    continue
                
                href = link.get('href', '')
                if href.startswith('/'):
                    full_url = urljoin(catalog_url, href)
                else:
                    full_url = href
                
                if full_url in seen_urls:
                    continue
                seen_urls.add(full_url)
                
                # Título
                title_elem = item.find(['h2', 'h3', 'h4', 'h5', 'a'])
                if title_elem:
                    title = title_elem.get_text(strip=True)
                else:
                    continue
                
                # Imagem
                img = item.find('img')
                cover_image = None
                if img:
                    img_src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    if img_src:
                        cover_image = urljoin(catalog_url, img_src)
                
                slug_match = re.search(r'/publicacoes/([^/]+)/?', full_url)
                slug = slug_match.group(1) if slug_match else ''
                
                products.append({
                    'title': title,
                    'url': full_url,
                    'slug': slug,
                    'cover_image': cover_image,
                    'position': len(products) + 1
                })
        
        return products
        
    except Exception as e:
        print(f"Erro ao extrair catálogo: {e}")
        return []

def main():
    catalog_url = "https://n-1edicoes.org/catalogo/"
    
    print("="*80)
    print("EXTRAINDO ESTRUTURA CORRETA DO CATÁLOGO")
    print("="*80)
    
    products = extract_catalog_structure(catalog_url)
    
    if not products:
        print("\n✗ Não foi possível extrair produtos do catálogo")
        return
    
    print(f"\n✓ Encontrados {len(products)} produtos no catálogo\n")
    
    # Salvar em JSON
    output_file = 'catalog_correct_structure.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Estrutura salva em: {output_file}\n")
    
    # Listar todos os produtos
    print("="*80)
    print("LISTA COMPLETA DE PRODUTOS (ORDEM CORRETA)")
    print("="*80)
    print()
    
    for i, product in enumerate(products, 1):
        print(f"{i:3d}. {product['title']}")
        print(f"     URL: {product['url']}")
        print(f"     Slug: {product['slug']}")
        if product['cover_image']:
            print(f"     Capa: {product['cover_image']}")
        else:
            print(f"     Capa: [NÃO ENCONTRADA]")
        print()
    
    print("="*80)
    print(f"Total: {len(products)} produtos")
    print("="*80)

if __name__ == "__main__":
    main()

