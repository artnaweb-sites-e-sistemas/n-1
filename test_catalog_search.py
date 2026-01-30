#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Teste para ver como o catálogo está estruturado"""

import requests
from bs4 import BeautifulSoup
import re

catalog_url = 'https://n-1edicoes.org/catalogo/'
headers = {'User-Agent': 'Mozilla/5.0'}

response = requests.get(catalog_url, timeout=10, headers=headers)
soup = BeautifulSoup(response.text, 'html.parser')

# Procurar por "Nas brechas"
h4_elem = soup.find('h4', string=re.compile('Nas brechas', re.I))
if h4_elem:
    print("H4 encontrado:", h4_elem.get_text(strip=True))
    parent = h4_elem.find_parent('a')
    if not parent:
        parent = h4_elem.find_parent()
    
    if parent:
        print("\nParent tag:", parent.name)
        imgs = parent.find_all('img')
        print(f"Imagens encontradas: {len(imgs)}")
        for i, img in enumerate(imgs):
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            print(f"  [{i+1}] {src}")
else:
    print("H4 não encontrado")
    # Procurar todos os h4
    all_h4 = soup.find_all('h4')
    print(f"\nTotal de h4 encontrados: {len(all_h4)}")
    for h4 in all_h4[:5]:
        print(f"  - {h4.get_text(strip=True)[:50]}")


