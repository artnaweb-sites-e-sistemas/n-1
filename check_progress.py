#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import os

if os.path.exists('import_progress.json'):
    with open('import_progress.json', 'r', encoding='utf-8') as f:
        progress = json.load(f)
    print(f"Ultimo produto processado: {progress.get('last_processed_idx', 0)}")
    print(f"Total processados: {progress.get('total_processed', 0)}")
    print(f"Total erros: {progress.get('total_errors', 0)}")
else:
    print("Nenhum progresso encontrado. Comecando do zero.")


