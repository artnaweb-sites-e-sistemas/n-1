# Instruções de Importação de Produtos

## Como usar o script de importação

O script `import_all_products.py` processa os produtos do catálogo em **lotes de 10** (ou outro tamanho que você definir) para evitar sobrecarga e permitir verificação do progresso.

### Primeira execução

```bash
python import_all_products.py 10
```

Isso irá:
1. Buscar todos os produtos do catálogo (encontrou **199 produtos**)
2. Processar os primeiros 10 produtos
3. Salvar o progresso em `import_progress.json`
4. Adicionar produtos ao `catalog-products.json`

### Continuar a importação

Simplesmente execute o mesmo comando novamente:

```bash
python import_all_products.py 10
```

O script **automaticamente continua de onde parou** usando o arquivo `import_progress.json`.

### Alterar tamanho do lote

```bash
python import_all_products.py 20  # Processa 20 por vez
```

### Resetar e começar do zero

```bash
python import_all_products.py --reset 10
```

## O que o script faz

1. ✅ Extrai título, autor, descrição, preço, ISBN
2. ✅ Busca imagem da capa no catálogo
3. ✅ Extrai conteúdo HTML completo da página
4. ✅ Identifica PDF/Issuu se disponível
5. ✅ Cria slug único para cada produto
6. ✅ Evita duplicatas (pula produtos já importados)
7. ✅ Salva progresso automaticamente

## Limitações conhecidas

- Alguns produtos podem ter caracteres especiais que causam erros de encoding (ex: H₂O)
- Imagens da capa precisam ser baixadas manualmente depois
- Alguns produtos podem não ter todos os campos preenchidos

## Próximos passos após importação

1. **Baixar imagens das capas**: As imagens precisam ser baixadas e colocadas em `front-end/public/images/`
2. **Revisar produtos**: Verificar se todos os dados estão corretos
3. **Ajustar preços**: Verificar se os preços foram extraídos corretamente
4. **Completar campos faltantes**: Alguns produtos podem precisar de ajustes manuais

## Status atual

- ✅ Script funcional
- ✅ Processamento em lotes implementado
- ✅ Salvamento de progresso implementado
- ✅ Primeiro lote testado (8 produtos processados)


