
'use client';

import { useTestEngine, TestPageState } from '@/hooks/useTestEngine';

import { TestPageLoading } from '@/components/test/page-states/TestPageLoading';
import { TestPageError } from '@/components/test/page-states/TestPageError';
import { PasswordPrompt } from '@/components/test/PasswordPrompt';
import { UserIdPrompt } from '@/components/test/UserIdPrompt';
import { ModeSelectionPrompt } from '@/components/test/ModeSelectionPrompt';
import { TestInterface } from '@/components/test/page-states/TestInterface';
import { TestSubmitting } from '@/components/test/page-states/TestSubmitting';
import { RaceFinishedScreen } from '@/components/test/page-states/RaceFinishedScreen';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';

export default function TestPage() {
  const {
    state,
    error,
    studentViewData,
    testData,
    activeQuestions,
    userAnswers,
    testResult,
    passwordError,
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
    pageStateRef
  } = useTestEngine();


  switch (state.pageState) {
    case TestPageState.Loading:
      return <TestPageLoading />;

    case TestPageState.Error:
      return <TestPageError errorMessage={error.errorMessage} />;

    case TestPageState.PasswordPrompt:
      return (
        <PasswordPrompt
          open={true}
          onVerify={actions.handlePasswordVerify}
          error={passwordError}
          onOpenChange={() => { if (pageStateRef.current === TestPageState.PasswordPrompt) actions.handleClosePrompt(); }}
        />
      );

    case TestPageState.UserIdPrompt:
      return (
        <UserIdPrompt
          open={true}
          onIdentifierSubmit={actions.handleUserIdSubmit}
          onOpenChange={() => { if (pageStateRef.current === TestPageState.UserIdPrompt) actions.handleClosePrompt(); }}
        />
      );

    case TestPageState.ModeSelection:
      return (
        <ModeSelectionPrompt
          open={true}
          onModeSelect={actions.handleModeSelect}
          onOpenChange={() => { if (pageStateRef.current === TestPageState.ModeSelection) actions.handleClosePrompt(); }}
        />
      );
    
    case TestPageState.TakingTest:
      if (!testData || activeQuestions.length === 0) {
        return <TestPageError errorMessage="Test data or questions are not available." />;
      }
      return (
        <TestInterface
          testData={testData}
          activeQuestions={activeQuestions}
          userAnswers={userAnswers}
          currentQuestionIndex={currentQuestionIndex}
          timeLeft={timeLeft}
          userId={userId}
          testMode={testMode}
          isTocOpen={isTocOpen}
          isImageModalOpen={isImageModalOpen}
          modalImageUrl={modalImageUrl}
          feedbackType={feedbackType}
          showFeedback={showFeedback}
          actions={actions}
        />
      );
      
    case TestPageState.Submitting:
        return <TestSubmitting />;

    case TestPageState.RaceFinished:
        return (
            <RaceFinishedScreen 
                userId={userId} 
                onViewResults={actions.proceedWithSubmission}
                onRetry={actions.handleRetryTest}
            />
        );

    case TestPageState.Results:
      if (!testResult) {
        return <TestPageError errorMessage="Test results are not available." />;
      }
      return (
        <ResultsDisplay
          results={testResult}
          testId={testData!.id}
          onRetry={actions.handleRetryTest}
        />
      );

    default:
        if (studentViewData && studentViewData.questions.length === 0) {
            return <TestPageError errorMessage="This test currently has no questions. Please contact the administrator." showHomeButton={true}/>;
        }
      return null;
  }
}
