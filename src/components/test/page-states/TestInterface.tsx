
'use client';

import { QuestionDisplay } from '@/components/test/QuestionDisplay';
import { TestInterfaceHeader } from './TestInterfaceHeader';
import { TestInterfaceFooter } from './TestInterfaceFooter';
import { TestInterfaceFeedbackOverlay } from './TestInterfaceFeedbackOverlay';
import { TestInterfaceTocSheet } from './TestInterfaceTocSheet';
import { TestInterfaceImageModal } from './TestInterfaceImageModal';
import { UnansweredWarningDialog } from './UnansweredWarningDialog';
import type { Test, Question, UserAnswer } from '@/lib/types';
import type { useTestEngine } from '@/hooks/useTestEngine';
import { useState } from 'react';

type TestEngineActions = ReturnType<typeof useTestEngine>['actions'];

interface TestInterfaceProps {
  testData: Test;
  activeQuestions: Question[];
  userAnswers: UserAnswer[];
  currentQuestionIndex: number;
  timeLeft: number;
  userId: string | null;
  testMode: 'training' | 'testing' | 'race' | null;
  isTocOpen: boolean;
  isImageModalOpen: boolean;
  modalImageUrl: string | null;
  feedbackType: 'correct' | 'incorrect' | null;
  showFeedback: boolean;
  actions: TestEngineActions;
}

export function TestInterface({
  testData,
  activeQuestions,
  userAnswers,
  currentQuestionIndex,
  timeLeft,
  userId,
  testMode,
  isTocOpen,
  isImageModalOpen,
  modalImageUrl,
  feedbackType,
  showFeedback,
  actions,
}: TestInterfaceProps) {

  const [showUnansweredWarning, setShowUnansweredWarning] = useState(false);
  const currentQuestion = activeQuestions[currentQuestionIndex];
  
  return (
    <div className="max-w-3xl mx-auto relative pb-24 md:pb-0">
      <TestInterfaceFeedbackOverlay show={showFeedback} type={feedbackType} />
      
      <TestInterfaceTocSheet
        isOpen={isTocOpen}
        setIsOpen={actions.setIsTocOpen}
        activeQuestions={activeQuestions}
        currentQuestionIndex={currentQuestionIndex}
        testMode={testMode}
        getIsQuestionAnswered={actions.getIsQuestionAnswered}
        onNavigate={actions.setCurrentQuestionIndex}
      />
      
      <TestInterfaceHeader
        testTitle={testData.title}
        testMode={testMode}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={activeQuestions.length}
        timeLeft={timeLeft}
        userId={userId}
      />

      <QuestionDisplay
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={activeQuestions.length}
        userAnswer={userAnswers.find(ans => ans.questionId === currentQuestion.id)?.answer}
        onAnswerChange={actions.handleAnswerChange}
        onResetAnswer={actions.handleResetAnswer}
        isAnswered={actions.getIsQuestionAnswered(currentQuestion.id)}
        testMode={testMode}
        onImageClick={actions.openImageModal}
      />

      <TestInterfaceFooter
        isLastQuestion={currentQuestionIndex === activeQuestions.length - 1}
        isFirstQuestion={currentQuestionIndex === 0}
        testMode={testMode}
        onNext={actions.goToNextQuestion}
        onPrevious={actions.goToPreviousQuestion}
        onSubmit={() => actions.handleSubmitTest()}
      />

      <UnansweredWarningDialog
        isOpen={showUnansweredWarning}
        setIsOpen={setShowUnansweredWarning}
        onConfirm={actions.proceedWithSubmission}
        unansweredCount={actions.getIsQuestionAnswered(currentQuestion.id) ? 0 : 1}
      />
      
      <TestInterfaceImageModal
        isOpen={isImageModalOpen}
        onClose={actions.closeImageModal}
        imageUrl={modalImageUrl}
      />
    </div>
  );
}
