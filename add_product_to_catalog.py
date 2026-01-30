#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para adicionar produto extraído ao catalog-products.json
"""

import json
import re
import os
from urllib.parse import urlparse

def create_slug(title):
    """Cria slug a partir do título"""
    import unicodedata
    slug = title.lower()
    # Normalizar unicode (remover acentos)
    slug = unicodedata.normalize('NFD', slug)
    slug = ''.join(c for c in slug if unicodedata.category(c) != 'Mn')
    # Remover caracteres especiais, manter apenas letras, números, espaços e hífens
    slug = re.sub(r'[^\w\s-]', '', slug)
    # Remover aspas e backticks
    slug = slug.replace('`', '').replace("'", '').replace('"', '')
    # Substituir espaços por hífens
    slug = re.sub(r'[-\s]+', '-', slug)
    # Remover hífens duplicados
    slug = re.sub(r'-+', '-', slug)
    # Remover hífens no início e fim
    slug = slug.strip('-')
    return slug

def extract_images_from_html(html):
    """Extrai URLs de imagens do HTML"""
    # Procurar por src em tags img
    img_pattern = r'src=["\']([^"\']+\.(?:png|jpg|jpeg|webp))["\']'
    matches = re.findall(img_pattern, html, re.IGNORECASE)
    # Filtrar apenas URLs completas
    images = [img for img in matches if img.startswith('http')]
    # Remover duplicatas mantendo ordem
    seen = set()
    unique_images = []
    for img in images:
        # Normalizar URL (remover parâmetros de tamanho)
        base_url = img.split('?')[0]
        if base_url not in seen:
            seen.add(base_url)
            unique_images.append(img)
    return unique_images[:10]  # Limitar a 10 imagens

# Ler dados extraídos
with open('product_meta_fields.json', 'r', encoding='utf-8') as f:
    meta_data = json.load(f)

import csv

# Ler CSV corretamente
with open('woocommerce_product_import.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    csv_data = next(reader, None)
    
    if csv_data:
        sku = csv_data.get('SKU', '9786561190626')
        title = csv_data.get('Name', 'Coletânea de Dramaturgias "A Marcha das Mulheradas"')
        price = csv_data.get('Regular price', '90')
        isbn = csv_data.get('Attribute 2 value(s)', '978-65-6119-062-6')
        year = csv_data.get('Attribute 3 value(s)', '2026')
        pages = csv_data.get('Attribute 4 value(s)', '450')
        dimensions = csv_data.get('Attribute 5 value(s)', '21 x 12 cm')
    else:
        # Valores padrão
        sku = '9786561190626'
        title = 'Coletânea de Dramaturgias "A Marcha das Mulheradas"'
        price = '90'
        isbn = '978-65-6119-062-6'
        year = '2026'
        pages = '450'
        dimensions = '21 x 12 cm'

# Extrair informações do HTML
html_content = meta_data.get('catalog_content', '')
catalog_images = extract_images_from_html(html_content)

# Extrair descrição do HTML
description_match = re.search(r'<p[^>]*>([^<]+)</p>', html_content)
description = description_match.group(1) if description_match else 'A Coletânea de Dramaturgias de "A marcha das mulheradas" é resultado do projeto "A Marcha da Mulherada".'
short_description = description[:200] + '...' if len(description) > 200 else description

# Extrair autoras do HTML
author_match = re.search(r'<strong>Autoras?:</strong>([^<]+)', html_content)
author = author_match.group(1).strip() if author_match else 'Várias autoras'

# Extrair metadados do HTML (usando a mesma função do extract_product_v2.py)
def extract_metadata_from_html(html_content):
    """Extrai metadados do HTML"""
    from bs4 import BeautifulSoup
    if not html_content:
        return {}
    
    soup = BeautifulSoup(html_content, 'html.parser')
    metadata = {}
    
    paragraphs = soup.find_all('p')
    for p in paragraphs:
        text = p.get_text()
        if 'Título:' in text or 'Autor:' in text or 'ISBN:' in text:
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        
                        if 'Título' in key and 'Original' not in key:
                            metadata['bookTitle'] = value
                        elif 'Título Original' in key:
                            metadata['originalTitle'] = value
                        elif 'Autor' in key and 'Autores' not in key and 'Autoras' not in key:
                            metadata['author'] = value
                        elif 'Autores' in key or 'Autoras' in key:
                            metadata['authors'] = value
                        elif 'Organização' in key or 'Organizador' in key or 'Organizadores' in key:
                            metadata['organization'] = value
                        elif 'Tradução' in key:
                            metadata['translation'] = value
                        elif 'Preparação' in key:
                            metadata['preparation'] = value
                        elif 'Revisão' in key:
                            metadata['revision'] = value
                        elif 'Ano' in key:
                            metadata['year'] = value
                        elif 'páginas' in key or 'Páginas' in key:
                            metadata['pages'] = value
                        elif 'Dimensões' in key:
                            metadata['dimensions'] = value
                        elif 'ISBN' in key:
                            metadata['isbn'] = value
                        elif 'Preço' in key:
                            metadata['price'] = value
    return metadata

product_metadata = extract_metadata_from_html(html_content)

# Remover metadados do HTML para evitar duplicação
if html_content and product_metadata:
    soup = BeautifulSoup(html_content, 'html.parser')
    paragraphs = soup.find_all('p')
    for p in paragraphs:
        text = p.get_text()
        if ('Título:' in text or 'Autor:' in text or 'ISBN:' in text) and \
           ('Ano:' in text or 'Dimensões:' in text or 'Preço:' in text):
            p.decompose()
            break
    html_content = str(soup)

# Criar slug
slug = create_slug(title)

# Criar objeto do produto
product = {
    "_id": f"catalog-{slug}",
    "id": f"catalog-{slug}",
    "title": title,
    "description": description,
    "shortDescription": short_description,
    "image": f"/images/cover_{sku}.jpg",
    "images": [f"/images/cover_{sku}.jpg"] + catalog_images[:5],  # Capa + até 5 imagens internas
    "price": float(price),
    "originalPrice": float(price),
    "discount": 0,
    "sku": sku,
    "stock": None,
    "inStock": True,
    "tags": [author] if author else [],
    "categories": ["Livros"],
    "itemInfo": "latest-product",
    "rating": {
        "average": 0,
        "count": 0
    },
    "permalink": f"/livros/{slug}",
    "slug": slug,
    "catalogContent": html_content,  # HTML já sem metadados duplicados
    "catalogImages": catalog_images[:10],  # Até 10 imagens
    "catalogPdf": meta_data.get('catalog_pdf', ''),
    "source": "catalog"
}

# Adicionar metadados extraídos
product.update(product_metadata)

# Ler catálogo existente
catalog_file = 'front-end/src/data/catalog-products.json'
with open(catalog_file, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Verificar se produto já existe
existing_ids = [p.get('_id') for p in catalog]
if product['_id'] not in existing_ids:
    catalog.append(product)
    print(f"Produto adicionado: {title}")
else:
    # Atualizar produto existente
    for i, p in enumerate(catalog):
        if p.get('_id') == product['_id']:
            catalog[i] = product
            print(f"Produto atualizado: {title}")
            break

# Salvar catálogo atualizado
with open(catalog_file, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\n[OK] Catálogo atualizado: {catalog_file}")
print(f"Total de produtos: {len(catalog)}")

