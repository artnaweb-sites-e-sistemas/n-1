import json
import sys
import requests
import os
import re
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from difflib import SequenceMatcher

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

def extract_all_products_from_catalog(catalog_url):
    """Extrai todos os produtos da página de catálogo com seus slugs e URLs"""
    try:
        response = requests.get(catalog_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        products = []
        product_links = soup.find_all('a', href=lambda x: x and '/publicacoes/' in x)
        
        seen = set()
        for link in product_links:
            href = link.get('href', '')
            if not href:
                continue
            
            # Extrair slug da URL
            slug_match = re.search(r'/publicacoes/([^/]+)/?', href)
            if not slug_match:
                continue
            
            slug = slug_match.group(1)
            
            # Extrair título
            title = link.get_text(strip=True)
            if not title or len(title) < 5:
                img = link.find('img')
                if img:
                    title = img.get('alt', '') or img.get('title', '')
            
            if title and len(title) > 5:
                normalized = normalize_title(title)
                if normalized and normalized not in seen:
                    seen.add(normalized)
                    
                    # Encontrar imagem de capa
                    img = link.find('img')
                    cover_image = None
                    if img:
                        img_src = img.get('src') or img.get('data-src')
                        if img_src:
                            cover_image = urljoin(catalog_url, img_src)
                    
                    products.append({
                        'title': title,
                        'slug': slug,
                        'url': href if href.startswith('http') else urljoin(catalog_url, href),
                        'cover_image': cover_image
                    })
        
        return products
    except Exception as e:
        print(f"Erro ao extrair produtos do catálogo: {e}")
        return []

def find_best_match(target_title, available_items):
    """Encontra o melhor match para um título"""
    best_match = None
    highest_ratio = 0.0
    normalized_target = normalize_title(target_title)

    for item in available_items:
        item_title = item.get('title', '')
        normalized_item = normalize_title(item_title)
        
        if normalized_target == normalized_item:
            return item, 1.0
        
        if normalized_target in normalized_item or normalized_item in normalized_target:
            ratio = max(
                SequenceMatcher(None, normalized_target, normalized_item).ratio(),
                SequenceMatcher(None, normalized_item, normalized_target).ratio()
            )
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = item
        
        ratio = SequenceMatcher(None, normalized_target, normalized_item).ratio()
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = item
    
    if highest_ratio >= 0.7:
        return best_match, highest_ratio
    return None, highest_ratio

def download_image(url, local_path):
    """Baixa uma imagem e salva localmente"""
    try:
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return True
    except Exception as e:
        print(f"  Erro ao baixar imagem: {e}")
        return False

def find_correct_cover_from_product_page(product_url):
    """Encontra a capa correta na página do produto"""
    try:
        response = requests.get(product_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Procurar por imagem principal (primeira imagem grande com mockup/mini/site)
        all_imgs = soup.find_all('img')
        
        cover_candidates = []
        
        for img in all_imgs:
            img_src = img.get('src') or img.get('data-src')
            if not img_src:
                continue
            
            full_url = urljoin(product_url, img_src)
            img_src_lower = img_src.lower()
            
            # Priorizar imagens com palavras-chave de capa
            priority = 0
            if 'mockup' in img_src_lower:
                priority = 20
            elif 'mini' in img_src_lower:
                priority = 19
            elif 'site' in img_src_lower:
                priority = 18
            elif 'cover' in img_src_lower or 'capa' in img_src_lower:
                priority = 17
            elif 'frente' in img_src_lower:
                priority = 16
            
            # Penalizar imagens internas (que aparecem no conteúdo)
            if any(keyword in img_src_lower for keyword in ['catalog', 'internal', 'interno', 'foto', 'photo']):
                priority -= 10
            
            # Verificar se é uma imagem grande
            width = img.get('width')
            if width:
                try:
                    width_int = int(width)
                    if width_int > 800:
                        priority += 5
                except:
                    pass
            
            cover_candidates.append((priority, full_url, img_src))
        
        # Ordenar por prioridade e retornar a melhor
        if cover_candidates:
            cover_candidates.sort(key=lambda x: x[0], reverse=True)
            return cover_candidates[0][1]
        
    except Exception as e:
        print(f"  Erro ao buscar capa: {e}")
    
    return None

def main():
    catalog_url = "https://n-1edicoes.org/catalogo/"
    catalog_file = 'front-end/src/data/catalog-products.json'
    
    print("Extraindo produtos do catálogo...")
    catalog_products = extract_all_products_from_catalog(catalog_url)
    print(f"Encontrados {len(catalog_products)} produtos no catálogo")
    
    # Ler produtos importados
    with open(catalog_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    print(f"Produtos importados: {len(imported_products)}")
    
    # Identificar produtos faltantes
    missing_products = []
    for catalog_product in catalog_products:
        best_match, ratio = find_best_match(catalog_product['title'], imported_products)
        if not best_match or ratio < 0.7:
            missing_products.append(catalog_product)
    
    print(f"\n{'='*60}")
    print(f"PRODUTOS FALTANTES: {len(missing_products)}")
    print('='*60)
    for i, product in enumerate(missing_products[:10], 1):
        print(f"{i}. {product['title']}")
        print(f"   URL: {product['url']}")
        print(f"   Slug: {product['slug']}")
        if product.get('cover_image'):
            print(f"   Capa: {product['cover_image']}")
        print()
    
    # Verificar e corrigir capas dos produtos existentes
    print(f"\n{'='*60}")
    print("VERIFICANDO CAPAS DOS PRODUTOS EXISTENTES")
    print('='*60)
    
    updated_count = 0
    for product in imported_products:
        product_title = product.get('title', '')
        product_slug = product.get('slug', '')
        current_image = product.get('image', '')
        sku = product.get('sku', '')
        
        # Encontrar produto correspondente no catálogo
        catalog_match, ratio = find_best_match(product_title, catalog_products)
        
        if catalog_match:
            # Usar URL e slug do catálogo (mais confiável)
            product_url = catalog_match['url']
            correct_slug = catalog_match['slug']
            
            # Atualizar slug se necessário
            if product_slug != correct_slug:
                print(f"\n[{product_title[:50]}...]")
                print(f"  Atualizando slug: {product_slug} -> {correct_slug}")
                product['slug'] = correct_slug
                product['permalink'] = f"/livros/{correct_slug}"
            
            # Encontrar capa correta
            correct_cover = catalog_match.get('cover_image')
            
            if not correct_cover:
                # Tentar na página do produto
                correct_cover = find_correct_cover_from_product_page(product_url)
            
            if correct_cover:
                # Verificar se precisa atualizar
                if current_image.startswith('/images/'):
                    # Verificar se a imagem atual é realmente a capa correta
                    # Se a URL encontrada tem mockup/mini/site, é provavelmente a correta
                    if any(keyword in correct_cover.lower() for keyword in ['mockup', 'mini', 'site']):
                        local_path = f"front-end/public/images/cover_{sku}.jpg"
                        if download_image(correct_cover, local_path):
                            print(f"\n[{product_title[:50]}...]")
                            print(f"  ✓ Capa atualizada: {correct_cover}")
                            product['image'] = f"/images/cover_{sku}.jpg"
                            if product.get('images') and len(product['images']) > 0:
                                product['images'][0] = f"/images/cover_{sku}.jpg"
                            updated_count += 1
    
    # Salvar atualizações
    if updated_count > 0 or any(p.get('slug') != p.get('slug') for p in imported_products):
        with open(catalog_file, 'w', encoding='utf-8') as f:
            json.dump(imported_products, f, indent=2, ensure_ascii=False)
        print(f"\n✓ {updated_count} produtos atualizados!")
    
    # Mostrar produtos faltantes para importação
    if missing_products:
        print(f"\n{'='*60}")
        print("PRÓXIMOS 5 PRODUTOS A IMPORTAR:")
        print('='*60)
        for i, product in enumerate(missing_products[:5], 1):
            print(f"\n{i}. {product['title']}")
            print(f"   URL: {product['url']}")
            print(f"   Slug: {product['slug']}")

if __name__ == "__main__":
    main()

