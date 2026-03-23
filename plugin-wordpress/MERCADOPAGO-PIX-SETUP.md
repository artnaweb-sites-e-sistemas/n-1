# Mercado Pago — PIX no checkout (N-1)

## No painel Mercado Pago (obrigatório)

1. **Chave Pix** cadastrada na conta vendedor. Sem chave Pix, a API pode não retornar QR Code.  
   - App Mercado Pago → área de Pix / chaves, ou veja a documentação oficial.

2. **Credenciais de produção** (ou teste) coerentes:
   - `N1_MERCADO_PAGO_ACCESS_TOKEN` no `wp-config.php` (ou opção `n1_mercado_pago_access_token`).
   - No front: `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` no `.env.local` (cartão; PIX no back usa só o Access Token).

3. **Notificações Webhook** (recomendado): configure `n1_mercado_pago_notification_url` (se o plugin expuser) para que pedidos **pending** passem a **processing** quando o PIX for pago.

4. **Conta habilitada para receber Pix** como vendedor (CNPJ/pessoa jurídica conforme regras do MP).

## Limite noturno (BCB)

Entre **20h e 6h**, há limite de **R$ 1.000** por transação Pix (regra do Banco Central), conforme documentação pública do Mercado Pago.

## Prazo de expiração (PIX)

- A integração **não envia** `date_of_expiration` na criação do pagamento: o Mercado Pago aplica o **prazo padrão** do PIX e evita erro 400 por formato de data.

## Testes

- Em **sandbox**, o comportamento do Pix pode diferir do produção; valide com credenciais de teste do painel **Suas integrações**.

## Referência

- [Checkout Transparente / Pix — Mercado Pago Developers](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/integrate-with-pix)
