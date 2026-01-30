#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar imagens para versões com mockup quando disponíveis
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import os
import sys
from urllib.parse import urljoin

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def download_file(url, folder, filename=None):
    """Baixa um arquivo e salva na pasta especificada"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, stream=True, timeout=30, headers=headers)
        response.raise_for_status()
        
        if filename is None:
            from urllib.parse import urlparse
            filename = os.path.basename(urlparse(url).path)
            if not filename or '.' not in filename:
                ext = 'jpg' if 'image' in response.headers.get('Content-Type', '') else 'png'
                filename = f"cover_{hash(url) % 10000}.{ext}"
        
        os.makedirs(folder, exist_ok=True)
        filepath = os.path.join(folder, filename)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return filepath
    except Exception as e:
        return None

def extract_best_image_from_html(html_content):
    """Extrai a melhor imagem (priorizando mockup) do HTML do catalogContent"""
    if not html_content:
        return None
    
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        imgs = soup.find_all('img')
        
        if not imgs:
            return None
        
        # Coletar todas as imagens com prioridade
        candidates = []
        
        for img in imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if not src:
                continue
            
            # Filtrar logos e ícones
            if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                continue
            
            priority = 0
            src_lower = src.lower()
            
            # Máxima prioridade para mockup (imagens 3D/com efeito)
            if 'mockup' in src_lower:
                priority = 100
            # Alta prioridade para capa/frente
            elif any(x in src_lower for x in ['cover', 'capa', 'frente']):
                priority = 50
            # Prioridade média para imagens grandes
            else:
                width = img.get('width')
                height = img.get('height')
                if width and height:
                    w, h = int(width), int(height)
                    if w > 300 and h > 400:
                        priority = 25
            
            if priority > 0:
                candidates.append((priority, src))
        
        # Ordenar por prioridade e retornar a melhor
        if candidates:
            candidates.sort(key=lambda x: x[0], reverse=True)
            return candidates[0][1]
        
        # Fallback: primeira imagem válida
        for img in imgs:
            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
            if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                return src
    except:
        pass
    
    return None

def update_to_mockup_images():
    """Atualiza imagens para versões com mockup quando disponíveis"""
    catalog_file = 'front-end/src/data/catalog-products.json'
    images_dir = 'front-end/public/images'
    
    # Carregar catálogo
    if not os.path.exists(catalog_file):
        print(f"Arquivo {catalog_file} nao encontrado!")
        return
    
    with open(catalog_file, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"Total de produtos no catalogo: {len(catalog)}")
    print(f"Atualizando para imagens com mockup quando disponivel...\n")
    
    updated = 0
    skipped = 0
    errors = 0
    
    for i, product in enumerate(catalog, 1):
        title = product.get('title', '')
        sku = product.get('sku', 'product')
        current_image = product.get('image', '')
        catalog_content = product.get('catalogContent', '')
        
        print(f"[{i}/{len(catalog)}] {title[:50]}...")
        
        # Extrair melhor imagem do catalogContent
        best_image_url = extract_best_image_from_html(catalog_content)
        
        if not best_image_url:
            print(f"  [!] Nenhuma imagem encontrada no catalogContent")
            skipped += 1
            continue
        
        # Garantir URL completa
        if not best_image_url.startswith('http'):
            best_image_url = urljoin('https://n-1edicoes.org', best_image_url)
        
        # Verificar se já é a imagem atual (comparar URLs)
        current_image_filename = os.path.basename(current_image) if current_image else ''
        best_image_filename = os.path.basename(best_image_url)
        
        # Se a imagem atual já contém "mockup" e a nova também, verificar se é diferente
        current_has_mockup = 'mockup' in current_image.lower() if current_image else False
        best_has_mockup = 'mockup' in best_image_url.lower()
        
        # Se já tem mockup e a nova também tem, verificar se é a mesma
        if current_has_mockup and best_has_mockup:
            # Comparar nomes de arquivo (sem extensão)
            current_base = os.path.splitext(current_image_filename)[0] if current_image_filename else ''
            best_base = os.path.splitext(best_image_filename)[0]
            if current_base and best_base and current_base in best_base or best_base in current_base:
                print(f"  [>] Ja tem mockup, pulando")
                skipped += 1
                continue
        
        # Se a nova imagem tem mockup e a atual não, ou se a nova tem maior prioridade
        if best_has_mockup and not current_has_mockup:
            print(f"  [*] Mockup encontrado: {best_image_url[:60]}...")
        else:
            print(f"  [*] Melhor imagem encontrada: {best_image_url[:60]}...")
        
        # Baixar nova imagem
        cover_filename = f"cover_{sku}.jpg"
        cover_image_local = download_file(best_image_url, images_dir, cover_filename)
        
        if not cover_image_local:
            print(f"  [X] Falha ao baixar imagem")
            errors += 1
            continue
        
        # Atualizar produto
        image_path = f"/images/{cover_filename}"
        product['image'] = image_path
        if product.get('images'):
            product['images'][0] = image_path
        else:
            product['images'] = [image_path]
        
        print(f"  [+] Imagem atualizada: {cover_filename}")
        updated += 1
    
    # Salvar catálogo atualizado
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Atualizacao concluida!")
    print(f"  [+] Atualizados: {updated}")
    print(f"  [>] Pulados: {skipped}")
    print(f"  [X] Erros: {errors}")
    print(f"{'='*60}\n")

if __name__ == '__main__':
    update_to_mockup_images()


