
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { fetchTestById, fetchAdminTestById } from '@/lib/actions/test/getTests';
import { verifyTestPassword, submitTest } from '@/lib/actions/test/submitTest';
import type { Test, UserAnswer, TestResult, Question } from '@/lib/types';
import { QuestionType } from '@/lib/types';

export enum TestPageState {
  Loading,
  PasswordPrompt,
  UserIdPrompt,
  ModeSelection,
  TakingTest,
  Submitting,
  Results,
  Error,
  RaceFinished,
}

const TEST_DURATION_SECONDS = 15 * 60; // 15 minutes

export function useTestEngine() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const testId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pageState, setPageState] = useState<TestPageState>(TestPageState.Loading);
  const [testData, setTestData] = useState<Test | null>(null);
  const [studentViewData, setStudentViewData] = useState<Test | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showUnansweredWarningDialog, setShowUnansweredWarningDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(TEST_DURATION_SECONDS);
  const [testMode, setTestMode] = useState<'training' | 'testing' | 'race' | null>(null);
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  
  const pageStateRef = useRef(pageState);
  useEffect(() => {
    pageStateRef.current = pageState;
  }, [pageState]);

  const proceedWithSubmission = useCallback(async () => {
    if (pageStateRef.current !== TestPageState.TakingTest && pageStateRef.current !== TestPageState.RaceFinished) {
      if (pageStateRef.current === TestPageState.Submitting) console.warn("Submission already in progress.");
      return;
    }
    if (!testData || !userId || activeQuestions.length === 0) {
      setErrorMessage('Test data, User ID, or questions are missing for submission.');
      setPageState(TestPageState.Error);
      return;
    }
    setPageState(TestPageState.Submitting);
    try {
      const timeTaken = TEST_DURATION_SECONDS - timeLeft;
      const result = await submitTest(testId as string, userId, userAnswers, timeTaken, testMode);
      if ('error' in result) {
        setErrorMessage(result.error);
        setPageState(TestPageState.Error);
        toast({ title: "Submission Error", description: result.error, variant: "destructive" });
      } else {
        setTestResult(result);
        setPageState(TestPageState.Results);
        toast({ title: "Test Submitted Successfully!", description: "Your results are now available to view." });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage('Failed to submit the test. Please try again.');
      setPageState(TestPageState.Error);
      toast({ title: "Submission Error", description: "An unexpected error occurred.", variant: "destructive" });
    }
  }, [testId, userId, userAnswers, testData, activeQuestions, timeLeft, toast, testMode]);

  const loadTest = useCallback(async () => {
    if (!testId) {
      setErrorMessage('Test ID is missing.');
      setPageState(TestPageState.Error);
      return;
    }
    try {
      setPageState(TestPageState.Loading);
      const dataForStudentView = await fetchTestById(testId as string);
      const fullTestDataFromDb = await fetchAdminTestById(testId as string);

      if (!dataForStudentView || !fullTestDataFromDb) {
        setErrorMessage('Test not found.');
        setPageState(TestPageState.Error);
        return;
      }
      
      setStudentViewData(dataForStudentView);
      setTestData(fullTestDataFromDb);

      if (dataForStudentView.password === 'protected') {
        setPageState(TestPageState.PasswordPrompt);
      } else {
        setPageState(TestPageState.UserIdPrompt);
      }
    } catch (error) {
      console.error("Error loading test:", error);
      setErrorMessage('Failed to load the test. Please try again later.');
      setPageState(TestPageState.Error);
    }
  }, [testId]);

  useEffect(() => {
    loadTest();
  }, [loadTest]);

  useEffect(() => {
    if (pageState !== TestPageState.TakingTest) return;
    if (timeLeft <= 0) return;
    const intervalId = setInterval(() => setTimeLeft((prevTime) => prevTime - 1), 1000);
    return () => clearInterval(intervalId);
  }, [pageState, timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0 && pageStateRef.current === TestPageState.TakingTest) {
      toast({
        title: "Time's Up!",
        description: "Your test has been automatically submitted.",
        variant: "destructive",
      });
      proceedWithSubmission();
    }
  }, [timeLeft, proceedWithSubmission, toast]);

  const handlePasswordVerify = async (password: string) => {
    setPasswordError(null);
    const result = await verifyTestPassword(testId as string, password);
    if (result.authorized) {
      setPageState(TestPageState.UserIdPrompt);
      return true;
    } else {
      setPasswordError(result.error || 'Incorrect password.');
      return false;
    }
  };

  const handleUserIdSubmit = (identifier: string) => {
    setUserId(identifier);
    setPageState(TestPageState.ModeSelection); 
  };

  const handleModeSelect = (mode: 'training' | 'testing' | 'race') => {
    setTestMode(mode);
    if (!testData) {
      setErrorMessage('Test data is not available for mode selection.');
      setPageState(TestPageState.Error);
      return;
    }

    let questionsToUse = [...testData.questions];

    if (mode === 'testing' || mode === 'race') {
      questionsToUse = [...questionsToUse].sort(() => Math.random() - 0.5);
    }
    
    const studentViewQuestions = questionsToUse.map(q => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { correctAnswer, ...rest } = q;
      return {
        ...rest,
        choices: (q.type === QuestionType.MatchingSelect && Array.isArray(q.choices)) ? [...q.choices].sort(() => Math.random() - 0.5) : q.choices,
      } as Question;
    });

    setActiveQuestions(studentViewQuestions);
    setTimeLeft(TEST_DURATION_SECONDS);
    setCurrentQuestionIndex(0);
    setUserAnswers([]); 
    setTestResult(null);
    setPageState(TestPageState.TakingTest);
  };
  
  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers((prevAnswers) => {
      const existingAnswerIndex = prevAnswers.findIndex((a) => a.questionId === questionId);
      if (existingAnswerIndex > -1) {
        const updatedAnswers = [...prevAnswers];
        updatedAnswers[existingAnswerIndex] = { questionId, answer };
        return updatedAnswers;
      }
      return [...prevAnswers, { questionId, answer }];
    });
  };

  const handleResetAnswer = (questionId: string) => {
    setUserAnswers(prevAnswers => prevAnswers.filter(a => a.questionId !== questionId));
    toast({
        title: 'Answer Cleared',
        description: 'Your answer for this question has been reset.',
    });
  };

  const countUnansweredQuestions = () => {
    // ... (rest of the function is the same)
    if (activeQuestions.length === 0) return 0;
    return activeQuestions.filter(q => {
        const userAnswer = userAnswers.find(ua => ua.questionId === q.id);
        if (!userAnswer || userAnswer.answer.trim() === '') return true;
        if (q.type === QuestionType.MultipleChoiceMultipleAnswer || (q.type === QuestionType.Hotspot && q.multipleSelection)) {
            try { const parsed = JSON.parse(userAnswer.answer); return !Array.isArray(parsed) || parsed.length === 0; } catch { return true; }
        }
        if (q.type === QuestionType.Hotspot && !q.multipleSelection) {
             try { const parsed = JSON.parse(userAnswer.answer); return !Array.isArray(parsed) || parsed.length !== 1 || !parsed[0]; } catch { return true; }
        }
        if (q.type === QuestionType.MultipleTrueFalse || q.type === QuestionType.MatrixChoice) {
            try { const parsed = JSON.parse(userAnswer.answer); if (!Array.isArray(parsed) || !q.statements || parsed.length !== q.statements.length) return true; return parsed.some(a => typeof a !== 'string' || a.trim() === ""); } catch { return true; }
        }
         if (q.type === QuestionType.MatchingSelect) {
            try { const parsed = JSON.parse(userAnswer.answer) as Array<{ promptId: string, choiceId: string | null }>; if (!Array.isArray(parsed) || parsed.length !== (q.prompts?.length || 0)) return true; return parsed.some(match => match.choiceId === null || match.choiceId === ''); } catch { return true; }
        }
        return false;
    }).length;
  };

  const handleSubmitTest = async () => {
    const unansweredCount = countUnansweredQuestions();
    if (unansweredCount > 0) {
      setShowUnansweredWarningDialog(true);
    } else {
      await proceedWithSubmission();
    }
  };

  const checkCurrentAnswerIsCorrect = (currentQDisplay: Question, currentAnswerString: string | undefined): boolean => {
    if (!testData) return false;
    const originalQuestion = testData.questions.find(q => q.id === currentQDisplay.id);
    if (!originalQuestion || currentAnswerString === undefined) return false;
    try {
        switch (originalQuestion.type) {
            case QuestionType.MCQ: return currentAnswerString === originalQuestion.correctAnswer;
            case QuestionType.TrueFalse: return currentAnswerString.toLowerCase() === (originalQuestion.correctAnswer as string).toLowerCase();
            case QuestionType.ShortAnswer: return currentAnswerString.toLowerCase().trim() === (originalQuestion.correctAnswer as string).toLowerCase().trim();
            case QuestionType.MultipleChoiceMultipleAnswer: {
                const userSelectedOptions: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
                const correctOptions = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
                return userSelectedOptions.length === correctOptions.length && [...userSelectedOptions].sort().every((val, index) => val === [...correctOptions].sort()[index]);
            }
            case QuestionType.MultipleTrueFalse: {
                const userSelectedAnswers: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
                const correctAnswers = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
                return userSelectedAnswers.length === correctAnswers.length && userSelectedAnswers.every((val, index) => val.toLowerCase() === correctAnswers[index]?.toLowerCase());
            }
            case QuestionType.MatrixChoice: {
                const userSelectedCategories: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
                const correctCategories = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
                return userSelectedCategories.length === correctCategories.length && userSelectedCategories.every((val, index) => val === correctCategories[index]);
            }
            case QuestionType.Hotspot: {
                const userSelectedHotspotIds: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
                if (originalQuestion.multipleSelection) {
                    const correctAnswers = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
                    const sortedUserSelected = [...userSelectedHotspotIds].sort();
                    const sortedCorrect = [...correctAnswers].sort();
                    isCorrect = sortedUserSelected.length === sortedCorrect.length &&
                              sortedUserSelected.every((id, index) => id === sortedCorrect[index]);
                } else {
                    const correctAnswerString = (typeof originalQuestion.correctAnswer === 'string' ? originalQuestion.correctAnswer : null);
                    isCorrect = userSelectedHotspotIds.length === 1 && correctAnswerString !== null && userSelectedHotspotIds[0] === correctAnswerString;
                }
            }
            case QuestionType.MatchingSelect: {
                const userMatches: Array<{ promptId: string, choiceId: string | null }> = currentAnswerString ? JSON.parse(currentAnswerString) : [];
                const correctMatches = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as Array<{ promptId: string, choiceId: string }>;
                return correctMatches.length === (originalQuestion.prompts?.length || 0) && correctMatches.every(correctMatch => userMatches.some(um => um.promptId === correctMatch.promptId && um.choiceId === correctMatch.choiceId));
            }
            case QuestionType.MatchingDragAndDrop: {
                const userAnswer: Array<{ draggableItemId: string, targetItemId: string | null }> = currentAnswerString ? JSON.parse(currentAnswerString) : [];
                const userPlacedPairs = userAnswer.filter(a => a.targetItemId !== null) as Array<{ draggableItemId: string, targetItemId: string }>;
                const correctMatches = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as Array<{ draggableItemId: string, targetItemId: string }>;
                if (userPlacedPairs.length !== correctMatches.length) return false;
                return correctMatches.every(correctPair => userPlacedPairs.some(userPair => userPair.draggableItemId === correctPair.draggableItemId && userPair.targetItemId === correctPair.targetItemId));
            }
            default: return false;
        }
    } catch (e) {
        console.error("Error checking answer:", e);
        return false;
    }
  };

  const goToNextQuestion = () => {
    if (!activeQuestions || activeQuestions.length === 0) return;
    const currentQ = activeQuestions[currentQuestionIndex];
    const userAnswerEntry = userAnswers.find(ans => ans.questionId === currentQ.id);

    if (testMode === 'race') {
      const isCorrect = checkCurrentAnswerIsCorrect(currentQ, userAnswerEntry?.answer);
      if (!isCorrect) {
        setFeedbackType('incorrect');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          toast({ title: "Incorrect!", description: "Oops! Back to Question 1.", variant: "destructive", duration: 5000 });
          setCurrentQuestionIndex(0);
          setUserAnswers([]);
        }, 1500);
      } else {
        setFeedbackType('correct');
        setShowFeedback(true);
        setTimeout(() => {
          setShowFeedback(false);
          if (currentQuestionIndex === activeQuestions.length - 1) {
            setPageState(TestPageState.RaceFinished);
          } else {
            setCurrentQuestionIndex(prev => prev + 1);
          }
        }, 1000);
      }
    } else {
      if (currentQuestionIndex < activeQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const goToPreviousQuestion = () => {
    if (testMode !== 'race' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleRetryTest = useCallback(() => {
    setUserId(null); 
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setTestResult(null);
    setTimeLeft(TEST_DURATION_SECONDS);
    setPasswordError(null);
    setTestMode(null);
    setActiveQuestions([]);
    setFeedbackType(null);
    setShowFeedback(false);
    if (studentViewData?.password === 'protected') {
      setPageState(TestPageState.PasswordPrompt);
    } else if (studentViewData) {
      setPageState(TestPageState.UserIdPrompt);
    } else {
      loadTest();
    }
  }, [studentViewData, loadTest]);

  const openImageModal = (url: string) => {
    setModalImageUrl(url);
    setIsImageModalOpen(true);
  };
  
  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setModalImageUrl(null);
  }

  const handleClosePrompt = () => {
    router.push('/select-test');
  }

  const getIsQuestionAnswered = useCallback((questionId: string) => {
    const userAnswerEntry = userAnswers.find(ua => ua.questionId === questionId);
    const question = activeQuestions.find(q => q.id === questionId);
    if (!userAnswerEntry || !userAnswerEntry.answer.trim() || !question) return false;
    const { answer } = userAnswerEntry;
    try {
        switch (question.type) {
            case QuestionType.MCQ: case QuestionType.TrueFalse: case QuestionType.ShortAnswer: return answer.trim() !== '';
            case QuestionType.MultipleChoiceMultipleAnswer: case QuestionType.Hotspot: const parsedArray = JSON.parse(answer); return Array.isArray(parsedArray) && parsedArray.length > 0;
            case QuestionType.MultipleTrueFalse: case QuestionType.MatrixChoice: const parsedTFMatrixArray = JSON.parse(answer); const statementsCount = question.statements?.length || 0; if (!Array.isArray(parsedTFMatrixArray) || parsedTFMatrixArray.length !== statementsCount) return false; return parsedTFMatrixArray.every(ans => typeof ans === 'string' && ans.trim() !== '');
            case QuestionType.MatchingSelect: const parsedMatchingArray = JSON.parse(answer) as Array<{ promptId: string, choiceId: string | null }>; if (!Array.isArray(parsedMatchingArray) || parsedMatchingArray.length !== (question.prompts?.length || 0)) return false; return parsedMatchingArray.every(match => match.choiceId !== null && match.choiceId.trim() !== '');
            case QuestionType.MatchingDragAndDrop: const parsedDragDrop = JSON.parse(answer) as Array<{ draggableItemId: string, targetItemId: string | null }>; return parsedDragDrop.some(match => match.targetItemId !== null);
            default: return false;
        }
    } catch { return false; }
  }, [userAnswers, activeQuestions]);


  return {
    state: {
      pageState,
    },
    error: {
        errorMessage
    },
    testData,
    studentViewData,
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
    pageStateRef,
    actions: {
      handlePasswordVerify,
      handleUserIdSubmit,
      handleModeSelect,
      handleAnswerChange,
      handleSubmitTest,
      proceedWithSubmission,
      goToNextQuestion,
      goToPreviousQuestion,
      handleRetryTest,
      openImageModal,
      closeImageModal,
      setIsTocOpen,
      setCurrentQuestionIndex,
      getIsQuestionAnswered,
      setShowUnansweredWarningDialog,
      handleClosePrompt,
      handleResetAnswer,
    },
  };
}
