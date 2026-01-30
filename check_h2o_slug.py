#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

with open('front-end/src/data/catalog-products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

h2o = [p for p in data if p.get('sku') == '9786561190558'][0]
print(f"Titulo: {h2o.get('title')}")
print(f"Slug: {h2o.get('slug')}")
print(f"Permalink: {h2o.get('permalink')}")

