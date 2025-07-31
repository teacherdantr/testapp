
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface GmtxPasswordPromptProps {
  onVerify: (password: string) => Promise<boolean>;
  onClose: () => void;
  error?: string | null;
}

export function GmtxPasswordPrompt({ onVerify, onClose, error: initialError }: GmtxPasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const isCorrect = await onVerify(password);
    if (!isCorrect) {
      setError('Incorrect password. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-blue-50">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <ShieldAlert className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-3xl">Password Required</CardTitle>
          <CardDescription>
            This test is password protected. Please enter the password to proceed.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gmtx-password">Password</Label>
              <Input
                id="gmtx-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter test password"
                className="text-lg h-12"
                autoFocus
              />
            </div>
            {error && (
              <div className="flex items-center text-destructive text-sm p-3 bg-destructive/10 rounded-md">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || !password}>
              {isLoading ? 'Verifying...' : 'Unlock Test'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
