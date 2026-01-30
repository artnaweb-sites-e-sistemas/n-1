#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("PRIMEIROS 20 PRODUTOS (NA ORDEM CORRETA):")
print("=" * 60)
for i, p in enumerate(data[:20]):
    title = p.get('title', 'Sem título')[:55]
    print(f"{i+1:2}. {title}")

print("\n" + "=" * 60)
print(f"Total de produtos: {len(data)}")

