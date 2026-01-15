# Guia de Deploy - WordPress

## Estrutura do Projeto

Este projeto consiste em:
1. **Plugin WordPress** (`plugin-n1-woocommerce-api/`) - API REST customizada
2. **Front-end Next.js** (`front-end/`) - Interface do usuário
3. **Admin Panel** (`admin-panel/`) - Painel administrativo (opcional)

## Passo 1: Instalar o Plugin WordPress

1. Acesse o painel administrativo do WordPress
2. Vá em **Plugins > Adicionar novo > Enviar plugin**
3. Faça upload do arquivo ZIP do plugin (ou copie a pasta `plugin-n1-woocommerce-api` para `wp-content/plugins/`)
4. Ative o plugin **N-1 WooCommerce API**

## Passo 2: Configurar o Front-end Next.js

### Opção A: Deploy como Aplicação Next.js (Recomendado)

Se você tem acesso a servidor Node.js:

1. Faça build do projeto:
```bash
cd front-end
npm install
npm run build
```

2. Configure as variáveis de ambiente:
```bash
# Crie um arquivo .env.local no diretório front-end
NEXT_PUBLIC_API_BASE_URL=https://seu-dominio.com/wp-json/n1/v1
NEXT_PUBLIC_WORDPRESS_URL=https://seu-dominio.com
```

3. Inicie o servidor:
```bash
npm start
```

4. Configure um proxy reverso (Nginx/Apache) para apontar para o Next.js na porta 3000

### Opção B: Export Estático (Se não usar SSR)

Se o projeto não usa Server-Side Rendering, você pode exportar como estático:

1. Modifique `next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // ... resto da configuração
}
```

2. Faça build:
```bash
cd front-end
npm install
npm run build
```

3. Faça upload da pasta `out/` para seu servidor web

## Passo 3: Configurar Permalinks WordPress

1. Vá em **Configurações > Links Permanentes**
2. Selecione **Nome do post** ou **Estrutura personalizada**
3. Salve as alterações

## Passo 4: Verificar API

Teste se a API está funcionando:
```
https://seu-dominio.com/wp-json/n1/v1/products
```

## Arquivos para Upload

### Plugin WordPress:
- `plugin-n1-woocommerce-api/n1-woocommerce-api.php` → `wp-content/plugins/n1-woocommerce-api/`

### Front-end (se export estático):
- Toda a pasta `front-end/out/` → Servidor web

### Front-end (se servidor Node.js):
- Toda a pasta `front-end/` → Servidor Node.js
- Execute `npm install` e `npm start` no servidor

## Configurações Importantes

### CORS
O plugin já está configurado para permitir CORS. Se tiver problemas, verifique:
- Headers CORS no servidor
- Configurações de segurança do WordPress

### Permissões
Certifique-se de que o WordPress tem permissões para:
- Ler produtos WooCommerce
- Criar pedidos
- Processar pagamentos (Stripe)

## Suporte

Em caso de problemas, verifique:
1. Logs do WordPress (`wp-content/debug.log`)
2. Logs do servidor web
3. Console do navegador (F12)

