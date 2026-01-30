#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verifica se ainda há URLs externas no JSON"""

import json
import re

with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

external_found = []
for product in products:
    title = product.get('title', '')[:50]
    sku = product.get('sku', '')
    
    # Verificar campos diretos
    if product.get('image', '').startswith('http'):
        external_found.append(f"{title} - image: {product.get('image')}")
    
    for idx, img in enumerate(product.get('images', [])):
        if img and img.startswith('http'):
            external_found.append(f"{title} - images[{idx}]: {img}")
    
    for idx, img in enumerate(product.get('catalogImages', [])):
        if img and img.startswith('http'):
            external_found.append(f"{title} - catalogImages[{idx}]: {img}")
    
    # Verificar HTML - apenas imagens (src, data-src, srcset)
    html = product.get('catalogContent', '')
    if html:
        # Procurar apenas URLs de imagens em atributos src, data-src, srcset
        img_urls = re.findall(r'(src|data-src|srcset)=["\'](https://[^\s"\'<>]+\.(png|jpg|jpeg|gif|webp))', html, re.I)
        for attr, url, ext in img_urls:
            # Ignorar iframes do Issuu (são externos por design)
            if 'issuu.com' not in url:
                external_found.append(f"{title} - HTML ({attr}): {url[:80]}")

if external_found:
    print(f"[!] Encontradas {len(external_found)} URLs externas:")
    for item in external_found[:10]:
        print(f"  - {item}")
    if len(external_found) > 10:
        print(f"  ... e mais {len(external_found) - 10}")
else:
    print("[OK] Nenhuma URL externa encontrada (exceto Issuu que e esperado)")
    print(f"[OK] Todos os {len(products)} produtos estao usando caminhos locais")

