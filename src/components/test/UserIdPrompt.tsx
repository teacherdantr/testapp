
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';

interface UserIdPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdentifierSubmit: (identifier: string) => void;
}

export function UserIdPrompt({ open, onOpenChange, onIdentifierSubmit }: UserIdPromptProps) {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Optional: for loading state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      // Basic validation, can be enhanced
      alert("Please enter an identifier.");
      return;
    }
    setIsLoading(true);
    await onIdentifierSubmit(identifier.trim());
    setIsLoading(false);
    // Dialog should be closed by parent component by changing 'open' prop
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <UserCircle className="mr-2 h-7 w-7 text-primary" />
            Enter Your Identifier
          </DialogTitle>
          <DialogDescription>
            Please enter a name or nickname to save your test score. This will help you track your progress later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="identifier">Your Identifier (Name/Nickname)</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g., AlexP"
                autoFocus
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !identifier.trim()}>
              {isLoading ? 'Starting...' : 'Start Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
