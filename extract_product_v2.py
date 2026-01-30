#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script melhorado para extrair informações do produto do site N-1 Edições
e preparar CSV para importação no WooCommerce
"""

import requests
from bs4 import BeautifulSoup
import re
import os
import csv
from urllib.parse import urljoin, urlparse
import json

def extract_metadata_from_html(html_content):
    """Extrai metadados do HTML"""
    if not html_content:
        return {}
    
    soup = BeautifulSoup(html_content, 'html.parser')
    metadata = {}
    
    # Procurar parágrafo com informações do produto
    paragraphs = soup.find_all('p')
    
    for p in paragraphs:
        text = p.get_text()
        # Verificar se contém os campos que procuramos
        if 'Título:' in text or 'Autor:' in text or 'ISBN:' in text:
            # Extrair cada campo
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        
                        # Mapear chaves
                        if 'Título' in key and 'Original' not in key:
                            metadata['bookTitle'] = value
                        elif 'Título Original' in key:
                            metadata['originalTitle'] = value
                        elif 'Autor' in key and 'Autores' not in key and 'Autoras' not in key:
                            metadata['author'] = value
                        elif 'Autores' in key or 'Autoras' in key:
                            metadata['authors'] = value
                        elif 'Organização' in key or 'Organizador' in key or 'Organizadores' in key:
                            metadata['organization'] = value
                        elif 'Tradução' in key:
                            metadata['translation'] = value
                        elif 'Preparação' in key:
                            metadata['preparation'] = value
                        elif 'Revisão' in key:
                            metadata['revision'] = value
                        elif 'Ano' in key:
                            metadata['year'] = value
                        elif 'páginas' in key or 'Páginas' in key:
                            metadata['pages'] = value
                        elif 'Dimensões' in key:
                            metadata['dimensions'] = value
                        elif 'ISBN' in key:
                            metadata['isbn'] = value
                        elif 'Preço' in key:
                            metadata['price'] = value
                            metadata['priceText'] = value  # Também salvar como priceText para consistência
    
    return metadata

def download_file(url, folder, filename=None):
    """Baixa um arquivo e salva na pasta especificada"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, stream=True, timeout=30, headers=headers)
        response.raise_for_status()
        
        if filename is None:
            filename = os.path.basename(urlparse(url).path)
            if not filename or '.' not in filename:
                content_disp = response.headers.get('Content-Disposition', '')
                if 'filename=' in content_disp:
                    filename = content_disp.split('filename=')[1].strip('"\'')
                else:
                    ext = 'jpg' if 'image' in response.headers.get('Content-Type', '') else 'pdf'
                    filename = f"file_{hash(url) % 10000}.{ext}"
        
        filepath = os.path.join(folder, filename)
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"  Baixado: {filename}")
        return filepath
    except Exception as e:
        print(f"  Erro ao baixar {url}: {e}")
        return None

