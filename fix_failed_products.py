#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Corrigir produtos que falharam devido ao erro de conversão de preço"""

import json
import re
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def parse_price(price_str):
    """Converte preço brasileiro (R$ 84,90) para float"""
    if not price_str:
        return 0.0
    if isinstance(price_str, (int, float)):
        return float(price_str)
    # Remover R$, espaços e converter vírgula para ponto
    price_clean = str(price_str).replace('R$', '').replace(' ', '').replace(',', '.').strip()
    try:
        return float(price_clean)
    except (ValueError, TypeError):
        return 0.0

# URLs dos produtos que falharam (lote 11-20, exceto o que funcionou)
failed_urls = [
    "https://n-1edicoes.org/publicacoes/a-comunidade-terrestre/",
    "https://n-1edicoes.org/publicacoes/sobre-a-pintura/",
    "https://n-1edicoes.org/publicacoes/o-menino-e-o-gato-na-floresta-de-aco/",
    "https://n-1edicoes.org/publicacoes/animacidades/",
    "https://n-1edicoes.org/publicacoes/o-desencadeamento-do-mundo/",
    "https://n-1edicoes.org/publicacoes/cartas-a-um-velho-terrapeuta/",
    "https://n-1edicoes.org/publicacoes/ivone-princesa-da-borgonha/",
    "https://n-1edicoes.org/publicacoes/a-ultima-guerra/",
    "https://n-1edicoes.org/publicacoes/futuros-menores/",
]

print("Para reprocessar os produtos que falharam, execute:")
print("  python import_all_products.py 10")
print("\nO script continuara automaticamente e processara os produtos restantes.")
print("Os produtos que falharam anteriormente serao processados novamente.")


