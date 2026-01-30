#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Analisa a estrutura do catálogo para encontrar imagens"""

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
    
    # Ver estrutura completa
    parent = h4_elem.find_parent()
    print(f"\nParent: {parent.name if parent else 'None'}")
    if parent:
        print(f"Parent classes: {parent.get('class', [])}")
        print(f"Parent HTML (primeiros 500 chars):\n{str(parent)[:500]}")
        
        # Procurar todas as imagens na página que contêm "site" ou "mini"
        all_imgs = soup.find_all('img')
        print(f"\nTotal de imagens na página: {len(all_imgs)}")
        print("\nImagens com 'site' ou 'mini' no src:")
        for img in all_imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if src and ('mini' in src.lower() or 'site' in src.lower()):
                print(f"  - {src}")
                # Ver contexto
                img_parent = img.find_parent()
                if img_parent:
                    h4_nearby = img_parent.find('h4')
                    if h4_nearby:
                        print(f"    Próximo ao h4: {h4_nearby.get_text(strip=True)[:50]}")