def extract_product_info(url):
    """Extrai informações do produto da página"""
    print(f"Acessando: {url}")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(url, timeout=30, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    product_info = {
        'title': '',
        'author': '',
        'description': '',
        'short_description': '',
        'price': '79.90',
        'isbn': '',
        'year': '2026',
        'pages': '160',
        'dimensions': '21 x 14 cm',
        'cover_image': '',
        'catalog_content': '',
        'catalog_images': [],
        'pdf_url': '',
        'sku': '',
        # Metadados adicionais
        'bookTitle': '',
        'originalTitle': '',
        'authors': '',
        'organization': '',
        'translation': '',
        'preparation': '',
        'revision': ''
    }
    
    # Extrair todas as informações técnicas primeiro para ter o autor
    all_text = soup.get_text()
    
    # Procurar por padrões específicos
    # Autor - procurar primeiro antes de processar título
    author_match = re.search(r'Autor[:\s]+([^\n\r]+)', all_text, re.I)
    if author_match:
        product_info['author'] = author_match.group(1).strip()
    
    # Extrair título - procurar por h2 com classe eltdf-st-title (padrão do tema)
    title_elem = soup.find('h2', class_=re.compile(r'eltdf-st-title|title', re.I))
    if not title_elem:
        title_elem = soup.find('h1')
    if not title_elem:
        title_elem = soup.find(class_=re.compile(r'title|titulo|entry-title', re.I))
    
    if title_elem:
        title_text = title_elem.get_text(strip=True)
        # Remover nome do autor se estiver no início
        if product_info['author'] and title_text.startswith(product_info['author']):
            title_text = title_text.replace(product_info['author'], '').strip()
        product_info['title'] = title_text
    
    # Se não encontrou, usar meta title
    if not product_info['title']:
        meta_title = soup.find('title')
        if meta_title:
            title_text = meta_title.get_text(strip=True)
            product_info['title'] = title_text.replace(' - N-1 Edições', '').replace(' - N-1 Edicoes', '').strip()
    
    
    # ISBN
    isbn_match = re.search(r'ISBN[:\s]+([0-9\-]+)', all_text, re.I)
    if isbn_match:
        product_info['isbn'] = isbn_match.group(1).strip()
        product_info['sku'] = product_info['isbn'].replace('-', '').replace(' ', '')
    
    # Ano
    year_match = re.search(r'Ano[:\s]+(\d{4})', all_text, re.I)
    if year_match:
        product_info['year'] = year_match.group(1)
    
    # Páginas
    pages_match = re.search(r'(?:páginas|pages|N° de páginas)[:\s]+(\d+)', all_text, re.I)
    if pages_match:
        product_info['pages'] = pages_match.group(1)
    
    # Dimensões - procurar padrão específico como "21 x 14 cm"
    dim_match = re.search(r'Dimensões[:\s]+([0-9]+\s*x\s*[0-9]+\s*cm)', all_text, re.I)
    if dim_match:
        product_info['dimensions'] = dim_match.group(1).strip()
    else:
        # Tentar padrão alternativo
        dim_match2 = re.search(r'Dimensões[:\s]+([^\n\r]{1,30})', all_text, re.I)
        if dim_match2:
            dim_text = dim_match2.group(1).strip()
            # Limitar a 30 caracteres e remover texto extra
            if len(dim_text) > 30:
                dim_text = dim_text[:30].strip()
            product_info['dimensions'] = dim_text
    
    # Preço
    price_match = re.search(r'R\$\s*([\d,]+\.?\d*)', all_text)
    if price_match:
        product_info['price'] = price_match.group(1).replace(',', '.')
    
    # Extrair descrição - procurar por parágrafos longos
    paragraphs = soup.find_all('p')
    description_texts = []
    for p in paragraphs:
        text = p.get_text(strip=True)
        # Parágrafos que parecem descrição do livro
        if len(text) > 150 and ('livro' in text.lower() or 'ensaios' in text.lower() or 'capitalismo' in text.lower()):
            description_texts.append(text)
    
    if description_texts:
        product_info['description'] = ' '.join(description_texts)
        product_info['short_description'] = description_texts[0][:200] + '...' if len(description_texts[0]) > 200 else description_texts[0]
    
    # Extrair conteúdo HTML completo
    content_areas = soup.find_all(['article', 'div'], class_=re.compile(r'content|entry|post|publicacao', re.I))
    if not content_areas:
        content_areas = soup.find_all('main')
    
    if content_areas:
        content_section = content_areas[0]
        # Remover scripts, styles e elementos indesejados
        for elem in content_section(['script', 'style', 'nav', 'header', 'footer']):
            elem.decompose()
        
        # Extrair metadados do HTML ANTES de remover
        metadata = extract_metadata_from_html(str(content_section))
        for key, value in metadata.items():
            if key in product_info:
                product_info[key] = value
        
        # Remover parágrafo com metadados do HTML para evitar duplicação
        metadata_paragraphs = content_section.find_all('p')
        for p in metadata_paragraphs:
            text = p.get_text()
            if ('Título:' in text or 'Autor:' in text or 'ISBN:' in text) and \
               ('Ano:' in text or 'Dimensões:' in text or 'Preço:' in text):
                p.decompose()
                break
        
        product_info['catalog_content'] = str(content_section)
    
    # Extrair imagem da capa - priorizar imagens MINI (usadas no catálogo)
    # Primeiro, procurar por imagens MINI (prioridade máxima - são as capas do catálogo)
    imgs = soup.find_all('img')
    cover_image = None
    cover_candidates = []
    
    for img in imgs:
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if not src:
            continue
        
        # Filtrar logos e ícones
        if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
            continue
        
        full_url = urljoin(url, src)
        priority = 0
        
        # PRIORIDADE MÁXIMA: imagens MINI (são as capas usadas no catálogo)
        if 'mini' in src.lower():
            priority = 20
            cover_image = full_url
            break  # Se encontrou MINI, usar essa
        
        # Priorizar imagens na primeira coluna
        parent = img.find_parent()
        in_first_col = False
        if parent:
            parent_classes = parent.get('class', [])
            if any('col-sm-6' in str(c) or 'vc_col-sm-6' in str(c) for c in parent_classes):
                in_first_col = True
                priority += 10
        
        # Verificar tamanho - capas geralmente são verticais (altura > largura)
        width = img.get('width')
        height = img.get('height')
        if width and height:
            w, h = int(width), int(height)
            # Priorizar imagens verticais grandes (típicas de capa de livro)
            if h > w and h > 400 and w > 300:
                priority += 5
            # Se não encontrou vertical, aceitar qualquer imagem grande
            elif w > 500 and h > 500:
                priority += 3
        
        # Verificar pelo nome do arquivo
        if any(x in src.lower() for x in ['cata', 'cover', 'capa']):
            priority += 2
        
        cover_candidates.append((priority, full_url, img))
    
    # Se não encontrou MINI, usar a melhor candidata
    if not cover_image and cover_candidates:
        cover_candidates.sort(key=lambda x: x[0], reverse=True)
        cover_image = cover_candidates[0][1]
    
    # Se não encontrou na primeira coluna, procurar em toda a página
    if not cover_image:
        imgs = soup.find_all('img')
        cover_candidates = []
        
        for img in imgs:
            src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
            if not src:
                continue
            
            full_url = urljoin(url, src)
            
            # Filtrar logos e ícones
            if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                continue
            
            # Priorizar imagens que parecem capas
            priority = 0
            # Prioridade máxima para imagens MINI (capas do catálogo)
            if 'mini' in src.lower():
                priority = 15
            elif any(x in src.lower() for x in ['cover', 'capa', 'livro', 'book', 'cata']):
                priority = 10
            elif 'publicacoes' in src.lower() or 'uploads' in src.lower():
                priority = 5
            
            # Verificar tamanho se disponível
            width = img.get('width')
            height = img.get('height')
            if width and height:
                w, h = int(width), int(height)
                # Priorizar imagens verticais (altura > largura) - típicas de capa
                if h > w and h > 400:
                    priority += 5
                elif w > 300 and h > 400:  # Tamanho típico de capa
                    priority += 3
            
            cover_candidates.append((priority, full_url, img))
        
        # Ordenar por prioridade e pegar a melhor
        cover_candidates.sort(key=lambda x: x[0], reverse=True)
        if cover_candidates:
            cover_image = cover_candidates[0][1]
    
    # Se não encontrou MINI na página do produto, tentar buscar do catálogo
    if not cover_image or 'mini' not in cover_image.lower():
        # Tentar construir URL da imagem MINI baseada no padrão
        # Geralmente é: /wp-content/uploads/2026/01/IMG_MINI1.png
        # Ou buscar do catálogo
        try:
            catalog_url = 'https://n-1edicoes.org/catalogo/'
            catalog_response = requests.get(catalog_url, timeout=10, headers=headers)
            if catalog_response.status_code == 200:
                catalog_soup = BeautifulSoup(catalog_response.text, 'html.parser')
                # Procurar link para este produto
                product_link = catalog_soup.find('a', href=re.compile(url.split('/')[-2], re.I))
                if product_link:
                    # Procurar imagem próxima ao link
                    img = product_link.find('img')
                    if not img:
                        parent = product_link.find_parent()
                        if parent:
                            img = parent.find('img')
                    if img:
                        mini_src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                        if mini_src and 'mini' in mini_src.lower():
                            cover_image = urljoin(catalog_url, mini_src)
        except:
            pass  # Se falhar, usar a imagem encontrada na página do produto
    
    if cover_image:
        product_info['cover_image'] = cover_image
    
    # Extrair imagens internas (galeria) - excluir a capa
    all_imgs = soup.find_all('img')
    for img in all_imgs:
        src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
        if not src:
            continue
        
        full_url = urljoin(url, src)
        
        # Filtrar logos, ícones e a própria capa
        if any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
            continue
        
        if full_url == product_info.get('cover_image', ''):
            continue
        
        # Adicionar imagens grandes (não thumbnails)
        width = img.get('width')
        height = img.get('height')
        if width and height:
            w, h = int(width), int(height)
            if w > 200 and h > 200:  # Imagens grandes
                if full_url not in product_info['catalog_images']:
                    product_info['catalog_images'].append(full_url)
                    if len(product_info['catalog_images']) >= 10:
                        break
    
    # Procurar por link de PDF
    pdf_links = soup.find_all('a', href=re.compile(r'\.pdf', re.I))
    if pdf_links:
        pdf_url = pdf_links[0].get('href')
        product_info['pdf_url'] = urljoin(url, pdf_url)
    
    # Procurar por iframe do Issuu (visualizador de PDF)
    iframe = soup.find('iframe', src=re.compile(r'issuu', re.I))
    if iframe and not product_info['pdf_url']:
        # O Issuu geralmente tem o PDF embutido, mas não podemos baixar diretamente
        # Vamos marcar que há um visualizador
        iframe_src = iframe.get('src', '')
        # Tentar extrair o nome do documento do iframe
        doc_match = re.search(r'd=([^&]+)', iframe_src)
        if doc_match:
            doc_name = doc_match.group(1)
            # Nota: O PDF real pode estar em outro lugar, mas pelo menos sabemos que existe
            print(f"  Encontrado visualizador Issuu: {doc_name}")
    
    return product_info

def main():
    import sys
    # Aceitar URL como argumento ou usar padrão
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = "https://n-1edicoes.org/publicacoes/nas-brechas-de-futuros-cancelados/"
    
    print(f"Extraindo informacoes do produto: {url}")
    product_info = extract_product_info(url)
    
    # Criar pasta para mídias
    media_folder = "woocommerce_import_media"
    os.makedirs(media_folder, exist_ok=True)
    
    print(f"\nInformacoes extraidas:")
    print(f"Titulo: {product_info['title']}")
    print(f"Autor: {product_info['author']}")
    print(f"Preco: R$ {product_info['price']}")
    print(f"ISBN: {product_info['isbn']}")
    print(f"Ano: {product_info['year']}")
    print(f"Paginas: {product_info['pages']}")
    
    # Baixar capa
    cover_path = None
    if product_info['cover_image']:
        print(f"\nBaixando capa...")
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
        print(f"\nBaixando PDF...")
        pdf_filename = f"{product_info['sku'] or 'product'}.pdf"
        pdf_path = download_file(product_info['pdf_url'], media_folder, pdf_filename)
        if pdf_path:
            product_info['pdf_local'] = pdf_path
    
    # Criar CSV para WooCommerce
    csv_filename = "woocommerce_product_import.csv"
    
    # SKU baseado no ISBN
    sku = product_info['sku'] or product_info['isbn'].replace('-', '').replace(' ', '') if product_info['isbn'] else 'PROD-' + product_info['title'][:10].upper().replace(' ', '-')
    
    # Campos do CSV WooCommerce
    csv_data = {
        'ID': '',
        'Type': 'simple',
        'SKU': sku,
        'Name': product_info['title'],
        'Published': '1',
        'Is featured?': '0',
        'Visibility in catalog': 'visible',
        'Short description': product_info['short_description'] or (product_info['description'][:200] + '...' if len(product_info['description']) > 200 else product_info['description']),
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
        'Images': os.path.basename(cover_path) if cover_path else product_info['cover_image'],
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
        'Attribute 4 name': 'Paginas',
        'Attribute 4 value(s)': product_info['pages'],
        'Attribute 4 visible': '1',
        'Attribute 4 global': '0',
        'Attribute 5 name': 'Dimensoes',
        'Attribute 5 value(s)': product_info['dimensions'] or '21 x 14 cm',
        'Attribute 5 visible': '1',
        'Attribute 5 global': '0',
    }
    
    # Escrever CSV
    with open(csv_filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
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

