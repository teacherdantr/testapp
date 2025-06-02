
'use client'; // Required because we'll use useState and useEffect

import { Navbar } from '@/components/Navbar';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
        {currentYear !== null ? (
          <p>&copy; {currentYear} TestWave. All rights reserved.</p>
        ) : (
          // Render a consistent placeholder or omit the year during SSR and initial client render
          // To ensure server and client match initially, we can render without the year first.
          // Or, if the year is critical, consider passing it as a prop from a Server Component.
          // For simplicity, let's show a version without the year if it's not yet set.
          <p>&copy; TestWave. All rights reserved.</p>
        )}
      </footer>
    </div>
  );
}
