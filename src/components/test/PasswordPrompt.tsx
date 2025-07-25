
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Timer } from 'lucide-react';

interface PasswordPromptProps {
  open: boolean;
  onVerify: (password: string) => Promise<boolean>;
  error?: string | null;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_SECONDS = 30;

export function PasswordPrompt({ open, onVerify, error: initialError }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(initialError || null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const router = useRouter();

  const isLockedOut = lockoutTimeLeft > 0;

  useEffect(() => {
    if (lockoutTimeLeft > 0) {
      const timer = setTimeout(() => {
        setLockoutTimeLeft(lockoutTimeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setFailedAttempts(0); // Reset attempts after lockout period ends
    }
  }, [lockoutTimeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setIsLoading(true);
    setCurrentError(null);
    const isCorrect = await onVerify(password);

    if (isCorrect) {
      setFailedAttempts(0); // Reset on success
    } else {
      const newAttemptCount = failedAttempts + 1;
      setFailedAttempts(newAttemptCount);
      setCurrentError(initialError || "Incorrect password. Please try again.");

      if (newAttemptCount >= MAX_ATTEMPTS) {
        setLockoutTimeLeft(LOCKOUT_DURATION_SECONDS);
        setCurrentError(`Too many failed attempts. Please wait ${LOCKOUT_DURATION_SECONDS} seconds.`);
      }
    }
    setIsLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      router.push('/');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <ShieldAlert className="mr-2 h-7 w-7 text-primary" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            This test is password protected. Please enter the password to proceed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter test password"
                autoFocus
                disabled={isLockedOut}
              />
            </div>
            {currentError && !isLockedOut && <p className="text-sm text-destructive">{currentError}</p>}
            {isLockedOut && (
              <div className="flex items-center text-destructive text-sm p-3 bg-destructive/10 rounded-md">
                <Timer className="h-5 w-5 mr-2" />
                Too many attempts. Please wait {lockoutTimeLeft} seconds.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !password || isLockedOut}>
              {isLoading ? 'Verifying...' : 'Unlock Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
