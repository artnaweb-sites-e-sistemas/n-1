# 🔍 Como Verificar Produto no WooCommerce

## Problema Atual

A API está retornando `{"products":[]}` - array vazio. Isso significa que o endpoint está funcionando, mas não está encontrando produtos.

## Solução Aplicada

Atualizei o plugin para retornar **todos os produtos publicados** se não houver produtos em destaque. Agora os produtos devem aparecer mesmo sem estar marcados como "Destaque".

## Verificações no WooCommerce

### 1. ✅ Verificar se o Produto Está Publicado

No WordPress Admin:
1. Vá em **Produtos** → **Todos os Produtos**
2. Encontre seu produto teste
3. Verifique se o status é **"Publicado"** (não "Rascunho" ou "Lixeira")

### 2. ✅ Verificar Informações Básicas do Produto

Certifique-se de que o produto tem:
- ✅ **Nome** do produto
- ✅ **Preço** definido (mesmo que seja R$ 0,00)
- ✅ **Imagem** adicionada (recomendado)
- ✅ **Estoque** configurado (pode ser "gerenciar estoque" desativado)

### 3. ✅ Marcar como Destaque (Opcional)

Para aparecer especificamente em `/api/products/show`:

1. Edite o produto
2. Na coluna lateral direita, procure por **"Dados do Produto"**
3. Marque a opção **"Destaque"** (Featured)
4. Clique em **"Atualizar"**

**Nota:** Com a atualização do plugin, os produtos aparecerão mesmo sem estar em destaque.

## Testar a API

### Teste 1: Produtos em Destaque
```
https://n-1.artnaweb.com.br/wp-json/n1/v1/api/products/show
```

### Teste 2: Todos os Produtos
```
https://n-1.artnaweb.com.br/wp-json/n1/v1/products
```

### Teste 3: Produto Específico (substitua {id} pelo ID do produto)
```
https://n-1.artnaweb.com.br/wp-json/n1/v1/products/{id}
```

## Próximos Passos

1. **Atualize o plugin no WordPress** com o arquivo atualizado
2. **Verifique o produto** está publicado
3. **Teste a API** diretamente no navegador
4. **Reinicie o Next.js** localmente
5. **Verifique** se os produtos aparecem em `localhost:3000`

## Se Ainda Não Funcionar

### Verificar se WooCommerce está Ativo
- Vá em **Plugins** → Verifique se **WooCommerce** está ativado

### Verificar Permissões
- Certifique-se de que o produto não está em uma categoria privada
- Verifique se não há plugins de segurança bloqueando a API

### Verificar Logs
- No WordPress, vá em **WooCommerce** → **Status** → **Logs**
- Procure por erros relacionados à API

### Testar Endpoint Alternativo
Tente acessar todos os produtos:
```
https://n-1.artnaweb.com.br/wp-json/n1/v1/products
```

Se este endpoint retornar produtos, significa que o problema está apenas no filtro de "destaque".



