
'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Zap, Rocket } from 'lucide-react';

interface ModeSelectionPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModeSelect: (mode: 'training' | 'testing' | 'race') => void;
}

export function ModeSelectionPrompt({ open, onOpenChange, onModeSelect }: ModeSelectionPromptProps) {
  const handleSelectTraining = () => {
    onModeSelect('training');
  };

  const handleSelectTesting = () => {
    onModeSelect('testing');
  };

  const handleSelectRace = () => {
    onModeSelect('race');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            Choose Your Test Mode
          </DialogTitle>
          <DialogDescription>
            Select how you'd like to take this test.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button
            onClick={handleSelectTraining}
            className="w-full h-16 text-lg flex items-center justify-center"
            variant="outline"
          >
            <Users className="mr-3 h-6 w-6" />
            Training Mode
          </Button>
          <p className="text-sm text-muted-foreground px-1">
            Questions and answers appear in their defined order. Good for learning and review.
          </p>

          <Button
            onClick={handleSelectTesting}
            className="w-full h-16 text-lg flex items-center justify-center"
            variant="default" // Default variant for standard testing
          >
            <Zap className="mr-3 h-6 w-6" />
            Testing Mode
          </Button>
           <p className="text-sm text-muted-foreground px-1">
            Question order is randomized. Answer options for multiple-choice questions are also randomized. Answers checked at the end.
          </p>

          <Button
            onClick={handleSelectRace}
            className="w-full h-16 text-lg flex items-center justify-center bg-green-600 hover:bg-green-700 text-primary-foreground" // Distinct styling for Race Mode
          >
            <Rocket className="mr-3 h-6 w-6" />
            Race Mode
          </Button>
           <p className="text-sm text-muted-foreground px-1">
            Randomized questions & MCQ/MCMA answers. Answer checked immediately. If incorrect, reset to Q1!
          </p>
        </div>
        <DialogFooter className="sm:justify-center">
            <p className="text-xs text-muted-foreground">You can select a mode to start the test.</p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

