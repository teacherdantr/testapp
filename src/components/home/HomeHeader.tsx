
import Image from 'next/image';
import Link from 'next/link';
import { Waves, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HomeHeader() {
  return (
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
            <Button asChild size="lg" className="text-lg px-8 sm:px-10 py-5 sm:py-6">
              <Link href="/select-test">
                <PlayCircle className="mr-2 h-6 w-6" /> Take a Test Now
              </Link>
            </Button>
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
              priority // Added priority prop
            />
          </div>
        </div>
      </div>
    </header>
  );
}
