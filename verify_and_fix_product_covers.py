import json
import sys
import requests
import os
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
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

def find_cover_image_on_catalog_page(catalog_url, product_title):
    """Encontra a imagem de capa correta na página de catálogo"""
    try:
        response = requests.get(catalog_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Procurar por links de produtos
        product_links = soup.find_all('a', href=lambda x: x and '/publicacoes/' in x)
        
        for link in product_links:
            link_title = link.get_text(strip=True)
            if not link_title or len(link_title) < 5:
                img = link.find('img')
                if img:
                    link_title = img.get('alt', '') or img.get('title', '')
            
            # Verificar se é o produto correto
            if normalize_title(link_title) == normalize_title(product_title):
                # Encontrar a imagem dentro ou próxima ao link
                img = link.find('img')
                if img:
                    img_src = img.get('src') or img.get('data-src')
                    if img_src:
                        full_url = urljoin(catalog_url, img_src)
                        # Priorizar imagens com "mockup", "mini", "site" no nome
                        if any(keyword in img_src.lower() for keyword in ['mockup', 'mini', 'site', 'cover', 'capa']):
                            return full_url
                        # Se não encontrar, retornar a primeira imagem
                        return full_url
                
                # Se não encontrou imagem no link, procurar na div pai
                parent = link.find_parent()
                if parent:
                    img = parent.find('img')
                    if img:
                        img_src = img.get('src') or img.get('data-src')
                        if img_src:
                            return urljoin(catalog_url, img_src)
    except Exception as e:
        print(f"  Erro ao buscar capa no catálogo: {e}")
    
    return None

def find_cover_image_on_product_page(product_url):
    """Encontra a imagem de capa correta na página do produto"""
    try:
        response = requests.get(product_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Procurar por imagem principal (geralmente a primeira imagem grande)
        # Priorizar imagens com "mockup", "mini", "site" no src
        all_imgs = soup.find_all('img')
        
        cover_candidates = []
        
        for img in all_imgs:
            img_src = img.get('src') or img.get('data-src')
            if not img_src:
                continue
            
            full_url = urljoin(product_url, img_src)
            img_src_lower = img_src.lower()
            
            # Priorizar imagens com palavras-chave
            priority = 0
            if 'mockup' in img_src_lower:
                priority = 15
            elif 'mini' in img_src_lower:
                priority = 14
            elif 'site' in img_src_lower:
                priority = 13
            elif 'cover' in img_src_lower or 'capa' in img_src_lower:
                priority = 12
            elif 'frente' in img_src_lower:
                priority = 11
            
            # Verificar se é uma imagem grande (não thumbnail)
            width = img.get('width')
            if width:
                try:
                    width_int = int(width)
                    if width_int > 500:
                        priority += 5
                except:
                    pass
            
            cover_candidates.append((priority, full_url, img_src))
        
        # Ordenar por prioridade e retornar a melhor
        if cover_candidates:
            cover_candidates.sort(key=lambda x: x[0], reverse=True)
            return cover_candidates[0][1]
        
    except Exception as e:
        print(f"  Erro ao buscar capa na página do produto: {e}")
    
    return None

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

def verify_and_fix_product(product, catalog_url='https://n-1edicoes.org/catalogo/'):
    """Verifica e corrige a capa de um produto"""
    product_title = product.get('title', '')
    product_slug = product.get('slug', '')
    current_image = product.get('image', '')
    sku = product.get('sku', '')
    
    print(f"\nVerificando: {product_title}")
    print(f"  SKU: {sku}")
    print(f"  Imagem atual: {current_image}")
    
    # Construir URL do produto
    product_url = f"https://n-1edicoes.org/publicacoes/{product_slug}/"
    
    # Tentar encontrar a capa correta na página de catálogo
    correct_cover = find_cover_image_on_catalog_page(catalog_url, product_title)
    
    if not correct_cover:
        # Se não encontrou no catálogo, tentar na página do produto
        correct_cover = find_cover_image_on_product_page(product_url)
    
    if correct_cover:
        print(f"  Capa encontrada: {correct_cover}")
        
        # Verificar se a imagem atual está correta
        if current_image.startswith('/images/'):
            # Imagem local - verificar se precisa atualizar
            filename = os.path.basename(current_image)
            expected_filename = f"cover_{sku}.jpg"
            
            # Se a URL encontrada é diferente, baixar e atualizar
            if 'mockup' in correct_cover.lower() or 'mini' in correct_cover.lower() or 'site' in correct_cover.lower():
                # Esta é provavelmente a capa correta
                local_path = f"front-end/public/images/cover_{sku}.jpg"
                
                # Baixar a imagem
                if download_image(correct_cover, local_path):
                    print(f"  ✓ Imagem baixada: {local_path}")
                    return f"/images/cover_{sku}.jpg"
                else:
                    print(f"  ✗ Erro ao baixar imagem")
        else:
            # Imagem externa - verificar se precisa atualizar
            if correct_cover != current_image:
                local_path = f"front-end/public/images/cover_{sku}.jpg"
                if download_image(correct_cover, local_path):
                    print(f"  ✓ Imagem atualizada: {local_path}")
                    return f"/images/cover_{sku}.jpg"
    else:
        print(f"  ⚠ Capa não encontrada")
    
    return None

def main():
    catalog_file = 'front-end/src/data/catalog-products.json'
    
    with open(catalog_file, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    print(f"Verificando {len(products)} produtos...")
    
    updated_count = 0
    for product in products:
        new_image = verify_and_fix_product(product)
        if new_image:
            product['image'] = new_image
            # Atualizar também o primeiro item do array images
            if product.get('images') and len(product['images']) > 0:
                product['images'][0] = new_image
            updated_count += 1
    
    if updated_count > 0:
        # Salvar arquivo atualizado
        with open(catalog_file, 'w', encoding='utf-8') as f:
            json.dump(products, f, indent=2, ensure_ascii=False)
        print(f"\n✓ {updated_count} produtos atualizados!")
    else:
        print(f"\n✓ Nenhuma atualização necessária")

if __name__ == "__main__":
    main()

