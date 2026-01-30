#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Análise profunda da estrutura do catálogo"""

import requests
from bs4 import BeautifulSoup
import re
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

catalog_url = 'https://n-1edicoes.org/catalogo/'
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(catalog_url, timeout=10, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Encontrar "Nas brechas" como exemplo
h4_elem = soup.find('h4', string=re.compile('Nas brechas', re.I))

if h4_elem:
    print("=== ESTRUTURA DO PRODUTO 'Nas brechas de futuros cancelados' ===\n")
    
    # Subir na hierarquia
    current = h4_elem
    level = 0
    while current and level < 10:
        print(f"Nível {level}: {current.name} - classes: {current.get('class', [])}")
        if current.name == 'img':
            src = current.get('src', '') or current.get('data-src', '')
            print(f"  IMAGEM ENCONTRADA: {src}")
        current = current.find_parent()
        level += 1
    
    print("\n=== PROCURANDO IMAGENS PRÓXIMAS ===\n")
    
    # Procurar todas as imagens na página
    all_imgs = soup.find_all('img')
    mini_site_imgs = [img for img in all_imgs if 'mini' in (img.get('src', '') or '').lower() or 'site' in (img.get('src', '') or '').lower()]
    
    print(f"Total de imagens na página: {len(all_imgs)}")
    print(f"Imagens com 'mini' ou 'site': {len(mini_site_imgs)}\n")
    
    for img in mini_site_imgs[:10]:  # Primeiras 10
        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
        print(f"Imagem: {src}")
        
        # Procurar h4 próximo
        parent = img.find_parent()
        h4_nearby = None
        for _ in range(5):  # Subir até 5 níveis
            if parent:
                h4_nearby = parent.find('h4')
                if h4_nearby:
                    break
                parent = parent.find_parent() if hasattr(parent, 'find_parent') else None
        
        if h4_nearby:
            print(f"  -> Próximo ao produto: {h4_nearby.get_text(strip=True)[:50]}")
        print()

# Procurar estrutura de portfolio items
print("\n=== ESTRUTURA DE PORTFOLIO ITEMS ===\n")
portfolio_items = soup.find_all(class_=re.compile(r'portfolio|eltdf-pli', re.I))
print(f"Portfolio items encontrados: {len(portfolio_items)}")

if portfolio_items:
    first_item = portfolio_items[0]
    print(f"\nPrimeiro item - tag: {first_item.name}, classes: {first_item.get('class', [])}")
    
    # Ver estrutura HTML
    h4_in_item = first_item.find('h4')
    imgs_in_item = first_item.find_all('img')
    
    print(f"  H4 dentro: {h4_in_item.get_text(strip=True)[:50] if h4_in_item else 'Nenhum'}")
    print(f"  Imagens dentro: {len(imgs_in_item)}")
    for img in imgs_in_item[:3]:
        src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
        print(f"    - {src[:80]}")


