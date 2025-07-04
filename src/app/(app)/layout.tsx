
'use client'; 

import { Navbar } from '@/components/Navbar';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="bg-card border-t border-border py-6 text-center text-muted-foreground">
        {isMounted && currentYear !== null ? (
          <p>&copy; {currentYear} TestWave. All rights reserved.</p>
        ) : (
          <p>&copy; TestWave. All rights reserved.</p>
        )}
      </footer>
    </div>
  );
}
