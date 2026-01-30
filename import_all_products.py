#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para importar todos os produtos do catálogo N-1 Edições
Processa em lotes e salva o progresso
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import os
import time
import sys
from urllib.parse import urljoin

# Configurar encoding UTF-8 para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def get_all_product_links(catalog_url):
    """Extrai todos os links de produtos do catálogo"""
    print(f"Acessando catálogo: {catalog_url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(catalog_url, timeout=30, headers=headers)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Procurar todos os links que apontam para /publicacoes/
    links = soup.find_all('a', href=re.compile(r'/publicacoes/', re.I))
    
    product_links = []
    seen = set()
    
    for link in links:
        href = link.get('href', '')
        if href and '/publicacoes/' in href:
            # Normalizar URL
            if href.startswith('/'):
                full_url = urljoin(catalog_url, href)
            else:
                full_url = href
            
            # Remover duplicatas
            if full_url not in seen:
                seen.add(full_url)
                product_links.append(full_url)
    
    print(f"Encontrados {len(product_links)} produtos no catálogo")
    return product_links

def extract_metadata_from_html(html_content):
    """Extrai metadados do HTML"""
    if not html_content:
        return {}
    
    soup = BeautifulSoup(html_content, 'html.parser')
    metadata = {}
    
    paragraphs = soup.find_all('p')
    for p in paragraphs:
        text = p.get_text()
        if 'Título:' in text or 'Autor:' in text or 'ISBN:' in text:
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].strip()
                        value = parts[1].strip()
                        
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
        print(f"    [X] Erro ao baixar {url}: {str(e)[:50]}")
        return None

