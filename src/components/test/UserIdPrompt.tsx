
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCircle, RefreshCw, PlusCircle } from 'lucide-react';

interface UserIdPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdentifierSubmit: (identifier: string) => void;
}

const MAX_RECENT_IDS = 5;
const LOCAL_STORAGE_KEY = 'testwave_recentUserIds';

export function UserIdPrompt({ open, onOpenChange, onIdentifierSubmit }: UserIdPromptProps) {
  const [identifierInput, setIdentifierInput] = useState('');
  const [selectedIdentifier, setSelectedIdentifier] = useState<string | undefined>(undefined);
  const [recentIdentifiers, setRecentIdentifiers] = useState<string[]>([]);
  const [showInputField, setShowInputField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      try {
        const storedIds = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsedIds: string[] = storedIds ? JSON.parse(storedIds) : [];
        setRecentIdentifiers(parsedIds);
        if (parsedIds.length > 0) {
          setSelectedIdentifier(parsedIds[0]); // Pre-select the most recent one
          setShowInputField(false);
        } else {
          setShowInputField(true); // No recent IDs, show input field directly
        }
        setIdentifierInput(''); // Clear input field when dialog opens
      } catch (error) {
        console.error("Error loading recent identifiers from localStorage:", error);
        setRecentIdentifiers([]);
        setShowInputField(true);
      }
    }
  }, [open]);

  const saveIdentifier = (idToSave: string) => {
    try {
      let updatedIds = [idToSave, ...recentIdentifiers.filter(id => id !== idToSave)];
      if (updatedIds.length > MAX_RECENT_IDS) {
        updatedIds = updatedIds.slice(0, MAX_RECENT_IDS);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedIds));
      setRecentIdentifiers(updatedIds);
    } catch (error) {
      console.error("Error saving identifier to localStorage:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalIdentifier = showInputField ? identifierInput.trim() : selectedIdentifier;

    if (!finalIdentifier || finalIdentifier.trim() === '') {
      alert("Please enter or select an identifier.");
      return;
    }
    setIsLoading(true);
    await onIdentifierSubmit(finalIdentifier);
    saveIdentifier(finalIdentifier);
    setIsLoading(false);
    // Dialog should be closed by parent component by changing 'open' prop
  };

  const canSubmit = showInputField ? identifierInput.trim() !== '' : !!selectedIdentifier;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <UserCircle className="mr-2 h-7 w-7 text-primary" />
            Enter Your Identifier
          </DialogTitle>
          <DialogDescription>
            Select a recent identifier or enter a new one to save your test score.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {recentIdentifiers.length > 0 && !showInputField && (
              <div className="space-y-2">
                <Label htmlFor="recent-identifier-select">Select Recent Identifier</Label>
                <Select
                  value={selectedIdentifier}
                  onValueChange={setSelectedIdentifier}
                >
                  <SelectTrigger id="recent-identifier-select">
                    <SelectValue placeholder="Select a recent identifier" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentIdentifiers.map(id => (
                      <SelectItem key={id} value={id}>{id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="link"
                  className="px-0 h-auto text-sm"
                  onClick={() => {
                    setShowInputField(true);
                    setSelectedIdentifier(undefined); // Clear selection when switching to input
                  }}
                >
                  <PlusCircle className="mr-1 h-4 w-4" /> Enter a different name
                </Button>
              </div>
            )}

            {(showInputField || recentIdentifiers.length === 0) && (
              <div className="space-y-2">
                <Label htmlFor="identifier-input">Your Identifier (Name/Nickname)</Label>
                <Input
                  id="identifier-input"
                  type="text"
                  value={identifierInput}
                  onChange={(e) => setIdentifierInput(e.target.value)}
                  placeholder="e.g., AlexP"
                  autoFocus={showInputField}
                  required={showInputField}
                />
                {recentIdentifiers.length > 0 && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-sm"
                    onClick={() => {
                      setShowInputField(false);
                      setIdentifierInput(''); // Clear input when switching
                      if (recentIdentifiers.length > 0) setSelectedIdentifier(recentIdentifiers[0]);
                    }}
                  >
                    <RefreshCw className="mr-1 h-4 w-4" /> Select from recent names
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading ? 'Starting...' : 'Start Test'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
