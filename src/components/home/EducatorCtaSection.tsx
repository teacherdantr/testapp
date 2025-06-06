
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Edit3 } from 'lucide-react';

export function EducatorCtaSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-card">
      <div className="container mx-auto px-4 flex justify-center">
        <Card className="w-full max-w-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8 md:p-10">
              <CardHeader className="p-0 mb-6">
                <Edit3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-3xl font-bold text-primary">Empowering Educators</CardTitle>
                <CardDescription className="text-lg text-muted-foreground pt-2">
                  Create, manage, and analyze tests effortlessly. TestWave provides all the tools you need to design effective assessments.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Link href="/admin" legacyBehavior passHref>
                  <a className={cn(buttonVariants({ variant: 'default', size: 'lg' }), "w-full md:w-auto text-lg px-8 py-5")}>
                    Go to Admin Dashboard
                  </a>
                </Link>
              </CardContent>
            </div>
            <div className="relative h-64 md:h-full w-full hidden md:block">
              <Image
                src="https://placehold.co/600x800.png"
                alt="Educator managing tests"
                fill
                className="object-cover"
                data-ai-hint="teacher dashboard"
              />
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
