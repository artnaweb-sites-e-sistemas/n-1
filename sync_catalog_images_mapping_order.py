import json
import sys
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

def sync_mapping_order(catalog_file, mapping_file):
    """Sincroniza a ordem do catalog_images_mapping.json com catalog-products.json"""
    # Ler catalog-products.json para obter a ordem correta
    with open(catalog_file, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    # Ler catalog_images_mapping.json
    with open(mapping_file, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    print(f"Total de produtos no catálogo: {len(catalog)}")
    print(f"Total de entradas no mapeamento: {len(mapping)}")
    
    # Extrair ordem dos títulos do catalog-products.json
    catalog_titles = [p.get('title', '') for p in catalog]
    
    ordered_mapping = []
    remaining_mapping = list(mapping)
    matched_count = 0
    
    # Reordenar mapping baseado na ordem do catalog
    for idx, target_title in enumerate(catalog_titles):
        best_match, ratio = find_best_match(target_title, remaining_mapping)
        
        if best_match and ratio >= 0.7:
            ordered_mapping.append(best_match)
            remaining_mapping.remove(best_match)
            matched_count += 1
            if idx < 15:
                print(f"[{idx+1}] ✓ Match ({ratio:.2f}): '{target_title[:50]}...'")
        else:
            if idx < 15:
                print(f"[{idx+1}] ✗ Sem match para: '{target_title[:50]}...' (ratio: {ratio:.2f})")
    
    # Adicionar entradas restantes ao final
    ordered_mapping.extend(remaining_mapping)
    
    # Salvar arquivo reordenado
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(ordered_mapping, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Arquivo reordenado!")
    print(f"  - Entradas na ordem correta: {matched_count}")
    print(f"  - Entradas não encontradas: {len(catalog_titles) - matched_count}")
    print(f"  - Entradas adicionadas ao final: {len(remaining_mapping)}")
    print(f"  - Total de entradas no arquivo: {len(ordered_mapping)}")
    
    print("\nPrimeiros 15 entradas na nova ordem:")
    for i, entry in enumerate(ordered_mapping[:15]):
        print(f"{i+1}. {entry.get('title', 'N/A')}")

if __name__ == "__main__":
    catalog_file = 'front-end/src/data/catalog-products.json'
    mapping_file = 'catalog_images_mapping.json'
    
    sync_mapping_order(catalog_file, mapping_file)


