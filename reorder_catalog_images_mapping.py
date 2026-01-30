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

def reorder_catalog_images_mapping(mapping_file, order_titles):
    """Reordena o catalog_images_mapping.json baseado na lista de títulos fornecida"""
    with open(mapping_file, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    print(f"\nTotal de entradas no mapeamento: {len(mapping)}")
    print(f"Total de títulos na ordem fornecida: {len(order_titles)}")
    
    ordered_mapping = []
    remaining_mapping = list(mapping)
    matched_count = 0
    
    for idx, target_title in enumerate(order_titles):
        best_match, ratio = find_best_match(target_title, remaining_mapping)
        
        if best_match and ratio >= 0.7:
            ordered_mapping.append(best_match)
            remaining_mapping.remove(best_match)
            matched_count += 1
            if idx < 10 or matched_count <= 10:
                print(f"[{idx+1}] ✓ Match ({ratio:.2f}): '{target_title[:50]}...' -> '{best_match.get('title', '')[:50]}...'")
        else:
            if idx < 10:
                print(f"[{idx+1}] ✗ Sem match para: '{target_title[:50]}...' (ratio: {ratio:.2f})")
    
    # Adicionar entradas restantes ao final
    ordered_mapping.extend(remaining_mapping)
    
    # Salvar arquivo reordenado
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(ordered_mapping, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Arquivo reordenado!")
    print(f"  - Entradas na ordem correta: {matched_count}")
    print(f"  - Entradas não encontradas: {len(order_titles) - matched_count}")
    print(f"  - Entradas adicionadas ao final: {len(remaining_mapping)}")
    print(f"  - Total de entradas no arquivo: {len(ordered_mapping)}")
    
    print("\nPrimeiros 15 entradas na nova ordem:")
    for i, entry in enumerate(ordered_mapping[:15]):
        print(f"{i+1}. {entry.get('title', 'N/A')}")

if __name__ == "__main__":
    catalog_url = "https://n-1edicoes.org/catalogo/"
    mapping_file = 'catalog_images_mapping.json'
    
    print("Extraindo ordem dos produtos da página de catálogo...")
    order_titles = extract_product_order_from_catalog_page(catalog_url)
    
    if not order_titles:
        print("\nNão foi possível extrair títulos automaticamente.")
        sys.exit(1)
    
    print(f"\nEncontrados {len(order_titles)} produtos na página de catálogo")
    
    # Reordenar o catalog_images_mapping.json
    reorder_catalog_images_mapping(mapping_file, order_titles)


