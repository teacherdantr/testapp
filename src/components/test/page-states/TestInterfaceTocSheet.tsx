
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';
import { CheckCircle2, Circle, List } from 'lucide-react';

interface TocSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeQuestions: Question[];
  currentQuestionIndex: number;
  testMode: 'training' | 'testing' | 'race' | null;
  getIsQuestionAnswered: (questionId: string) => boolean;
  onNavigate: (index: number) => void;
}

export function TestInterfaceTocSheet({
  isOpen,
  setIsOpen,
  activeQuestions,
  currentQuestionIndex,
  testMode,
  getIsQuestionAnswered,
  onNavigate,
}: TocSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-20 right-4 z-50 shadow-lg bg-card hover:bg-accent rounded-full"
          aria-label="Toggle Table of Contents"
        >
          <List className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col" data-ai-hint="questions list">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Questions ({testMode === 'testing' || testMode === 'race' ? 'Random Order' : 'Sequential Order'})</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-grow p-2 space-y-1">
          {activeQuestions.map((q, index) => {
            const isAnswered = getIsQuestionAnswered(q.id);
            const isCurrent = index === currentQuestionIndex;
            return (
              <Button
                key={q.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left h-auto py-2.5 px-3 rounded-md",
                  isCurrent && "bg-primary/15 text-primary font-semibold",
                  !isCurrent && isAnswered && "hover:bg-green-500/10",
                  !isCurrent && !isAnswered && "hover:bg-accent/50"
                )}
                onClick={() => {
                  onNavigate(index);
                  setIsOpen(false);
                }}
                disabled={testMode === 'race'} 
              >
                {isAnswered ? (
                  <CheckCircle2 className={cn("mr-2 h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-green-600")} />
                ) : (
                  <Circle className={cn("mr-2 h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
                )}
                <span className={cn("truncate", isCurrent ? "text-primary" : isAnswered ? "text-green-700 dark:text-green-400" : "text-foreground/80")}>
                  Question {index + 1}
                </span>
              </Button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
