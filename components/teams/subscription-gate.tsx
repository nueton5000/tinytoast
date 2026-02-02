import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import { Check, Loader2, Lock } from 'lucide-react';

interface SubscriptionGateProps {
  isSubscribed: boolean;
  userId?: string;
  email?: string;
  children: React.ReactNode;
  action?: string;
}

export function SubscriptionGate({
  isSubscribed,
  userId,
  email,
  children,
  action = 'continue',
}: SubscriptionGateProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (tier: 'BASIC' | 'PREMIUM') => {
    if (!userId) return;

    setLoading(tier);
    setError(null);

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, userId, email }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(null);
    }
  };

  if (isSubscribed) {
    return <>{children}</>;
  }

  return (
    <>
      <div onClick={() => setShowDialog(true)} className="cursor-pointer">
        {children}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Subscription Required
            </DialogTitle>
            <DialogDescription>
              Subscribe to {action}. Choose a plan that works for you.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className="border rounded-lg p-6 flex flex-col"
              >
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout(key as 'BASIC' | 'PREMIUM')}
                  disabled={loading !== null}
                  variant={key === 'PREMIUM' ? 'default' : 'outline'}
                  className="w-full"
                >
                  {loading === key ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
