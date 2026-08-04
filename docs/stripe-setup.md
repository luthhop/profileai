# Stripe — Configuração de Produtos e Preços

## 1. Criar Produto no Stripe Dashboard

1. Acesse https://dashboard.stripe.com/products
2. Clique **+ Add product**
3. Preencha:
   - **Name**: ProfileAI Pro
   - **Description**: Plano Pro — acesso ilimitado a todas as features de IA
4. Em **Pricing**, adicione:
   - **Price**: R$ 39,00
   - **Currency**: BRL
   - **Billing period**: Monthly
5. Salve e copie o **Price ID** (começa com `price_`)

## 2. Variáveis de Ambiente

Configure no Railway (ou `.env` local):

```
STRIPE_SECRET_KEY=sk_live_...        # ou sk_test_... para testes
STRIPE_PRICE_PRO_ID=price_...        # Price ID copiado acima
STRIPE_WEBHOOK_SECRET=whsec_...      # Gerado no passo 3
FRONTEND_URL=https://friendly-luck-production.up.railway.app
```

## 3. Configurar Webhook

1. Acesse https://dashboard.stripe.com/webhooks
2. Clique **+ Add endpoint**
3. URL: `https://profileai-production-3b23.up.railway.app/api/stripe/webhook`
4. Eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Signing secret** (`whsec_...`) para `STRIPE_WEBHOOK_SECRET`

## 4. Testar

Use o Stripe CLI para testar localmente:
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
stripe trigger checkout.session.completed
```
