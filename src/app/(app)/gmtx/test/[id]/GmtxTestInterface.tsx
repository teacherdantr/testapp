
'use client';

import { useState, useEffect } from 'react';
import type { Test, Question, Option, TestResult } from '@/lib/types';
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
  Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GmtxMcmaDisplay } from '@/components/gmtx/test/question-types/GmtxMcmaDisplay';
import { GmtxMtfDisplay } from '@/components/gmtx/test/question-types/GmtxMtfDisplay';
import { GmtxDragDropDisplay } from '@/components/gmtx/test/question-types/GmtxDragDropDisplay';
import { GmtxHotspotDisplay } from '@/components/gmtx/test/question-types/GmtxHotspotDisplay';
import { GmtxMatchingSelectDisplay } from '@/components/gmtx/test/question-types/GmtxMatchingSelectDisplay';
import { QuestionType } from '@/lib/types';
import Image from 'next/image';
import { GmtxReviewPage } from '@/components/gmtx/test/GmtxReviewPage';
import { GmtxTestTocSheet } from '@/components/gmtx/test/GmtxTestTocSheet';
import { GmtxResultsPage } from '@/components/gmtx/test/GmtxResultsPage';


interface GmtxTestInterfaceProps {
  test: Test;
}

export enum TestPageState {
  TakingTest,
  Review,
  Submitting,
  Results,
}

