import { Router, raw } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin as supabase } from '../lib/supabase';

const rotasStripe = Router();

let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY não configurada');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-04-30.basil' as Stripe.LatestApiVersion });
  }
  return _stripe;
}

const PRICE_PRO = process.env.STRIPE_PRICE_PRO_ID || '';

function getUserId(req: { headers: Record<string, string | string[] | undefined> }): string | null {
  const auth = req.headers.authorization;
  if (!auth || typeof auth !== 'string') return null;
  try {
    const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64').toString());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

rotasStripe.get('/subscription', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ erro: 'Não autenticado' }); return; }

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    res.json(data ?? { plano: 'free', status: 'active' });
  } catch (err) {
    console.error('[stripe/subscription]', err);
    res.status(500).json({ erro: 'Erro ao buscar assinatura.' });
  }
});

rotasStripe.post('/create-checkout', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ erro: 'Não autenticado' }); return; }

    const { email } = req.body as { email?: string };

    let customerId: string;

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await getStripe().customers.create({
        email: email ?? undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        plano: 'free',
        status: 'active',
      }, { onConflict: 'user_id' });
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PRICE_PRO, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/planos?success=1`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/planos?canceled=1`,
      metadata: { user_id: userId },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/create-checkout]', err);
    res.status(500).json({ erro: 'Erro ao criar sessão de pagamento.' });
  }
});

rotasStripe.post('/portal', async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ erro: 'Não autenticado' }); return; }

    const { data } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data?.stripe_customer_id) {
      res.status(400).json({ erro: 'Nenhuma assinatura encontrada.' });
      return;
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/planos`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe/portal]', err);
    res.status(500).json({ erro: 'Erro ao abrir portal de pagamento.' });
  }
});

rotasStripe.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed', err);
    res.status(400).send('Webhook signature verification failed.');
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            plano: 'pro',
            status: 'active',
            current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
          }, { onConflict: 'user_id' });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: existing } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        if (existing) {
          const isCanceled = sub.status === 'canceled' || event.type === 'customer.subscription.deleted';
          await supabase.from('subscriptions').update({
            plano: isCanceled ? 'free' : 'pro',
            status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
            current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', existing.user_id);
        }
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('[stripe/webhook] Processing error', err);
    res.status(500).json({ erro: 'Webhook processing error' });
  }
});

export default rotasStripe;
