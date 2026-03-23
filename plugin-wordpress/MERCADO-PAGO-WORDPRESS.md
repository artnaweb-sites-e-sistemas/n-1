# Mercado Pago no WordPress (sem Node / Render)

O pagamento com cartão passa **pelo próprio WordPress**, como já acontecia com o Stripe.

## Erro ao ativar: "gerou um erro fatal"

1. **Plugin duplicado:** em *Plugins instalados*, se **"N-1 WooCommerce API"** aparece **duas vezes**, você tem **duas pastas** em `wp-content/plugins/` (ex.: `n1-woocommerce-api` e `n1-woocommerce-api-copy`). **Apague ou desative uma pasta inteira** e deixe só **uma** cópia do plugin. Versões novas do arquivo também protegem contra isso, mas o ideal é não ter duplicata.
2. Ative o **modo debug** só para ver o erro exato: no `wp-config.php`, `define('WP_DEBUG', true);` e `define('WP_DEBUG_LOG', true);` — o detalhe fica em `wp-content/debug.log`.

## 1. Atualizar o plugin

Envie o arquivo **`n1-woocommerce-api.php`** atualizado para o servidor (substituindo o antigo), ou reinstale o plugin.

## 2. Credenciais no `wp-config.php`

Abra o `wp-config.php` na raiz do WordPress (pelo cPanel → Gerenciador de arquivos) e **antes** da linha `/* That's all, stop editing! */` adicione:

```php
// Mercado Pago — mesmas credenciais do painel (teste ou produção)
define('N1_MERCADO_PAGO_ACCESS_TOKEN', 'SEU_ACCESS_TOKEN_AQUI');
define('N1_MERCADO_PAGO_PUBLIC_KEY', 'SUA_PUBLIC_KEY_AQUI');

// URL da loja Next.js (Vercel) — para links de volta do Checkout Pro, se usar
define('N1_STORE_URL', 'https://n-1-seven.vercel.app');
```

- **Access Token** e **Public Key** estão em: Mercado Pago → Suas integrações → Credenciais.
- A **Public Key** no front (Vercel) continua em `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` — deve ser a **mesma** que `N1_MERCADO_PAGO_PUBLIC_KEY`.

## 3. Webhook (recomendado para PIX)

No painel do Mercado Pago, configure:

- **URL de notificações**:  
  `https://n-1.artnaweb.com.br/wp-json/n1/v1/api/order/mercadopago-webhook`

- **Assinatura secreta (Webhook secret)** no `wp-config.php`:

```php
define('N1_MERCADO_PAGO_WEBHOOK_SECRET', '72f75ebaa2987bb78f16596f53a536a05b4a9695f2e48012979991d64d050fc4');
```

- Também mantenha (se usar notification_url no create payment):
  `define('N1_MERCADO_PAGO_NOTIFICATION_URL', 'https://n-1.artnaweb.com.br/wp-json/n1/v1/api/order/mercadopago-webhook');`

Sem webhook, o PIX pode ser recebido no MP mas o pedido no WooCommerce fica pendente.

**Teste “Simular notificações” no painel MP:** o payload usa um `id` de pagamento fictício (`123456`). A API do Mercado Pago responde **404** — o plugin passa a responder **200 OK** nesse caso para o teste não aparecer como *502 Bad Gateway*. Pagamentos reais continuam sendo consultados pelo ID verdadeiro e o pedido é atualizado.

## 4. Não precisa mais

- `N1_NODE_BACKEND_URL`
- `NEXT_PUBLIC_NODE_API_URL` no Vercel (pode apagar)
- Servidor Node no Render só para esse pagamento

---

**Segurança:** não compartilhe o Access Token. Se vazar, gere outro no painel do Mercado Pago.