export function GmtxTestInterface({ test }: GmtxTestInterfaceProps) {
  const [pageState, setPageState] = useState<TestPageState>(TestPageState.TakingTest);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [startTime] = useState(Date.now());


  const totalQuestions = test.questions.length;
  
  const getIsQuestionAnswered = (questionId: string): boolean => {
    const answer = selectedAnswers[questionId];
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer) && answer.length === 0) return false;
    if (typeof answer === 'string' && answer.trim() === '') return false;
    if (typeof answer === 'object' && Object.keys(answer).length === 0) return false;
     // For MTF/Matrix which could be object with number keys
    if (typeof answer === 'object' && Object.values(answer).every(val => val === null || val === undefined || val === '')) return false;

    return true;
  };

  const currentQuestion = test.questions[currentQuestionIndex];
  
  const handleSelectAnswer = (questionId: string, answer: any) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setPageState(TestPageState.Review);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const resetCurrentAnswer = () => {
    const newSelectedAnswers = { ...selectedAnswers };
    delete newSelectedAnswers[currentQuestion.id];
    setSelectedAnswers(newSelectedAnswers);
  };
  
  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setPageState(TestPageState.TakingTest);
  };
  
  const submitTest = () => {
      setPageState(TestPageState.Submitting);

      // --- Result Calculation Logic ---
      let score = 0;
      const totalPoints = test.questions.reduce((sum, q) => sum + q.points, 0);

      const questionResults = test.questions.map(q => {
          const userAnswer = selectedAnswers[q.id];
          let isCorrect = false;

          // Simple equality check for now, can be expanded
          if (JSON.stringify(userAnswer) === JSON.stringify(q.correctAnswer)) {
              isCorrect = true;
          }

          const pointsEarned = isCorrect ? q.points : 0;
          if (isCorrect) {
              score += q.points;
          }

          return {
              questionId: q.id,
              questionText: q.text,
              questionType: q.type,
              userAnswer: userAnswer || null,
              correctAnswer: q.correctAnswer,
              isCorrect: isCorrect,
              pointsEarned: pointsEarned,
              pointsPossible: q.points,
          };
      });
      // --- End Result Calculation ---

      const timeTaken = Math.round((Date.now() - startTime) / 1000);

      const result: TestResult = {
        testId: test.id,
        userId: 'Phuoc Binh', // Hardcoded for now
        testTitle: test.title,
        score: score,
        totalPoints: totalPoints,
        questionResults: questionResults as any, // Cast for simplicity
        timeTaken: timeTaken,
      }
      setTestResult(result);

      // Simulate submission delay then show results
      setTimeout(() => {
        setPageState(TestPageState.Results);
      }, 1000);
  };


  const renderQuestionContent = (question: Question) => {
    switch (question.type) {
        case QuestionType.MultipleChoiceMultipleAnswer:
        case QuestionType.MCQ:
            return (
                <GmtxMcmaDisplay
                    question={question}
                    selectedOptions={selectedAnswers[question.id] || []}
                    onSelectOption={(optionId) => {
                       if (question.type === QuestionType.MCQ) {
                           handleSelectAnswer(question.id, [optionId]);
                       } else { // MCMA
                           const currentSelection = (selectedAnswers[question.id] as string[]) || [];
                           const newSelection = currentSelection.includes(optionId)
                             ? currentSelection.filter(id => id !== optionId)
                             : [...currentSelection, optionId];
                           handleSelectAnswer(question.id, newSelection);
                       }
                    }}
                />
            );
        case QuestionType.MultipleTrueFalse:
            return (
                <GmtxMtfDisplay
                    question={question}
                    currentAnswers={selectedAnswers[question.id] as Record<number, 'true' | 'false'> || {}}
                    onAnswerChange={(statementIndex, value) => {
                        const currentAns = (selectedAnswers[question.id] as Record<number, 'true'|'false'>) || {};
                        handleSelectAnswer(question.id, {
                            ...currentAns,
                            [statementIndex]: value,
                        })
                    }}
                 />
            );
        case QuestionType.MatchingDragAndDrop:
            return (
                <GmtxDragDropDisplay
                    question={question}
                    currentAnswers={selectedAnswers[question.id] || {}}
                    onAnswerChange={(matches) => handleSelectAnswer(question.id, matches)}
                />
            );
        case QuestionType.Hotspot:
            return (
                <GmtxHotspotDisplay
                    question={question}
                    currentAnswer={selectedAnswers[question.id] || []}
                    onAnswerChange={(answer) => handleSelectAnswer(question.id, answer)}
                />
            );
        case QuestionType.MatchingSelect:
            return (
                <GmtxMatchingSelectDisplay
                    question={question}
                    currentAnswers={selectedAnswers[question.id] || {}}
                    onAnswerChange={(matches) => handleSelectAnswer(question.id, matches)}
                />
            );
        default:
            return (
              <Card className="bg-muted p-4">
                <p className="font-semibold text-destructive">This question type ({question.type}) is not yet supported in the UI.</p>
                <p className="text-sm mt-2">Raw Question Data:</p>
                <pre className="text-xs bg-background p-2 rounded-md overflow-x-auto mt-1">
                  {JSON.stringify(question, null, 2)}
                </pre>
              </Card>
            )
    }
  };

  if (pageState === TestPageState.Review || pageState === TestPageState.Submitting) {
    return (
        <GmtxReviewPage
            test={test}
            getIsQuestionAnswered={getIsQuestionAnswered}
            onNavigateToQuestion={navigateToQuestion}
            onSubmitTest={submitTest}
            isSubmitting={pageState === TestPageState.Submitting}
        />
    );
  }

  if (pageState === TestPageState.Results && testResult) {
      return (
          <GmtxResultsPage result={testResult} />
      )
  }

  return (
    <div className="flex-1 flex flex-col" style={{ backgroundImage: 'url(/images/gmtx/bg_gm.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
       <GmtxTestTocSheet
        isOpen={isTocOpen}
        setIsOpen={setIsTocOpen}
        questions={test.questions}
        currentQuestionIndex={currentQuestionIndex}
        getIsQuestionAnswered={getIsQuestionAnswered}
        onNavigate={(index) => {
            setCurrentQuestionIndex(index);
            setIsTocOpen(false);
        }}
      />
      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <header className="bg-white p-3 rounded-t-lg border-b shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Trước
                </Button>
                <Button variant="secondary" size="sm" onClick={resetCurrentAnswer}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Đặt lại
                </Button>
                <span className="text-sm text-muted-foreground font-medium">
                  {currentQuestionIndex + 1}/{totalQuestions} (ID: {currentQuestion.id.slice(0, 6)})
                </span>
              </div>
              <div className="flex items-center gap-2 border-l border-r px-3 mx-2">
                 <Button variant="ghost" size="icon" className="h-8 w-8"><ListOrdered className="h-5 w-5"/></Button>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsTocOpen(true)}><List className="h-5 w-5"/></Button>
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
                 {currentQuestionIndex === totalQuestions - 1 ? (
                    <Button onClick={goToNextQuestion}>
                        Xem lại & Nộp bài <Send className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={goToNextQuestion}>
                        Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
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
              {currentQuestion.imageUrl && ![QuestionType.Hotspot, QuestionType.MultipleTrueFalse].includes(currentQuestion.type) && (
                <div className="relative w-full max-w-lg mx-auto aspect-video border rounded-md overflow-hidden">
                  <Image
                    src={currentQuestion.imageUrl}
                    alt={`Illustration for question`}
                    fill
                    className="object-contain"
                    data-ai-hint="question image"
                  />
                </div>
              )}
               {renderQuestionContent(currentQuestion)}
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="p-4 flex justify-center">
        <Image src="/images/gmtx/LOGOGMETRNG_rmbg.png" alt="GMTX Logo" width={195} height={52} data-ai-hint="logo" />
      </footer>
    </div>
  );
}
