
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';

interface PasswordPromptProps {
  open: boolean;
  onVerify: (password: string) => Promise<boolean>; // Returns true if password is correct
  error?: string | null;
}

export function PasswordPrompt({ open, onVerify, error: initialError }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentError, setCurrentError] = useState<string | null>(initialError || null);
  const router = useRouter(); // Initialize useRouter

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setCurrentError(null);
    const isCorrect = await onVerify(password);
    if (!isCorrect && !initialError) { // Only set error if onVerify itself doesn't provide one (via parent state)
        setCurrentError("Incorrect password. Please try again.");
    }
    setIsLoading(false);
  };

  // Update currentError if initialError prop changes
  if (initialError !== currentError && initialError !== undefined) {
    setCurrentError(initialError);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // If the dialog is being closed (e.g., by 'X' button or Escape key),
      // navigate to the homepage.
      router.push('/');
    }
    // The 'open' prop for this Dialog is controlled by the parent component (TestPage).
    // This handler ensures that an action (navigation) occurs when Radix tries to close the dialog.
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
              />
            </div>
            {currentError && <p className="text-sm text-destructive">{currentError}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !password}>
              {isLoading ? 'Verifying...' : 'Unlock Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
