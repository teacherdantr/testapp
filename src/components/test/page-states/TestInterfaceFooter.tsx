
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Send, Goal } from 'lucide-react';

interface TestInterfaceFooterProps {
  isLastQuestion: boolean;
  isFirstQuestion: boolean;
  testMode: 'training' | 'testing' | 'race' | null;
  onNext: () => void;
  onPrevious: () => void;
  onSubmit: () => void;
}

export function TestInterfaceFooter({
  isLastQuestion,
  isFirstQuestion,
  testMode,
  onNext,
  onPrevious,
  onSubmit,
}: TestInterfaceFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t p-4 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 md:mt-8">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <Button onClick={onPrevious} disabled={isFirstQuestion || testMode === 'race'} variant="outline" className="w-1/3 md:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {isLastQuestion ? (
          testMode === 'race' ? (
            <Button onClick={onNext} variant="default" size="lg" className="w-1/3 md:w-auto bg-green-600 hover:bg-green-700">
              <Goal className="mr-2 h-5 w-5" /> Finish Race!
            </Button>
          ) : ( 
            <Button onClick={onSubmit} variant="default" size="lg" className="w-1/3 md:w-auto">
              <Send className="mr-2 h-5 w-5" /> Submit
            </Button>
          )
        ) : (
          <Button onClick={onNext} variant="default" className="w-1/3 md:w-auto">
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