def get_product_image_from_catalog(catalog_url, product_url, product_title=None):
    """Busca a imagem MINI do produto no catálogo"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(catalog_url, timeout=10, headers=headers)
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extrair slug do produto
            slug = product_url.split('/')[-2] if product_url.endswith('/') else product_url.split('/')[-1]
            
            # Normalizar título para busca (remover caracteres especiais)
            search_words = []
            if product_title:
                search_title = product_title.lower()
                search_title = re.sub(r'[^\w\s]', '', search_title)
                search_words = search_title.split()[:5]  # Primeiras 5 palavras
            
            # ESTRATÉGIA CORRETA: Buscar dentro do mesmo article (portfolio item)
            # Cada produto está em um article com classe eltdf-pl-item
            # Dentro desse article há o h4 (título) e a img (capa)
            
            # Procurar por h4 com o título do produto
            if product_title and search_words:
                h4_elem = None
                for h4 in soup.find_all('h4', class_=re.compile(r'eltdf-pli-title', re.I)):
                    h4_text = h4.get_text(strip=True).lower()
                    # Verificar se contém palavras-chave do título
                    if any(word in h4_text for word in search_words if len(word) > 3):
                        h4_elem = h4
                        break
                
                if h4_elem:
                    # Procurar o article que contém o h4 (portfolio item)
                    article = h4_elem.find_parent('article', class_=re.compile(r'eltdf-pl-item|portfolio-item', re.I))
                    
                    if article:
                        # Buscar TODAS as imagens dentro do article
                        imgs = article.find_all('img')
                        
                        # Priorizar imagens MINI ou site (capas do catálogo)
                        for img in imgs:
                            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                            if src:
                                src_lower = src.lower()
                                # Filtrar logos e ícones
                                if any(x in src_lower for x in ['logo', 'icon', 'avatar', 'favicon']):
                                    continue
                                if 'mini' in src_lower or 'site' in src_lower:
                                    return urljoin(catalog_url, src)
                        
                        # Se não encontrou MINI, pegar a primeira imagem válida (geralmente mockup)
                        for img in imgs:
                            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                            if src:
                                src_lower = src.lower()
                                # Filtrar logos e ícones
                                if any(x in src_lower for x in ['logo', 'icon', 'avatar', 'favicon']):
                                    continue
                                return urljoin(catalog_url, src)
            
            # Fallback: procurar link que contenha o slug
            product_link = soup.find('a', href=re.compile(slug, re.I))
            if product_link:
                img = product_link.find('img')
                if not img:
                    parent = product_link.find_parent()
                    if parent:
                        img = parent.find('img')
                if img:
                    src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                    if src:
                        return urljoin(catalog_url, src)
            
            # Último fallback: procurar qualquer link que contenha palavras do título
            if search_words:
                for link in soup.find_all('a', href=re.compile(r'/publicacoes/', re.I)):
                    link_text = link.get_text(strip=True).lower()
                    if any(word in link_text for word in search_words if len(word) > 3):
                        img = link.find('img')
                        if not img:
                            parent = link.find_parent()
                            if parent:
                                img = parent.find('img')
                        if img:
                            src = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy-src', '')
                            if src:
                                return urljoin(catalog_url, src)
    except Exception as e:
        print(f"    [X] Erro ao buscar imagem no catalogo: {str(e)[:50]}")
    return None

def extract_product_info(url, catalog_url='https://n-1edicoes.org/catalogo/'):
    """Extrai informações do produto (versão simplificada do extract_product_v2.py)"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, timeout=30, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        all_text = soup.get_text()
        
        product_info = {
            'title': '',
            'author': '',
            'description': '',
            'price': '',
            'isbn': '',
            'sku': '',
            'cover_image': '',
            'catalog_content': '',
            'catalog_images': [],
            'catalog_pdf': '',
            'url': url
        }
        
        # Título
        title_elem = soup.find('h2', class_=re.compile(r'eltdf-st-title', re.I))
        if not title_elem:
            title_elem = soup.find('h1')
        if title_elem:
            product_info['title'] = title_elem.get_text(strip=True)
        
        if not product_info['title']:
            meta_title = soup.find('title')
            if meta_title:
                product_info['title'] = meta_title.get_text(strip=True).replace(' - N-1 Edições', '').replace(' - N-1 Edicoes', '').strip()
        
        # Autor
        author_match = re.search(r'Autor[:\s]+([^\n\r]+)', all_text, re.I)
        if author_match:
            product_info['author'] = author_match.group(1).strip()
        
        # ISBN - buscar no texto e no HTML
        isbn_match = re.search(r'ISBN[:\s]+([0-9\-\s]+)', all_text, re.I)
        if not isbn_match:
            # Tentar buscar no HTML também
            isbn_elem = soup.find(string=re.compile(r'ISBN', re.I))
            if isbn_elem:
                parent_text = isbn_elem.find_parent().get_text() if hasattr(isbn_elem, 'find_parent') else str(isbn_elem)
                isbn_match = re.search(r'ISBN[:\s]+([0-9\-\s]+)', parent_text, re.I)
        
        if isbn_match:
            isbn_raw = isbn_match.group(1).strip()
            product_info['isbn'] = isbn_raw
            # Limpar e normalizar SKU (remover hífens, espaços, caracteres especiais)
            sku_clean = re.sub(r'[^\d]', '', isbn_raw)
            # Garantir que tenha pelo menos 13 dígitos (ISBN-13)
            if len(sku_clean) >= 13:
                product_info['sku'] = sku_clean
            elif len(sku_clean) >= 10:
                # Se tiver 10 dígitos, pode ser ISBN-10, mas vamos usar mesmo assim
                product_info['sku'] = sku_clean
            else:
                # Se muito curto, tentar buscar no link da loja
                loja_link = soup.find('a', href=re.compile(r'loja\.n-1edicoes\.org', re.I))
                if loja_link:
                    href = loja_link.get('href', '')
                    sku_from_url = re.search(r'/(\d{13})', href)
                    if sku_from_url:
                        product_info['sku'] = sku_from_url.group(1)
                    else:
                        product_info['sku'] = sku_clean  # Usar mesmo assim
                else:
                    product_info['sku'] = sku_clean
        
        # Preço
        price_match = re.search(r'R\$\s*([\d,]+\.?\d*)', all_text)
        if price_match:
            product_info['price'] = price_match.group(1).replace(',', '.')
        
        # Descrição
        paragraphs = soup.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            if len(text) > 150:
                product_info['description'] = text
                break
        
        # Imagem da capa - buscar do catálogo primeiro (com título para melhor matching)
        cover_image = get_product_image_from_catalog(catalog_url, url, product_info.get('title'))
        
        # Se não encontrou no catálogo, procurar na página
        if not cover_image:
            first_col = soup.find('div', class_=re.compile(r'col-sm-6|vc_col-sm-6', re.I))
            if first_col:
                first_col_imgs = first_col.find_all('img')
                for img in first_col_imgs:
                    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src', '')
                    if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                        cover_image = urljoin(url, src)
                        break
        
        # Se ainda não encontrou, extrair do catalogContent (será preenchido depois)
        # Mas vamos marcar que precisa extrair depois
        product_info['cover_image'] = cover_image
        product_info['_needs_image_from_content'] = not cover_image
        
        # Conteúdo do catálogo
        content_section = soup.find(class_=re.compile(r'eltdf-content|content', re.I))
        if content_section:
            for script in content_section(['script', 'style']):
                script.decompose()
            # Extrair metadados do HTML ANTES de remover
            metadata = extract_metadata_from_html(str(content_section))
            for key, value in metadata.items():
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
            
            # Se não encontrou imagem antes, tentar extrair do catalogContent (FALLBACK)
            # IMPORTANTE: A imagem MINI do catálogo deve ser priorizada, este é apenas fallback
            if product_info.get('_needs_image_from_content'):
                content_soup = BeautifulSoup(str(content_section), 'html.parser')
                imgs = content_soup.find_all('img')
                
                # Coletar candidatos com prioridade
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
                    
                    # Máxima prioridade para mockup
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
                
                # Ordenar por prioridade e usar a melhor
                if candidates:
                    candidates.sort(key=lambda x: x[0], reverse=True)
                    product_info['cover_image'] = urljoin(url, candidates[0][1])
                # Fallback: primeira imagem válida
                elif imgs:
                    first_img = imgs[0]
                    src = first_img.get('src', '') or first_img.get('data-src', '') or first_img.get('data-lazy-src', '')
                    if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'favicon']):
                        product_info['cover_image'] = urljoin(url, src)
        
        # Remover flag temporária
        product_info.pop('_needs_image_from_content', None)
        
        # PDF/Issuu
        iframe = soup.find('iframe', src=re.compile(r'issuu', re.I))
        if iframe:
            product_info['catalog_pdf'] = iframe.get('src', '')
        
        return product_info
    except Exception as e:
        print(f"  Erro ao extrair {url}: {e}")
        return None

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

