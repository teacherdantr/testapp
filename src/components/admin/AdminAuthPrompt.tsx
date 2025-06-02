
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyAdminPassword } from '@/lib/actions/adminActions';
import { KeyRound, AlertTriangle } from 'lucide-react';

interface AdminAuthPromptProps {
  onSuccess: () => void;
}

export function AdminAuthPrompt({ onSuccess }: AdminAuthPromptProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await verifyAdminPassword(password);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Authentication failed.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-background">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <KeyRound className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-3xl">Admin Access Required</CardTitle>
          <CardDescription>
            Please enter the admin password to manage TestWave.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
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
          <CardFooter>
            <Button type="submit" className="w-full text-lg h-12" disabled={isLoading || !password}>
              {isLoading ? 'Verifying...' : 'Unlock Admin Panel'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
