#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para atualizar a ordem dos produtos baseado na ordem do PDF
"""

import json
import sys
from difflib import SequenceMatcher

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Ordem correta do PDF (da esquerda para a direita)
PDF_ORDER = [
    "Nas brechas de futuros cancelados",
    "Coletânea de Dramaturgias \"A Marcha das Mulheradas\"",
    "Ueinzz: território de transmutação poética e política",
    "Pensar Gaza – entrevista com Étienne Balibar",
    "psicanálise e amefricanidade",
    "Os involuntários da pátria",
    "Sonhos em série",
    "Dinâmicas do pensamento por imagens",
    "A comunidade terrestre",
    "Sobre a pintura",
    "Aprender com as águas do Cercadinho",
    "H₂O e as águas do esquecimento",
    "O desencadeamento do mundo",
    "Animacidades",
    "O cogumelo no fim do mundo",
    "O menino e o gato na floresta de aço",
    "Futuros Menores",
    "A última guerra?",
    "Cartas a um velho terapeuta",
    "Ivone, Princesa da Borgonha",
    "PENSAR APÓS GAZA – ensaio sobre a ferocidade e o fim do humano",
    "Perspectivismo e interculturalidade",
    "A raça no divã",
    "EU SOU UM MONSTRO",
    "A floresta de cristal",
    "Teoria crítica da arquitetura",
    "DEMOCRACIA COMO COMUNIDADE DE VIDA",
    "Uma história de mulheres filósofas — Filósofas da Antiguidade (600 a.C.-500 d.C.)",
    "A chuva desmancha todos os fatos",
    "Racismo Cínico",
    "A PEQUENA PRISÃO",
    "Triálogos",
    "assim é a mulher por trás de seu véu? temas feministas em psicanálise",
    "Um altar que se coma — Ensaios da agrofloresta",
    "Tratado do todo-mundo",
    "Jesus, o homem que preferia as mulheres",
    "O judeu pós-judeu: judaicidade e etnocentrismo",
    "Ficar com o problema: fazer parentes no chthluceno",
    "Esparsas: Viagem aos papéis do gueto de Varsóvia",
    "ARTAUD – PENSAMENTO E CORPO",
    "Por uma ética queer",
    "A estrutura psicológica do fascismo",
    "HELIOGABALO ou O ANARQUISTA COROADO",
    "A nota fervorosa",
    "Um brinde aos mortos: Histórias daqueles que ficam",
    "Caixa Pandemia das bordas",
    "Améfrica",
    "Filosofia para aranhas",
    "Coleção Clínicas de Borda",
    "No espelho do passado: Palestras e Discursos, 1978–1990",
    "Em que ponto estamos?",
    "HOMO INC.ORPORATED",
    "Para dar um fim no juízo de Deus",
    "Brutalismo",
    "A cosmopolítica dos animais",
    "Não existe revolução infeliz",
    "Antigos Caminhos Queer – Uma exploração decolonial",
    "Diferentes modos de existência",
    "Povo em lágrimas, povo em armas",
    "GRAVIDADE",
    "Artaud, o momo",
    "E se eu fosse puta",
    "WALTER BENJAMIM: OS CACOS DA HISTÓRIA",
    "UPP A REDUÇÃO DA FAVELA A TRÊS LETRAS",
    "AGAMBEN",
    "CINCO DIAS EM MARÇO",
    "ESFERAS DA INSURREIÇÃO",
    "HIJIKATA TATSUMI – PENSAR UM CORPO ESGOTADO",
    "SPARTAKUS",
    "O UNIVERSO INACABADO",
    "CARTAS E OUTROS TEXTOS",
    "CAIXA PANDEMIA Série de cordéis",
    "NIETZSCHE E A FILOSOFIA",
    "BRAZUCA NEGÃO E SEBENTO",
    "MOTIM E DESTITUIÇÃO AGORA",
    "CRÍTICA DA RAZÃO NEGRA",
    "NECROPOLÍTICA",
    "AS EXISTÊNCIAS MÍNIMAS",
    "O GOVERNO DO HOMEM ENDIVIDADO",
    "HEGEL E O HAITI",
    "O QUE OS ANIMAIS NOS ENSINAM SOBRE POLÍTICA",
    "CAIXA PANDEMIA Série Cordéis",
    "TREINO E(M) POEMA",
    "WILLIAM JAMES, A CONSTRUÇÃO DA EXPERIÊNCIA",
    "FABULAÇÕES DO CORPO JAPONÊS",
    "O que a Guerra da Ucrânia tem a nos ensinar",
    "Cartas do latão",
    "Filosofia Primeira – Tratado De Ucronia Pós-Metafísica",
    "Teatro e os povos indígenas: Janelas Abertas para a possibilidade",
    "Política Selvagem",
    "ocupar a psicanálise: por uma clínica antirracista e decolonial",
    "Acompanhamento terapêutico",
    "Junho Febril",
    "Composto Escola",
    "Psicanálise e esquizoanálise",
    "Direito de sequência esquizoanalítica",
    "Sujeito suposto suspeito",
    "Os anos de inverno: 1980–1985",
    "Van Gogh não existe",
    "Potências da Suavidade",
    "Vida da literatura",
    "Manifesto Cósmico I e II",
    "O soldado antropofágico",
    "Quatro cantos",
    "A palavra falsa",
    "Contos de uma mulher liberta",
    "A Alteração dos mundos",
    "O intolerável do presente, a urgência da revolução: Minorias e Classes",
    "MÁQUINA KAFKA",
    "Quando o sol aqui não mais brilhar: a falência da negritude",
    "Lucio costa era racista?",
    "Ficções do pragmatismo",
    "Ch'ixinakax utxiwa: uma reflexão sobre práticas e discursos descolonizadores",
    "Pandemia Crítica – Outono 2020",
    "O CORPO UTÓPICO, AS HETEROTOPIAS",
    "A potência das fendas",
    "Pandemia Crítica – Inverno 2020",
    "Summa Cosmologiae. Breve tratado (político) de imortalidade",
    "CAIXA FORA",
    "Desejos ingovernáveis: Rimbaud e a Comuna de Paris + Uma estação no Inferno",
    "O AVESSO DO NIILISMO",
    "Sociedades do desaparecimento",
    "Sobre a fabricação gradativa de pensamentos durante a fala",
    "Uma Baleia na Montanha",
    "Antropofagia Zumbi",
    "a psicanálise em elipse decolonial",
    "Des-Habitat",
    "Tempos Modernos: Arte, tempo, política",
    "No silêncio que as palavras guardam",
    "Uma vida política",
    "ABEBE – CAIXA PRETAS",
    "Semente de crápula",
    "Ritornelos",
    "AOS NOSSOS AMIGOS",
    "NIETZSCHE, O BUFÃO DOS DEUSES",
    "QUANDO E COMO EU LI FOUCAULT",
    "METAFÍSICAS CANIBAIS",
    "O ARACNIANO E OUTROS TEXTOS",
    "A PROPÓSITO DO TEATRO DE MARIONETES",
    "ESTAMIRA",
    "A GÊNESE DE UM CORPO DESCONHECIDO",
    "INTOXICAÇÕES POÉTICAS DA CARNE",
    "A DAMA DO MAR",
    "IMPRESSÕES DE MICHEL FOUCAULT",
    "DELEUZE, OS MOVIMENTOS ABERRANTES",
    "SIGNOS, MÁQUINAS, SUBJETIVIDADES",
    "A ÍNTIMA UTOPIA",
    "Para além de Black Mirror: estilhaços distópicos do presente",
    "O clarão de Espinosa",
    "LEITURAS DO CORPO NO JAPÃO",
    "NEGRI NO TRÓPICO 23º26'14\"",
    "DECLARAÇÃO",
    "DEVIRES TOTÊMICOS",
    "AMAZÔNIA TRANSCULTURAL"
]

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

def main():
    correct_structure_file = 'catalog_correct_structure.json'
    catalog_products_file = 'front-end/src/data/catalog-products.json'
    
    # Carregar estrutura atual do catálogo (para obter URLs e capas)
    print("Carregando estrutura atual do catálogo...")
    with open(correct_structure_file, 'r', encoding='utf-8') as f:
        current_structure = json.load(f)
    
    # Carregar produtos já importados
    print("Carregando produtos já importados...")
    with open(catalog_products_file, 'r', encoding='utf-8') as f:
        imported_products = json.load(f)
    
    print(f"\nEstrutura atual: {len(current_structure)} produtos")
    print(f"Produtos importados: {len(imported_products)} produtos")
    print(f"Ordem do PDF: {len(PDF_ORDER)} produtos\n")
    
    # Criar dicionário de produtos atuais por título
    products_by_title = {}
    for product in current_structure:
        title = product.get('title', '')
        if title:
            products_by_title[normalize_title(title)] = product
    
    # Criar nova estrutura ordenada conforme PDF
    new_structure = []
    matched_count = 0
    not_found_count = 0
    
    print("="*80)
    print("ATUALIZANDO ORDEM CONFORME PDF")
    print("="*80)
    print()
    
    for idx, pdf_title in enumerate(PDF_ORDER, 1):
        # Procurar produto correspondente na estrutura atual
        matched_product, ratio = find_best_match(pdf_title, current_structure)
        
        if matched_product and ratio >= 0.7:
            # Atualizar posição
            matched_product['position'] = idx
            new_structure.append(matched_product)
            matched_count += 1
            print(f"[{idx:3d}] ✓ {pdf_title[:60]}")
        else:
            # Produto não encontrado na estrutura atual - criar entrada básica
            not_found_count += 1
            print(f"[{idx:3d}] ✗ {pdf_title[:60]} (não encontrado no catálogo atual)")
            
            # Criar entrada básica para produtos não encontrados
            new_structure.append({
                'title': pdf_title,
                'url': '',  # Será preenchido durante importação
                'slug': '',
                'cover_image': '',
                'position': idx
            })
    
    # Adicionar produtos da estrutura atual que não estão no PDF ao final
    remaining_products = []
    for product in current_structure:
        title = product.get('title', '')
        if title:
            found = False
            for pdf_title in PDF_ORDER:
                if find_best_match(pdf_title, [product])[1] >= 0.7:
                    found = True
                    break
            if not found:
                remaining_products.append(product)
    
    if remaining_products:
        print(f"\nAdicionando {len(remaining_products)} produtos não no PDF ao final...")
        for product in remaining_products:
            product['position'] = len(new_structure) + 1
            new_structure.append(product)
    
    # Salvar nova estrutura
    print(f"\nSalvando nova estrutura ordenada...")
    with open(correct_structure_file, 'w', encoding='utf-8') as f:
        json.dump(new_structure, f, indent=2, ensure_ascii=False)
    
    # Reordenar produtos importados conforme PDF
    print(f"\nReordenando produtos importados...")
    ordered_imported = []
    remaining_imported = list(imported_products)
    
    for pdf_title in PDF_ORDER:
        matched_product, ratio = find_best_match(pdf_title, remaining_imported)
        if matched_product and ratio >= 0.7:
            ordered_imported.append(matched_product)
            remaining_imported.remove(matched_product)
    
    # Adicionar produtos restantes ao final
    ordered_imported.extend(remaining_imported)
    
    # Salvar produtos reordenados
    with open(catalog_products_file, 'w', encoding='utf-8') as f:
        json.dump(ordered_imported, f, indent=2, ensure_ascii=False)
    
    print()
    print("="*80)
    print("RESUMO")
    print("="*80)
    print(f"✓ Produtos encontrados e ordenados: {matched_count}")
    print(f"✓ Produtos não encontrados: {not_found_count}")
    print(f"✓ Produtos importados reordenados: {len(ordered_imported)}")
    print(f"✓ Nova estrutura salva em: {correct_structure_file}")
    print(f"✓ Produtos importados salvos em: {catalog_products_file}")
    print("="*80)

if __name__ == "__main__":
    main()

