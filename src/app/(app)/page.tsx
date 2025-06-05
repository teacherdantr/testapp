
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Waves, Edit3, Share2, Laptop, BarChart3, FilePlus2, Users, ClipboardCheck, GraduationCap, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';


export default function HomePage() {
  const [email, setEmail] = useState('');

  const handleSubscriptionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      console.log('Subscribing email:', email);
      alert(`Thank you for subscribing with ${email}! (Feature in development)`);
      setEmail('');
    }
  };

  const features = [
    {
      title: 'Easy Test Creation',
      description: 'Intuitive tools for educators to build comprehensive tests with various question types.',
      imageSrc: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyMHx8dGVzdCUyMHdlYiUyMGFwcHxlbnwwfHx8fDE3NDgzMTMwNjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      dataAiHint: 'test creation',
    },
    {
      title: 'Online Test Taking',
      description: 'Seamless experience for students to take tests online from anywhere, on any device.',
      imageSrc: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxvbmxpbmUlMjBsZWFybmluZ3xlbnwwfHx8fDE3NTIyNjI5MDF8MA&ixlib=rb-4.0.3&q=80&w=1080',
      dataAiHint: 'online learning',
    },
     {
      title: 'Instant Results',
      description: 'Immediate feedback and detailed score reports upon test completion for quick insights.',
      imageSrc: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MHx8fHwxNzUyMjYyOTgwfDA&ixlib=rb-4.0.3&q=80&w=1080',
      dataAiHint: 'analytics dashboard',
    },
    {
      title: 'Secure & Fair',
      description: 'Optional password protection and AI-powered bias prevention for fair assessments.',
      imageSrc: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxzZWN1cml0eSUyMHNoaWVsZHxlbnwwfHx8fDE3NTIyNjMwNDB8MA&ixlib=rb-4.0.3&q=80&w=1080',
      dataAiHint: 'security shield',
    },
  ];

  const workflowSteps = [
    {
      icon: FilePlus2,
      title: 'Create Tests',
      description: 'Educators design tests with various question types using our intuitive admin interface.',
    },
    {
      icon: Share2,
      title: 'Share Links',
      description: 'Distribute unique test links or IDs to students easily and securely.',
    },
    {
      icon: Users,
      title: 'Students Take Tests',
      description: 'Test-takers complete assessments online, from any device with internet access.',
    },
    {
      icon: BarChart3,
      title: 'View Results',
      description: 'Get instant scores and detailed answer breakdowns upon test completion.',
    },
  ];

  return (
    <div className="flex flex-col items-center">
      <header className="w-full text-center py-16 md:py-24 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          <div className="md:w-1/2 text-center md:text-left">
            <Waves className="h-20 w-20 sm:h-24 sm:w-24 text-primary mx-auto md:mx-0 mb-6 md:mb-8" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-primary">
              Welcome to TestWave
            </h1>
            <p className="mt-6 md:mt-8 text-lg sm:text-xl md:text-2xl text-foreground/70 max-w-xl mx-auto md:mx-0">
              The modern platform for creating, distributing, and taking online tests with ease and confidence.
            </p>
            <div className="mt-10 md:mt-12">
              <Link href="/select-test" asChild>
                <Button size="lg" className="text-lg px-8 sm:px-10 py-5 sm:py-6">
                  <PlayCircle className="mr-2 h-6 w-6"/> Take a Test Now
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-10 md:mt-0">
            <div className="relative w-full max-w-md mx-auto md:max-w-none h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzNDE5ODJ8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwbGVhcm5pbmd8ZW58MHx8fHwxNzUyMjYzMzMyfDA&ixlib=rb-4.0.3&q=80&w=1080"
                alt="Online testing platform illustration"
                fill
                className="object-cover"
                data-ai-hint="digital learning"
                priority
              />
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 md:py-24 bg-card w-full">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-primary mb-16 md:mb-20">
            Why Choose TestWave?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="text-center shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col group hover:scale-105 overflow-hidden rounded-lg"
              >
                <div className="relative w-full h-48">
                  <Image
                    src={feature.imageSrc}
                    alt={`${feature.title} illustrative image`}
                    fill
                    className="object-cover"
                    data-ai-hint={feature.dataAiHint}
                  />
                </div>
                <CardHeader className="pt-6 pb-3">
                  <CardTitle className="text-2xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pt-0 pb-6 px-6">
                  <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-background w-full">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-primary mb-16 md:mb-20">
            How TestWave Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {workflowSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-6">
                  <step.icon className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold text-primary mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

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
                  <Link href="/admin" asChild>
                    <Button size="lg" className="w-full md:w-auto text-lg px-8 py-5">
                      Go to Admin Dashboard
                    </Button>
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
    </div>
  );
}
