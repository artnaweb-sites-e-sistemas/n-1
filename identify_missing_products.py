import json
import sys
import requests
from bs4 import BeautifulSoup
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

def find_best_match(target_title, available_items):
    """Encontra o melhor match para um título na lista de produtos"""
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

def extract_product_order_from_catalog_page(url):
    """Extrai a ordem dos produtos da página de catálogo"""
    print(f"Buscando produtos de: {url}")
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        html_content = response.text
    except Exception as e:
        print(f"Erro ao buscar página: {e}")
        return []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    product_titles = []
    
    # Procurar por links que apontam para /publicacoes/
    product_links = soup.find_all('a', href=lambda x: x and '/publicacoes/' in x)
    
    seen_titles = set()
    for link in product_links:
        title_text = link.get_text(strip=True)
        
        if not title_text or len(title_text) < 5:
            img = link.find('img')
            if img:
                title_text = img.get('alt', '') or img.get('title', '')
        
        if title_text and len(title_text) > 5:
            normalized = normalize_title(title_text)
            if normalized and normalized not in seen_titles:
                if 'publicacoes' not in normalized and 'catalogo' not in normalized:
                    product_titles.append(title_text)
                    seen_titles.add(normalized)
    
    print(f"Extraídos {len(product_titles)} títulos únicos")
    return product_titles

def identify_missing_products():
    """Identifica produtos que estão no catálogo mas não foram importados"""
    catalog_url = "https://n-1edicoes.org/catalogo/"
    catalog_file = 'front-end/src/data/catalog-products.json'
    
    # Extrair ordem dos produtos do catálogo
    print("Extraindo ordem dos produtos da página de catálogo...")
    catalog_titles = extract_product_order_from_catalog_page(catalog_url)
    
    # Ler produtos importados
    with open(catalog_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    imported_titles = [p.get('title', '') for p in imported_products]
    
    print(f"\nTotal de produtos no catálogo: {len(catalog_titles)}")
    print(f"Total de produtos importados: {len(imported_products)}")
    
    missing_products = []
    
    # Verificar quais produtos do catálogo não foram importados
    for idx, catalog_title in enumerate(catalog_titles):
        best_match, ratio = find_best_match(catalog_title, imported_products)
        
        if not best_match or ratio < 0.7:
            # Encontrar o link do produto na página de catálogo
            try:
                response = requests.get(catalog_url, timeout=30)
                soup = BeautifulSoup(response.text, 'html.parser')
                product_links = soup.find_all('a', href=lambda x: x and '/publicacoes/' in x)
                
                for link in product_links:
                    link_title = link.get_text(strip=True)
                    if not link_title or len(link_title) < 5:
                        img = link.find('img')
                        if img:
                            link_title = img.get('alt', '') or img.get('title', '')
                    
                    if normalize_title(link_title) == normalize_title(catalog_title):
                        product_url = link.get('href')
                        if product_url:
                            missing_products.append({
                                'title': catalog_title,
                                'url': product_url,
                                'position': idx + 1
                            })
                            break
            except Exception as e:
                print(f"Erro ao buscar URL para '{catalog_title}': {e}")
                missing_products.append({
                    'title': catalog_title,
                    'url': None,
                    'position': idx + 1
                })
    
    print(f"\n✓ Produtos não encontrados/importados: {len(missing_products)}")
    print("\nLista de produtos faltantes:")
    for i, product in enumerate(missing_products[:10], 1):
        print(f"{i}. [{product['position']}] {product['title']}")
        if product['url']:
            print(f"   URL: {product['url']}")
    
    return missing_products[:5]  # Retornar apenas os 5 primeiros

if __name__ == "__main__":
    missing = identify_missing_products()
    
    print(f"\n\n{'='*60}")
    print("PRODUTOS A IMPORTAR (primeiros 5):")
    print('='*60)
    for i, product in enumerate(missing, 1):
        print(f"\n{i}. {product['title']}")
        print(f"   URL: {product['url']}")

