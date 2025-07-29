
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UnansweredWarningDialogProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onConfirm: () => void;
    unansweredCount: number;
}

export function UnansweredWarningDialog({ isOpen, setIsOpen, onConfirm, unansweredCount }: UnansweredWarningDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unanswered Questions</AlertDialogTitle>
                <AlertDialogDescription>
                   You have {unansweredCount} unanswered question(s). Are you sure you want to submit?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  setIsOpen(false);
                  await onConfirm();
                }}>Submit Anyway</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