def create_slug(title):
    """Cria slug a partir do título"""
    import unicodedata
    slug = title.lower()
    slug = unicodedata.normalize('NFD', slug)
    slug = ''.join(c for c in slug if unicodedata.category(c) != 'Mn')
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = slug.replace('`', '').replace("'", '').replace('"', '')
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

def process_products_batch(product_links, start_idx=0, batch_size=10, catalog_file='front-end/src/data/catalog-products.json', progress_file='import_progress.json'):
    """Processa um lote de produtos"""
    
    # Carregar progresso anterior
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
            start_idx = progress.get('last_processed_idx', 0)
            print(f"Continuando do produto {start_idx + 1}...")
    else:
        progress = {'last_processed_idx': 0, 'total_processed': 0, 'total_errors': 0}
    
    # Carregar catálogo existente
    if os.path.exists(catalog_file):
        with open(catalog_file, 'r', encoding='utf-8') as f:
            catalog = json.load(f)
    else:
        catalog = []
    
    existing_slugs = {p.get('slug', '') for p in catalog}
    catalog_url = 'https://n-1edicoes.org/catalogo/'
    
    end_idx = min(start_idx + batch_size, len(product_links))
    processed = 0
    skipped = 0
    errors = 0
    
    print(f"\n{'='*60}")
    print(f"Processando lote: produtos {start_idx + 1} a {end_idx} de {len(product_links)}")
    print(f"{'='*60}\n")
    
    for i in range(start_idx, end_idx):
        url = product_links[i]
        print(f"[{i+1}/{len(product_links)}] Processando: {url}")
        
        try:
            product_info = extract_product_info(url, catalog_url)
            
            if not product_info or not product_info.get('title'):
                print(f"  [!] Produto sem titulo, pulando...")
                skipped += 1
                continue
            
            slug = create_slug(product_info['title'])
            
            if slug in existing_slugs:
                print(f"  [>] Produto ja existe no catalogo, pulando...")
                skipped += 1
                continue
            
            # Baixar imagem da capa
            cover_image_url = product_info.get('cover_image')
            cover_image_local = None
            if cover_image_url:
                print(f"  [*] Baixando capa...")
                sku = product_info.get('sku', 'product')
                cover_filename = f"cover_{sku}.jpg"
                images_dir = "front-end/public/images"
                cover_image_local = download_file(cover_image_url, images_dir, cover_filename)
                if cover_image_local:
                    print(f"  [+] Capa baixada: {cover_filename}")
                else:
                    print(f"  [!] Falha ao baixar capa, usando placeholder")
            
            # Criar objeto do produto
            if cover_image_local:
                image_path = f"/images/{os.path.basename(cover_image_local)}"
            else:
                image_path = f"/images/cover_{product_info.get('sku', 'product')}.jpg" if product_info.get('sku') else "/images/cover_product.jpg"
            
            product = {
                "_id": f"catalog-{slug}",
                "id": f"catalog-{slug}",
                "title": product_info['title'],
                "description": product_info.get('description', ''),
                "shortDescription": (product_info.get('description', '')[:200] + '...') if len(product_info.get('description', '')) > 200 else product_info.get('description', ''),
                "image": image_path,
                "images": [image_path],
                "price": parse_price(product_info.get('price', 0)),
                "originalPrice": parse_price(product_info.get('price', 0)),
                "discount": 0,
                "sku": product_info.get('sku', ''),
                "stock": None,
                "inStock": True,
                "tags": [product_info.get('author', '')] if product_info.get('author') else [],
                "categories": ["Livros"],
                "itemInfo": "latest-product",
                "rating": {"average": 0, "count": 0},
                "permalink": f"/livros/{slug}",
                "slug": slug,
                "catalogContent": product_info.get('catalog_content', ''),
                "catalogImages": product_info.get('catalog_images', []),
                "catalogPdf": product_info.get('catalog_pdf', ''),
                "source": "catalog"
            }
            
            # Adicionar metadados extraídos (bookTitle, author, year, etc.)
            metadata_fields = ['bookTitle', 'originalTitle', 'author', 'authors', 'organization', 
                            'translation', 'preparation', 'revision', 'year', 'pages', 
                            'dimensions', 'isbn', 'price', 'priceText']
            for field in metadata_fields:
                if field in product_info:
                    product[field] = product_info[field]
            
            catalog.append(product)
            existing_slugs.add(slug)
            processed += 1
            
            print(f"  [+] Produto adicionado: {product_info['title'][:50]}...")
            
            # Pequena pausa para não sobrecarregar o servidor
            time.sleep(0.5)
            
        except Exception as e:
            error_msg = str(e).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
            print(f"  [X] Erro: {error_msg[:100]}")
            errors += 1
            continue
    
    # Salvar catálogo atualizado
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    # Atualizar progresso
    progress['last_processed_idx'] = end_idx
    progress['total_processed'] = progress.get('total_processed', 0) + processed
    progress['total_errors'] = progress.get('total_errors', 0) + errors
    
    with open(progress_file, 'w', encoding='utf-8') as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"Lote concluido!")
    print(f"  [+] Processados neste lote: {processed}")
    print(f"  [>] Pulados: {skipped}")
    print(f"  [X] Erros neste lote: {errors}")
    print(f"  [*] Total no catalogo: {len(catalog)}")
    print(f"  [*] Total processados (geral): {progress['total_processed']}")
    print(f"  [*] Total erros (geral): {progress['total_errors']}")
    print(f"{'='*60}\n")
    
    return {
        'processed': processed,
        'skipped': skipped,
        'errors': errors,
        'total': len(catalog),
        'next_idx': end_idx,
        'progress': progress
    }

