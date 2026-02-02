import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '@/lib/stripe';
import {
  Check,
  Users,
  Lightbulb,
  Rocket,
  ArrowRight,
  Star,
  Loader2,
} from 'lucide-react';

export default function TeamsLandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState<string>();
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser()
      .then(async (u) => {
        setUser(u);
        const attrs = await fetchUserAttributes();
        setEmail(attrs.email);
      })
      .catch(() => {});
  }, []);

  const handleGetStarted = async (tier?: 'BASIC' | 'PREMIUM') => {
    if (!user) {
      router.push('/');
      return;
    }

    if (tier) {
      setLoading(tier);
      try {
        const response = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, userId: user.userId, email }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } catch (error) {
        console.error('Checkout error:', error);
      } finally {
        setLoading(null);
      }
    } else {
      router.push('/teams/board');
    }
  };

  const testimonials = [
    {
      quote: "Found amazing collaborators for my community garden project within a week!",
      author: "Sarah M.",
      role: "Project Lead",
    },
    {
      quote: "The platform connected me with skilled developers who shared my vision.",
      author: "James K.",
      role: "Founder",
    },
    {
      quote: "Finally, a place where I can contribute my skills to meaningful local work.",
      author: "Maria L.",
      role: "Designer",
    },
  ];

  return (
    <>
      <Head>
        <title>Impact Teams – Build High-Impact Projects Locally</title>
        <meta
          name="description"
          content="Find local teams, join high-impact projects, or propose your own ideas. Collaborate and make a real difference in your community."
        />
        <meta property="og:title" content="Impact Teams – Build High-Impact Projects Locally" />
        <meta
          property="og:description"
          content="Find local teams, join high-impact projects, or propose your own ideas. Collaborate and make a real difference in your community."
        />
        <meta property="og:type" content="website" />
      </Head>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl text-center">
            <Badge variant="secondary" className="mb-4">
              Local Teams Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Join Local Teams Building
              <span className="text-primary"> High-Impact Projects</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Discover, join, or propose projects where your skills make a difference.
              Connect with passionate people in your community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/teams/post">
                <Button size="lg" className="w-full sm:w-auto">
                  <Lightbulb className="h-5 w-5 mr-2" />
                  Post an Idea
                </Button>
              </Link>
              <Link href="/teams/board">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  <Users className="h-5 w-5 mr-2" />
                  Join a Team
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: 1,
                  title: 'Discover',
                  description: 'Browse projects that match your skills and interests',
                  icon: <Lightbulb className="h-8 w-8" />,
                },
                {
                  step: 2,
                  title: 'Join',
                  description: 'Apply to join teams or start your own project',
                  icon: <Users className="h-8 w-8" />,
                },
                {
                  step: 3,
                  title: 'Build',
                  description: 'Collaborate with your team to make a real impact',
                  icon: <Rocket className="h-8 w-8" />,
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div className="text-sm font-medium text-primary mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12">
              What Our Community Says
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, j) => (
                        <Star
                          key={j}
                          className="h-4 w-4 fill-secondary text-secondary"
                        />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 px-4 bg-muted/30" id="pricing">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
              Choose a plan to start joining teams and posting ideas.
              Cancel anytime.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
                <Card
                  key={key}
                  className={key === 'PREMIUM' ? 'border-primary' : ''}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{plan.name}</CardTitle>
                      {key === 'PREMIUM' && (
                        <Badge>Most Popular</Badge>
                      )}
                    </div>
                    <div className="pt-2">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={key === 'PREMIUM' ? 'default' : 'outline'}
                      onClick={() => handleGetStarted(key as 'BASIC' | 'PREMIUM')}
                      disabled={loading !== null}
                    >
                      {loading === key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join hundreds of people collaborating on projects that matter.
            </p>
            <Button size="lg" onClick={() => handleGetStarted()}>
              Browse Projects
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
