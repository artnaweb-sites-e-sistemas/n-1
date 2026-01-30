#!/usr/bin/env python3
"""
Script para extrair informações do produto do site N-1 Edições
e preparar CSV para importação no WooCommerce
"""

import requests
from bs4 import BeautifulSoup
import re
import os
import csv
from urllib.parse import urljoin, urlparse
import json

def download_file(url, folder, filename=None):
    """Baixa um arquivo e salva na pasta especificada"""
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        if filename is None:
            filename = os.path.basename(urlparse(url).path)
            if not filename or '.' not in filename:
                # Tentar extrair do Content-Disposition
                content_disp = response.headers.get('Content-Disposition', '')
                if 'filename=' in content_disp:
                    filename = content_disp.split('filename=')[1].strip('"\'')
                else:
                    filename = f"file_{hash(url) % 10000}"
        
        filepath = os.path.join(folder, filename)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return filepath
    except Exception as e:
        print(f"Erro ao baixar {url}: {e}")
        return None

def extract_product_info(url):
    """Extrai informações do produto da página"""
    print(f"Acessando: {url}")
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    product_info = {
        'title': '',
        'author': '',
        'description': '',
        'short_description': '',
        'price': '',
        'isbn': '',
        'year': '',
        'pages': '',
        'dimensions': '',
        'cover_image': '',
        'catalog_content': '',
        'catalog_images': [],
        'pdf_url': '',
        'sku': ''
    }
    
    # Extrair título
    title_elem = soup.find('h1') or soup.find(class_=re.compile(r'title|titulo', re.I))
    if title_elem:
        product_info['title'] = title_elem.get_text(strip=True)
    
    # Procurar por metadados
    meta_title = soup.find('title')
    if meta_title and not product_info['title']:
        product_info['title'] = meta_title.get_text(strip=True).replace(' - N-1 Edições', '')
    
    # Extrair descrição
    desc_elem = soup.find(class_=re.compile(r'description|descricao|content|conteudo', re.I))
    if desc_elem:
        product_info['description'] = desc_elem.get_text(strip=True)
        product_info['catalog_content'] = str(desc_elem)
    
    # Procurar por parágrafos de descrição
    paragraphs = soup.find_all('p')
    description_texts = []
    for p in paragraphs:
        text = p.get_text(strip=True)
        if len(text) > 100 and 'Este livro' in text or 'livro' in text.lower():
            description_texts.append(text)
            if not product_info['catalog_content']:
                product_info['catalog_content'] = str(p)
    
    if description_texts:
        product_info['description'] = ' '.join(description_texts[:3])
        product_info['short_description'] = description_texts[0][:200] + '...' if len(description_texts[0]) > 200 else description_texts[0]
    
    # Extrair informações técnicas (Título, Autor, Ano, etc.)
    info_section = soup.find_all(['p', 'div', 'li'])
    for elem in info_section:
        text = elem.get_text(strip=True)
        
        if 'Autor:' in text or 'autor:' in text:
            product_info['author'] = text.split(':')[-1].strip()
        elif 'ISBN:' in text or 'isbn:' in text:
            isbn = text.split(':')[-1].strip()
            product_info['isbn'] = isbn
            product_info['sku'] = isbn.replace('-', '').replace(' ', '')
        elif 'Ano:' in text or 'ano:' in text:
            product_info['year'] = text.split(':')[-1].strip()
        elif 'páginas' in text.lower() or 'pages' in text.lower():
            pages_match = re.search(r'(\d+)', text)
            if pages_match:
                product_info['pages'] = pages_match.group(1)
        elif 'Dimensões:' in text or 'dimensões:' in text:
            product_info['dimensions'] = text.split(':')[-1].strip()
        elif 'Preço:' in text or 'preço:' in text or 'R$' in text:
            price_match = re.search(r'R\$\s*([\d,]+\.?\d*)', text)
            if price_match:
                product_info['price'] = price_match.group(1).replace(',', '.')
    
    # Extrair imagem da capa
    img_elem = soup.find('img', src=re.compile(r'cover|capa|livro', re.I))
    if not img_elem:
        # Procurar qualquer imagem grande
        imgs = soup.find_all('img')
        for img in imgs:
            src = img.get('src', '')
            if src and ('cover' in src.lower() or 'capa' in src.lower() or len(src) > 50):
                img_elem = img
                break
    
    if img_elem:
        img_src = img_elem.get('src') or img_elem.get('data-src')
        if img_src:
            product_info['cover_image'] = urljoin(url, img_src)
    
    # Extrair todas as imagens internas (exceto a capa)
    all_imgs = soup.find_all('img')
    for img in all_imgs:
        img_src = img.get('src') or img.get('data-src')
        if img_src:
            full_url = urljoin(url, img_src)
            if full_url != product_info['cover_image'] and full_url not in product_info['catalog_images']:
                product_info['catalog_images'].append(full_url)
    
    # Extrair conteúdo completo (HTML)
    content_section = soup.find(class_=re.compile(r'content|conteudo|entry|post', re.I))
    if content_section:
        # Remover scripts e styles
        for script in content_section(['script', 'style']):
            script.decompose()
        
        product_info['catalog_content'] = str(content_section)
    
    # Procurar por link de PDF
    pdf_links = soup.find_all('a', href=re.compile(r'\.pdf', re.I))
    if pdf_links:
        pdf_url = pdf_links[0].get('href')
        product_info['pdf_url'] = urljoin(url, pdf_url)
    
    return product_info

