
'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';
import { Check, Square } from 'lucide-react';

interface TocSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  questions: Question[];
  currentQuestionIndex: number;
  getIsQuestionAnswered: (questionId: string) => boolean;
  onNavigate: (index: number) => void;
}

export function GmtxTestTocSheet({
  isOpen,
  setIsOpen,
  questions,
  currentQuestionIndex,
  getIsQuestionAnswered,
  onNavigate,
}: TocSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 flex flex-col" data-ai-hint="questions list">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Questions</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-grow p-2 space-y-1">
          {questions.map((q, index) => {
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
                onClick={() => onNavigate(index)}
              >
                {isAnswered ? (
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-green-600")} />
                ) : (
                  <Square className={cn("mr-2 h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
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
