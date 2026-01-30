import json
import re
from bs4 import BeautifulSoup
from difflib import SequenceMatcher

def normalize_title(title):
    """Normaliza o título para comparação"""
    if not title:
        return ""
    # Remove aspas especiais, traços especiais, dois pontos, etc.
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
        
        # Priorizar match exato ou parcial forte
        if normalized_target == normalized_item:
            return item, 1.0
        
        # Verificar se target é substring de item_title ou vice-versa
        if normalized_target in normalized_item or normalized_item in normalized_target:
            ratio = max(
                SequenceMatcher(None, normalized_target, normalized_item).ratio(),
                SequenceMatcher(None, normalized_item, normalized_target).ratio()
            )
            if ratio > highest_ratio:
                highest_ratio = ratio
                best_match = item
        
        # Fallback para fuzzy matching
        ratio = SequenceMatcher(None, normalized_target, normalized_item).ratio()
        if ratio > highest_ratio:
            highest_ratio = ratio
            best_match = item
    
    # Definir threshold para um "match claro"
    if highest_ratio >= 0.7:  # Ajustar threshold conforme necessário
        return best_match, highest_ratio
    return None, highest_ratio

def extract_product_order_from_html(html_file_path):
    """Extrai a ordem dos produtos do HTML do catálogo"""
    with open(html_file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Procurar por links de produtos ou títulos de produtos
    # A estrutura pode variar, então vamos tentar várias abordagens
    
    product_titles = []
    
    # Tentativa 1: Procurar por links que apontam para /publicacoes/
    product_links = soup.find_all('a', href=re.compile(r'/publicacoes/'))
    for link in product_links:
        # Pegar o texto do link ou o título do elemento pai
        title_text = link.get_text(strip=True)
        if title_text and len(title_text) > 5:  # Filtrar textos muito curtos
            # Verificar se não é um link de navegação
            if 'publicacoes' not in title_text.lower() and 'catalogo' not in title_text.lower():
                product_titles.append(title_text)
    
    # Tentativa 2: Procurar por elementos com classes específicas de produtos
    # (pode variar dependendo do tema WordPress)
    portfolio_items = soup.find_all(['div', 'article'], class_=re.compile(r'portfolio|product|item'))
    for item in portfolio_items:
        title_elem = item.find(['h2', 'h3', 'h4', 'a'], class_=re.compile(r'title|name'))
        if title_elem:
            title_text = title_elem.get_text(strip=True)
            if title_text and len(title_text) > 5:
                product_titles.append(title_text)
    
    # Tentativa 3: Procurar por imagens com alt text que podem ser títulos
    images = soup.find_all('img', alt=True)
    for img in images:
        alt_text = img.get('alt', '').strip()
        if alt_text and len(alt_text) > 10 and 'logo' not in alt_text.lower():
            # Verificar se o alt text parece ser um título de livro
            if any(keyword in alt_text.lower() for keyword in ['livro', 'publicação', 'obra']):
                product_titles.append(alt_text)
    
    # Remover duplicatas mantendo a ordem
    seen = set()
    unique_titles = []
    for title in product_titles:
        normalized = normalize_title(title)
        if normalized and normalized not in seen:
            seen.add(normalized)
            unique_titles.append(title)
    
    return unique_titles

def reorder_catalog_products(catalog_file, order_titles):
    """Reordena o catalog-products.json baseado na lista de títulos fornecida"""
    with open(catalog_file, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"Total de produtos no catálogo: {len(catalog)}")
    print(f"Total de títulos na ordem fornecida: {len(order_titles)}")
    
    ordered_products = []
    remaining_products = list(catalog)  # Cópia mutável
    matched_indices = []
    
    for idx, target_title in enumerate(order_titles):
        best_match, ratio = find_best_match(target_title, remaining_products)
        
        if best_match and ratio >= 0.7:
            ordered_products.append(best_match)
            remaining_products.remove(best_match)
            matched_indices.append(idx)
            print(f"[{idx+1}] ✓ Match ({ratio:.2f}): '{target_title}' -> '{best_match.get('title', '')}'")
        else:
            print(f"[{idx+1}] ✗ Sem match claro para: '{target_title}' (melhor ratio: {ratio:.2f})")
    
    # Adicionar produtos restantes (que não estavam na lista de ordem) ao final
    ordered_products.extend(remaining_products)
    
    # Salvar arquivo reordenado
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(ordered_products, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Arquivo reordenado!")
    print(f"  - Produtos na ordem correta: {len(matched_indices)}")
    print(f"  - Produtos não encontrados: {len(order_titles) - len(matched_indices)}")
    print(f"  - Produtos adicionados ao final: {len(remaining_products)}")
    print(f"  - Total de produtos no arquivo: {len(ordered_products)}")
    
    print("\nPrimeiros 20 produtos na nova ordem:")
    for i, product in enumerate(ordered_products[:20]):
        print(f"{i+1}. {product.get('title', 'N/A')}")

if __name__ == "__main__":
    # Primeiro, vamos tentar extrair a ordem do HTML se o arquivo existir
    html_file = 'page.html'  # Ou outro arquivo HTML fornecido pelo usuário
    
    # Se o usuário forneceu o HTML do catálogo, extrair a ordem
    # Caso contrário, usar uma lista manual
    print("Tentando extrair ordem do HTML...")
    
    try:
        order_titles = extract_product_order_from_html(html_file)
        if order_titles:
            print(f"Extraídos {len(order_titles)} títulos do HTML")
        else:
            print("Não foi possível extrair títulos do HTML. Usando lista manual.")
            # Aqui você pode adicionar uma lista manual se necessário
            order_titles = []
    except FileNotFoundError:
        print(f"Arquivo {html_file} não encontrado.")
        print("Por favor, forneça o HTML da página de catálogo ou uma lista de títulos.")
        order_titles = []
    
    # Se não conseguimos extrair do HTML, precisamos que o usuário forneça a lista
    if not order_titles:
        print("\nPor favor, forneça o HTML da página de catálogo (https://n-1edicoes.org/catalogo/)")
        print("ou uma lista de títulos na ordem correta.")
        exit(1)
    
    # Reordenar o catalog-products.json
    catalog_file = 'front-end/src/data/catalog-products.json'
    reorder_catalog_products(catalog_file, order_titles)


