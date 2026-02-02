import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    price: 30,
    features: [
      'Join unlimited projects',
      'Post up to 3 ideas per month',
      'Basic matching algorithm',
      'Community support',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    price: 50,
    features: [
      'Everything in Basic',
      'Unlimited idea postings',
      'Priority matching',
      'Featured project badges',
      'Early access to new features',
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS | 'FREE';