def main():
    url = "https://n-1edicoes.org/publicacoes/nas-brechas-de-futuros-cancelados/"
    
    print("Extraindo informações do produto...")
    product_info = extract_product_info(url)
    
    # Criar pasta para mídias
    media_folder = "woocommerce_import_media"
    os.makedirs(media_folder, exist_ok=True)
    
    print(f"\nInformações extraídas:")
    print(f"Título: {product_info['title']}")
    print(f"Autor: {product_info['author']}")
    print(f"Preço: R$ {product_info['price']}")
    print(f"ISBN: {product_info['isbn']}")
    
    # Baixar capa
    cover_path = None
    if product_info['cover_image']:
        print(f"\nBaixando capa: {product_info['cover_image']}")
        cover_filename = f"cover_{product_info['sku'] or 'product'}.jpg"
        cover_path = download_file(product_info['cover_image'], media_folder, cover_filename)
        if cover_path:
            product_info['cover_image_local'] = cover_path
    
    # Baixar imagens internas
    catalog_images_local = []
    if product_info['catalog_images']:
        print(f"\nBaixando {len(product_info['catalog_images'])} imagens internas...")
        for i, img_url in enumerate(product_info['catalog_images'], 1):
            img_filename = f"catalog_image_{product_info['sku'] or 'product'}_{i}.jpg"
            img_path = download_file(img_url, media_folder, img_filename)
            if img_path:
                catalog_images_local.append(img_path)
    
    # Baixar PDF
    pdf_path = None
    if product_info['pdf_url']:
        print(f"\nBaixando PDF: {product_info['pdf_url']}")
        pdf_filename = f"{product_info['sku'] or 'product'}.pdf"
        pdf_path = download_file(product_info['pdf_url'], media_folder, pdf_filename)
        if pdf_path:
            product_info['pdf_local'] = pdf_path
    
    # Criar CSV para WooCommerce
    csv_filename = "woocommerce_product_import.csv"
    
    # Campos do CSV WooCommerce
    csv_data = {
        'ID': '',
        'Type': 'simple',
        'SKU': product_info['sku'] or product_info['isbn'].replace('-', '').replace(' ', ''),
        'Name': product_info['title'],
        'Published': '1',
        'Is featured?': '0',
        'Visibility in catalog': 'visible',
        'Short description': product_info['short_description'] or product_info['description'][:200] + '...' if len(product_info['description']) > 200 else product_info['description'],
        'Description': product_info['description'],
        'Date sale price starts': '',
        'Date sale price ends': '',
        'Tax status': 'taxable',
        'Tax class': '',
        'In stock?': '1',
        'Stock': '',
        'Backorders allowed?': '0',
        'Sold individually?': '0',
        'Weight (kg)': '',
        'Length (cm)': '',
        'Width (cm)': '',
        'Height (cm)': '',
        'Allow customer reviews?': '1',
        'Purchase note': '',
        'Sale price': '',
        'Regular price': product_info['price'] or '79.90',
        'Categories': 'Livros',
        'Tags': product_info['author'] or '',
        'Shipping class': '',
        'Images': cover_path if cover_path else product_info['cover_image'],
        'Download limit': '',
        'Download expiry days': '',
        'Parent': '',
        'Grouped products': '',
        'Upsells': '',
        'Cross-sells': '',
        'External URL': '',
        'Button text': '',
        'Position': '0',
        'Attribute 1 name': 'Autor',
        'Attribute 1 value(s)': product_info['author'],
        'Attribute 1 visible': '1',
        'Attribute 1 global': '0',
        'Attribute 2 name': 'ISBN',
        'Attribute 2 value(s)': product_info['isbn'],
        'Attribute 2 visible': '1',
        'Attribute 2 global': '0',
        'Attribute 3 name': 'Ano',
        'Attribute 3 value(s)': product_info['year'],
        'Attribute 3 visible': '1',
        'Attribute 3 global': '0',
        'Attribute 4 name': 'Páginas',
        'Attribute 4 value(s)': product_info['pages'],
        'Attribute 4 visible': '1',
        'Attribute 4 global': '0',
        'Attribute 5 name': 'Dimensões',
        'Attribute 5 value(s)': product_info['dimensions'],
        'Attribute 5 visible': '1',
        'Attribute 5 global': '0',
    }
    
    # Escrever CSV
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=csv_data.keys())
        writer.writeheader()
        writer.writerow(csv_data)
    
    print(f"\n[OK] CSV criado: {csv_filename}")
    print(f"[OK] Midias salvas em: {media_folder}/")
    
    # Criar arquivo JSON com informações adicionais para meta fields
    meta_info = {
        'catalog_content': product_info['catalog_content'],
        'catalog_images': [os.path.basename(img) for img in catalog_images_local] if catalog_images_local else [],
        'catalog_pdf': os.path.basename(pdf_path) if pdf_path else '',
    }
    
    with open('product_meta_fields.json', 'w', encoding='utf-8') as f:
        json.dump(meta_info, f, ensure_ascii=False, indent=2)
    
    print(f"[OK] Meta fields salvos em: product_meta_fields.json")
    print("\nPROXIMOS PASSOS:")
    print("1. Faca upload das midias da pasta 'woocommerce_import_media' para o WordPress")
    print("2. Importe o CSV 'woocommerce_product_import.csv' no WooCommerce")
    print("3. Apos importar, configure os meta fields usando 'product_meta_fields.json'")

if __name__ == "__main__":
    main()