def main():
    catalog_url = 'https://n-1edicoes.org/catalogo/'
    batch_size = 10
    reset_progress = False
    
    # Verificar argumentos
    if len(sys.argv) > 1:
        if sys.argv[1] == '--reset':
            reset_progress = True
            batch_size = int(sys.argv[2]) if len(sys.argv) > 2 else 10
        else:
            batch_size = int(sys.argv[1])
    
    # Resetar progresso se solicitado
    progress_file = 'import_progress.json'
    if reset_progress and os.path.exists(progress_file):
        os.remove(progress_file)
        print("Progresso anterior resetado!\n")
    
    print("="*60)
    print("IMPORTACAO DE PRODUTOS DO CATALOGO N-1 EDICOES")
    print("="*60)
    print(f"Tamanho do lote: {batch_size} produtos")
    print(f"Use 'python import_all_products.py --reset' para comecar do zero\n")
    
    # Obter todos os links
    product_links = get_all_product_links(catalog_url)
    
    if not product_links:
        print("Nenhum produto encontrado no catalogo!")
        return
    
    print(f"\nTotal de produtos encontrados: {len(product_links)}")
    print(f"Serao processados em lotes de {batch_size}\n")
    
    # Processar lote (o start_idx será determinado pelo progresso salvo)
    result = process_products_batch(product_links, batch_size=batch_size)
    
    if result['next_idx'] < len(product_links):
        remaining = len(product_links) - result['next_idx']
        batches_remaining = (remaining + batch_size - 1) // batch_size
        print(f"\n{'='*60}")
        print(f"PROXIMOS PASSOS:")
        print(f"{'='*60}")
        print(f"Produtos restantes: {remaining}")
        print(f"Lotes restantes: ~{batches_remaining}")
        print(f"\nPara continuar, execute novamente:")
        print(f"  python import_all_products.py {batch_size}")
        print(f"\nO script continuara automaticamente de onde parou!")
        print(f"{'='*60}\n")
    else:
        print(f"\n{'='*60}")
        print(f"IMPORTACAO CONCLUIDA!")
        print(f"{'='*60}")
        print(f"Total de produtos no catalogo: {result['total']}")
        if os.path.exists(progress_file):
            os.remove(progress_file)
            print("Arquivo de progresso removido.\n")

if __name__ == '__main__':
    main()

