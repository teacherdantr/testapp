
'use client';

import { useState } from 'react';
import type { Test, Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  RotateCcw,
  ListOrdered,
  List,
  CaseSensitive,
  MoreVertical,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface GmtxTestInterfaceProps {
  test: Test;
}

function McmaOption({ option, isSelected, onSelect }: { option: Option, isSelected: boolean, onSelect: (optionId: string) => void }) {
  return (
    <div
      onClick={() => onSelect(option.id)}
      className={cn(
        'flex items-center p-4 rounded-md border cursor-pointer transition-colors',
        isSelected
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-gray-200 hover:bg-gray-300 border-gray-300'
      )}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded-full border border-current mr-4">
        {isSelected && <div className="h-3 w-3 rounded-full bg-current" />}
      </div>
      <span className="flex-1">{option.text}</span>
    </div>
  );
}

export function GmtxTestInterface({ test }: GmtxTestInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;

  const handleSelectAnswer = (optionId: string) => {
    const currentSelection = selectedAnswers[currentQuestion.id] || [];
    const newSelection = currentSelection.includes(optionId)
      ? currentSelection.filter(id => id !== optionId)
      : [...currentSelection, optionId];
    
    setSelectedAnswers(prev => ({ ...prev, [currentQuestion.id]: newSelection }));
  };

  return (
    <main className="flex-1 flex flex-col bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <header className="bg-white p-3 rounded-t-lg border-b shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-y-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Trước</Button>
              <Button variant="secondary" size="sm"><RotateCcw className="h-4 w-4 mr-1" /> Đặt lại</Button>
              <span className="text-sm text-muted-foreground font-medium">
                {currentQuestionIndex + 1}/{totalQuestions} (ID: {currentQuestion.id.slice(0, 6)})
              </span>
            </div>
            <div className="flex items-center gap-2 border-l border-r px-3 mx-2">
               <Button variant="ghost" size="icon" className="h-8 w-8"><ListOrdered className="h-5 w-5"/></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8"><List className="h-5 w-5"/></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8"><CaseSensitive className="h-5 w-5"/></Button>
            </div>
             <div className="flex items-center gap-2 text-blue-600 font-bold">
                <div className="relative h-10 w-10">
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-gray-200" strokeWidth="2"></circle>
                        <circle cx="18" cy="18" r="16" fill="none" className="stroke-current" strokeWidth="2" strokeDasharray="100 100" strokeDashoffset="-20"></circle>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs">48:05</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">Mark ...</Button>
              <Button variant="outline">Bỏ qua <ChevronRight className="h-4 w-4 ml-1" /></Button>
              <Button>Tiếp <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
          </div>
        </header>
        
        {/* Progress Bar */}
        <div className="bg-white p-1">
             <Progress value={(currentQuestionIndex + 1) / totalQuestions * 100} className="h-1.5" />
        </div>

        {/* Question Body */}
        <Card className="rounded-t-none shadow-sm">
          <CardContent className="p-6 space-y-6">
            <p className="text-lg font-medium">{currentQuestion.text}</p>
            <div className="space-y-3">
              {(currentQuestion.options || []).map(option => (
                <McmaOption
                  key={option.id}
                  option={option}
                  isSelected={(selectedAnswers[currentQuestion.id] || []).includes(option.id)}
                  onSelect={() => handleSelectAnswer(option.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
