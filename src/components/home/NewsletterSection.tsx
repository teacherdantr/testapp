
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      console.log('Subscribing email:', email);
      // Usually, you'd call an API here. For now, just an alert.
      alert(`Thank you for subscribing with ${email}! (Feature in development)`);
      setEmail('');
    }
  };

  return (
    <section className="w-full py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 flex justify-center">
        <Card className="w-full max-w-xl shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-primary">Stay Updated!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Subscribe to our newsletter for the latest updates, new features, and tips.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscriptionSubmit} className="space-y-4 sm:space-y-0 sm:flex sm:gap-3">
              <div className="flex-grow">
                <Label htmlFor="email-subscription" className="sr-only">Email address</Label>
                <Input
                  id="email-subscription"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-base"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto h-12 text-base">
                Subscribe
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pt-4">
            <p className="text-xs text-muted-foreground text-center w-full">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
