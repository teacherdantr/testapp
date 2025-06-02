
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { AdminAuthPrompt } from './AdminAuthPrompt';
import { Loader2 } from 'lucide-react';

const ADMIN_SESSION_KEY = 'testwave_isAdminAuthenticated';

interface AdminAuthGuardProps {
  children: ReactNode;
}

export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage only on the client-side
    if (typeof window !== 'undefined') {
      const sessionActive = localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
      setIsVerified(sessionActive);
    }
    setIsLoading(false);
  }, []);

  const handleSuccess = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_SESSION_KEY, 'true');
    }
    setIsVerified(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Admin Area...</p>
      </div>
    );
  }

  if (!isVerified) {
    return <AdminAuthPrompt onSuccess={handleSuccess} />;
  }

  return <>{children}</>;
}
