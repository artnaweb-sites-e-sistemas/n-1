import json
import sys
import requests
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

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
        print(f"Erro ao baixar imagem: {e}")
        return False

def find_cover_on_catalog_page(catalog_url, product_title):
    """Encontra a capa do produto na página de catálogo"""
    try:
        response = requests.get(catalog_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Procurar por links de produtos
        product_links = soup.find_all('a', href=lambda x: x and '/publicacoes/' in x)
        
        for link in product_links:
            # Verificar título
            link_title = link.get_text(strip=True)
            if not link_title or len(link_title) < 5:
                img = link.find('img')
                if img:
                    link_title = img.get('alt', '') or img.get('title', '')
            
            # Normalizar para comparação
            normalized_link = link_title.lower().replace('—', '-').replace('–', '-')
            normalized_target = product_title.lower().replace('—', '-').replace('–', '-')
            
            if normalized_target in normalized_link or normalized_link in normalized_target:
                # Encontrar imagem
                img = link.find('img')
                if img:
                    img_src = img.get('src') or img.get('data-src')
                    if img_src:
                        return urljoin(catalog_url, img_src)
    except Exception as e:
        print(f"Erro: {e}")
    
    return None

def main():
    catalog_file = 'front-end/src/data/catalog-products.json'
    mapping_file = 'catalog_images_mapping.json'
    catalog_url = "https://n-1edicoes.org/catalogo/"
    
    # Ler produtos
    with open(catalog_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    # Ler mapeamento
    with open(mapping_file, 'r', encoding='utf-8') as f:
        mapping = json.load(f)
    
    # Encontrar "Pensar após Gaza"
    target_product = None
    for product in products:
        if 'pensar' in product.get('title', '').lower() and 'após' in product.get('title', '').lower() and 'gaza' in product.get('title', '').lower():
            target_product = product
            break
    
    if not target_product:
        print("Produto 'Pensar após Gaza' não encontrado!")
        return
    
    print(f"Produto encontrado: {target_product['title']}")
    print(f"SKU: {target_product.get('sku', 'N/A')}")
    print(f"Imagem atual: {target_product.get('image', 'N/A')}")
    
    # Procurar no mapeamento
    correct_cover = None
    for entry in mapping:
        title = entry.get('title', '')
        if 'pensar' in title.lower() and 'após' in title.lower() and 'gaza' in title.lower():
            correct_cover = entry.get('cover_image')
            print(f"\nCapa no mapeamento: {correct_cover}")
            break
    
    # Se não encontrou no mapeamento, procurar na página de catálogo
    if not correct_cover:
        print("\nProcurando na página de catálogo...")
        correct_cover = find_cover_on_catalog_page(catalog_url, target_product['title'])
        if correct_cover:
            print(f"Capa encontrada: {correct_cover}")
    
    # Se encontrou capa correta, baixar e atualizar
    if correct_cover:
        sku = target_product.get('sku', '')
        if sku:
            local_path = f"front-end/public/images/cover_{sku}.jpg"
            if download_image(correct_cover, local_path):
                print(f"\n✓ Imagem baixada: {local_path}")
                
                # Atualizar produto
                target_product['image'] = f"/images/cover_{sku}.jpg"
                if target_product.get('images') and len(target_product['images']) > 0:
                    target_product['images'][0] = f"/images/cover_{sku}.jpg"
                
                # Salvar
                with open(catalog_file, 'w', encoding='utf-8') as f:
                    json.dump(products, f, indent=2, ensure_ascii=False)
                
                print(f"✓ Produto atualizado!")
            else:
                print("✗ Erro ao baixar imagem")
        else:
            print("✗ SKU não encontrado")
    else:
        print("✗ Capa não encontrada")

if __name__ == "__main__":
    main()

