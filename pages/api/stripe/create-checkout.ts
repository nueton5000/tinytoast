import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe, SUBSCRIPTION_PLANS } from '@/lib/stripe';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { tier, userId, email } = req.body;

    if (!tier || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const plan = SUBSCRIPTION_PLANS[tier as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/teams/board?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/teams?canceled=true`,
      customer_email: email,
      metadata: {
        userId,
        tier,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
