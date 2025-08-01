
'use client';

import { useState } from 'react';
import type { Test, Question, Option } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  RotateCcw,
  ListOrdered,
  List,
  CaseSensitive,
  Check,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GmtxMcmaDisplay } from '@/components/gmtx/test/question-types/GmtxMcmaDisplay';
import { QuestionType } from '@/lib/types';

interface GmtxTestInterfaceProps {
  test: Test;
}

export function GmtxTestInterface({ test }: GmtxTestInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string[]>>({});

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;

  const handleSelectAnswer = (questionId: string, optionId: string) => {
    const currentSelection = selectedAnswers[questionId] || [];
    const newSelection = currentSelection.includes(optionId)
      ? currentSelection.filter(id => id !== optionId)
      : [...currentSelection, optionId];
    
    setSelectedAnswers(prev => ({ ...prev, [questionId]: newSelection }));
  };

  const renderQuestionContent = (question: Question) => {
    switch (question.type) {
        case QuestionType.MultipleChoiceMultipleAnswer:
        case QuestionType.MCQ: // For now, we treat single-choice like multi-choice
            return (
                <GmtxMcmaDisplay
                    question={question}
                    selectedOptions={selectedAnswers[question.id] || []}
                    onSelectOption={(optionId) => handleSelectAnswer(question.id, optionId)}
                />
            );
        // Add cases for other question types here later
        default:
            return <p>This question type ({question.type}) is not yet supported.</p>;
    }
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
             {renderQuestionContent(currentQuestion)}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
