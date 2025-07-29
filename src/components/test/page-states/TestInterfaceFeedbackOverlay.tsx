
'use client';

import { CheckCircle2, XCircle } from 'lucide-react';

interface FeedbackOverlayProps {
  show: boolean;
  type: 'correct' | 'incorrect' | null;
}

export function TestInterfaceFeedbackOverlay({ show, type }: FeedbackOverlayProps) {
  if (!show || !type) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-fadeIn">
      <div className="bg-card p-8 rounded-lg shadow-2xl text-center animate-scaleUp mx-4">
        {type === 'correct' ? (
          <>
            <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
            <p className="text-3xl font-bold text-green-500">Correct!</p>
          </>
        ) : (
          <>
            <XCircle className="h-20 w-20 text-red-500 mx-auto mb-4" />
            <p className="text-3xl font-bold text-red-500">Incorrect!</p>
            <p className="text-muted-foreground mt-2 text-lg">Resetting to Question 1...</p>
          </>
        )}
      </div>
    </div>
  );
}
