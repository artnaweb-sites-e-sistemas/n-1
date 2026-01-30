#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para revisar produtos importados um por um
Verifica: capas, metadados, imagens internas, conteúdo, etc.
"""

import json
import os
import sys
import requests
from bs4 import BeautifulSoup
from difflib import SequenceMatcher
from urllib.parse import urljoin

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def normalize_title(title):
    """Normaliza o título para comparação"""
    if not title:
        return ""
    normalized = title.lower()
    normalized = normalized.replace('``', '"').replace("''", '"')
    normalized = normalized.replace('—', '-').replace('–', '-')
    normalized = normalized.replace(':', '').replace(';', '')
    normalized = normalized.replace('?', '').replace('!', '')
    normalized = normalized.replace('.', '').strip()
    return normalized

def find_product_in_structure(title, structure):
    """Encontra produto na estrutura correta"""
    for item in structure:
        if normalize_title(item.get('title', '')) == normalize_title(title):
            return item
    return None

def check_image_exists(image_path):
    """Verifica se a imagem existe localmente"""
    if not image_path:
        return False
    if image_path.startswith('/images/'):
        local_path = f"front-end/public{image_path}"
        return os.path.exists(local_path)
    return True  # URLs externas assumimos que existem

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

def review_product(product, structure_item, idx, total):
    """Revisa um produto individual"""
    issues = []
    fixes = []
    
    title = product.get('title', '')
    print(f"\n[{idx}/{total}] {title[:70]}")
    print("-" * 80)
    
    # 1. Verificar capa
    current_image = product.get('image', '')
    expected_cover = structure_item.get('cover_image', '') if structure_item else ''
    
    if not current_image:
        issues.append("❌ Capa principal ausente")
    elif not current_image.startswith('/images/'):
        issues.append(f"⚠️  Capa não está local: {current_image}")
    elif not check_image_exists(current_image):
        issues.append(f"❌ Imagem local não encontrada: {current_image}")
        if expected_cover:
            fixes.append(('download_cover', expected_cover))
    elif structure_item and expected_cover:
        # Verificar se a capa está correta comparando com a estrutura
        if expected_cover and not current_image.startswith('/images/'):
            # Precisa baixar a capa correta
            fixes.append(('download_cover', expected_cover))
    
    # 2. Verificar SKU
    sku = product.get('sku', '')
    if not sku:
        issues.append("❌ SKU ausente")
    elif len(sku) < 10:
        issues.append(f"⚠️  SKU muito curto: {sku}")
    
    # 3. Verificar metadados essenciais
    required_metadata = ['bookTitle', 'authors', 'year', 'isbn', 'price']
    missing_metadata = []
    for field in required_metadata:
        value = product.get(field, '')
        if not value or (isinstance(value, str) and value.strip() == ''):
            missing_metadata.append(field)
    
    if missing_metadata:
        issues.append(f"⚠️  Metadados faltando: {', '.join(missing_metadata)}")
    
    # 4. Verificar preço
    price = product.get('price', 0)
    if not price or price == 0:
        issues.append("⚠️  Preço não definido ou zero")
    
    # 5. Verificar conteúdo do catálogo
    catalog_content = product.get('catalogContent', '')
    if not catalog_content or len(catalog_content) < 100:
        issues.append("⚠️  Conteúdo do catálogo muito curto ou ausente")
    
    # 6. Verificar imagens internas
    catalog_images = product.get('catalogImages', [])
    if not catalog_images:
        issues.append("⚠️  Nenhuma imagem interna encontrada")
    else:
        missing_images = []
        for img in catalog_images:
            if img.startswith('/images/') and not check_image_exists(img):
                missing_images.append(img)
        if missing_images:
            issues.append(f"⚠️  {len(missing_images)} imagem(ns) interna(s) não encontrada(s)")
    
    # 7. Verificar imagens no array images
    images = product.get('images', [])
    if not images:
        issues.append("⚠️  Array 'images' vazio")
    elif len(images) == 0:
        issues.append("⚠️  Array 'images' vazio")
    
    # 8. Verificar slug
    slug = product.get('slug', '')
    if not slug:
        issues.append("❌ Slug ausente")
    
    # 9. Verificar se há metadados duplicados no HTML
    if catalog_content:
        soup = BeautifulSoup(catalog_content, 'html.parser')
        text = soup.get_text()
        if 'Título:' in text and 'Autor:' in text and product.get('bookTitle'):
            issues.append("⚠️  Possível duplicação de metadados no HTML")
    
    # Exibir issues
    if issues:
        print("  PROBLEMAS ENCONTRADOS:")
        for issue in issues:
            print(f"    {issue}")
    else:
        print("  ✓ Produto OK")
    
    # Preparar fixes
    if fixes:
        print("  CORREÇÕES NECESSÁRIAS:")
        for fix_type, fix_data in fixes:
            if fix_type == 'download_cover':
                print(f"    - Baixar capa: {fix_data}")
    
    return {
        'product': product,
        'issues': issues,
        'fixes': fixes,
        'structure_item': structure_item
    }

def apply_fixes(review_result):
    """Aplica correções quando possível"""
    product = review_result['product']
    fixes = review_result['fixes']
    structure_item = review_result['structure_item']
    
    updated = False
    
    for fix_type, fix_data in fixes:
        if fix_type == 'download_cover':
            # Baixar capa correta
            sku = product.get('sku', 'product')
            images_dir = "front-end/public/images"
            cover_filename = f"cover_{sku}.jpg"
            
            downloaded = download_file(fix_data, images_dir, cover_filename)
            if downloaded:
                product['image'] = f"/images/{cover_filename}"
                if product.get('images') and len(product['images']) > 0:
                    product['images'][0] = f"/images/{cover_filename}"
                updated = True
                print(f"    ✓ Capa baixada: {cover_filename}")
    
    return updated

def main():
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    correct_structure_file = 'catalog_correct_structure.json'
    
    print("="*80)
    print("REVISÃO DE PRODUTOS IMPORTADOS")
    print("="*80)
    
    # Carregar produtos importados
    print("\nCarregando produtos importados...")
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    # Carregar estrutura correta
    print("Carregando estrutura correta...")
    with open(correct_structure_file, 'r', encoding='utf-8') as f:
        correct_structure = json.load(f)
    
    print(f"\nTotal de produtos para revisar: {len(imported_products)}")
    print("="*80)
    
    # Revisar cada produto
    review_results = []
    total_issues = 0
    products_with_issues = 0
    products_ok = 0
    
    for idx, product in enumerate(imported_products, 1):
        title = product.get('title', '')
        structure_item = find_product_in_structure(title, correct_structure)
        
        result = review_product(product, structure_item, idx, len(imported_products))
        review_results.append(result)
        
        if result['issues']:
            products_with_issues += 1
            total_issues += len(result['issues'])
        else:
            products_ok += 1
    
    # Aplicar correções automáticas
    print("\n" + "="*80)
    print("APLICANDO CORREÇÕES AUTOMÁTICAS")
    print("="*80)
    
    fixed_count = 0
    for result in review_results:
        if result['fixes']:
            if apply_fixes(result):
                fixed_count += 1
    
    # Salvar produtos atualizados
    if fixed_count > 0:
        print(f"\nSalvando {fixed_count} produto(s) corrigido(s)...")
        with open(catalog_products_file, 'w', encoding='utf-8') as f:
            json.dump(imported_products, f, indent=2, ensure_ascii=False)
    
    # Resumo
    print("\n" + "="*80)
    print("RESUMO DA REVISÃO")
    print("="*80)
    print(f"✓ Produtos revisados: {len(imported_products)}")
    print(f"✓ Produtos OK: {products_ok}")
    print(f"⚠️  Produtos com problemas: {products_with_issues}")
    print(f"❌ Total de problemas encontrados: {total_issues}")
    print(f"🔧 Correções aplicadas: {fixed_count}")
    print("="*80)
    
    # Listar produtos com problemas mais graves
    if products_with_issues > 0:
        print("\nPRODUTOS COM PROBLEMAS CRÍTICOS:")
        print("-" * 80)
        critical_count = 0
        for result in review_results:
            critical_issues = [i for i in result['issues'] if '❌' in i]
            if critical_issues:
                critical_count += 1
                print(f"\n{result['product'].get('title', 'Sem título')[:70]}")
                for issue in critical_issues:
                    print(f"  {issue}")
        
        if critical_count == 0:
            print("  Nenhum problema crítico encontrado!")

if __name__ == "__main__":
    main()

