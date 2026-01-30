#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar os 5 produtos faltantes identificados
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import os
import sys
import time
from urllib.parse import urljoin

# Importar funções do import_all_products.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from import_all_products import (
    extract_product_info, 
    download_file, 
    create_slug, 
    parse_price,
    extract_metadata_from_html
)

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Lista dos 5 produtos faltantes
MISSING_PRODUCTS = [
    {
        'title': 'A comunidade terrestre',
        'url': 'https://n-1edicoes.org/publicacoes/a-comunidade-terrestre/'
    },
    {
        'title': 'Sobre a pintura: Aulas de março a junho de 1981',
        'url': 'https://n-1edicoes.org/publicacoes/sobre-a-pintura/'
    },
    {
        'title': 'O menino e o gato na floresta de aço',
        'url': 'https://n-1edicoes.org/publicacoes/o-menino-e-o-gato-na-floresta-de-aco/'
    },
    {
        'title': 'Animacidades - Biopolítica, materialidade racial e afeto queer',
        'url': 'https://n-1edicoes.org/publicacoes/animacidades/'
    },
    {
        'title': 'O desencadeamento do mundo: a nova lógica da violência',
        'url': 'https://n-1edicoes.org/publicacoes/o-desencadeamento-do-mundo/'
    }
]

def process_product(product_info_dict, catalog_file='front-end/src/data/catalog-products.json'):
    """Processa e adiciona um produto ao catálogo"""
    
    # Carregar catálogo existente
    if os.path.exists(catalog_file):
        with open(catalog_file, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
    else:
        catalog = []
    
    existing_slugs = {p.get('slug', '') for p in catalog}
    catalog_url = 'https://n-1edicoes.org/catalogo/'
    
    url = product_info_dict['url']
    print(f"\n{'='*60}")
    print(f"Processando: {product_info_dict['title']}")
    print(f"URL: {url}")
    print('='*60)
    
    try:
        product_info = extract_product_info(url, catalog_url)
        
        if not product_info or not product_info.get('title'):
            print(f"  [!] Produto sem titulo, pulando...")
            return False
        
        slug = create_slug(product_info['title'])
        
        if slug in existing_slugs:
            print(f"  [>] Produto ja existe no catalogo, pulando...")
            return False
        
        # Baixar imagem da capa
        cover_image_url = product_info.get('cover_image')
        cover_image_local = None
        if cover_image_url:
            print(f"  [*] Baixando capa: {cover_image_url}")
            sku = product_info.get('sku', 'product')
            cover_filename = f"cover_{sku}.jpg"
            images_dir = "front-end/public/images"
            cover_image_local = download_file(cover_image_url, images_dir, cover_filename)
            if cover_image_local:
                print(f"  [+] Capa baixada: {cover_filename}")
            else:
                print(f"  [!] Falha ao baixar capa")
        
        # Criar objeto do produto
        if cover_image_local:
            image_path = f"/images/{os.path.basename(cover_image_local)}"
        else:
            image_path = f"/images/cover_{product_info.get('sku', 'product')}.jpg" if product_info.get('sku') else "/images/cover_product.jpg"
        
        # Extrair metadados do HTML se necessário
        html_content = product_info.get('catalog_content', '')
        if html_content:
            metadata = extract_metadata_from_html(html_content)
            product_info.update(metadata)
        
        product = {
            "_id": f"catalog-{slug}",
            "id": f"catalog-{slug}",
            "title": product_info['title'],
            "description": product_info.get('description', ''),
            "shortDescription": (product_info.get('description', '')[:200] + '...') if len(product_info.get('description', '')) > 200 else product_info.get('description', ''),
            "image": image_path,
            "images": [image_path],
            "price": parse_price(product_info.get('price', 0)),
            "originalPrice": parse_price(product_info.get('price', 0)),
            "discount": 0,
            "sku": product_info.get('sku', ''),
            "stock": None,
            "inStock": True,
            "tags": [product_info.get('author', '')] if product_info.get('author') else [],
            "categories": ["Livros"],
            "itemInfo": "latest-product",
            "rating": {"average": 0, "count": 0},
            "permalink": f"/livros/{slug}",
            "slug": slug,
            "catalogContent": product_info.get('catalog_content', ''),
            "catalogImages": product_info.get('catalog_images', []),
            "catalogPdf": product_info.get('catalog_pdf', ''),
            "source": "catalog"
        }
        
        # Adicionar metadados extraídos
        metadata_fields = ['bookTitle', 'originalTitle', 'author', 'authors', 'organization', 
                        'translation', 'preparation', 'revision', 'year', 'pages', 
                        'dimensions', 'isbn', 'priceText']
        for field in metadata_fields:
            if field in product_info:
                product[field] = product_info[field]
        
        catalog.append(product)
        existing_slugs.add(slug)
        
        print(f"  [+] Produto adicionado: {product_info['title']}")
        
        # Salvar catálogo
        with open(catalog_file, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        
        print(f"  [+] Catálogo salvo!")
        
        return True
        
    except Exception as e:
        error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
        print(f"  [X] Erro: {error_msg[:100]}")
        return False

def main():
    print("="*60)
    print("IMPORTANDO 5 PRODUTOS FALTANTES")
    print("="*60)
    
    catalog_file = 'front-end/src/data/catalog-products.json'
    success_count = 0
    error_count = 0
    
    for i, product in enumerate(MISSING_PRODUCTS, 1):
        print(f"\n[{i}/5] {product['title']}")
        if process_product(product, catalog_file):
            success_count += 1
        else:
            error_count += 1
        
        # Pausa entre produtos
        if i < len(MISSING_PRODUCTS):
            time.sleep(1)
    
    print(f"\n{'='*60}")
    print(f"RESUMO:")
    print(f"  ✓ Sucesso: {success_count}")
    print(f"  ✗ Erros: {error_count}")
    print('='*60)

if __name__ == "__main__":
    main()

