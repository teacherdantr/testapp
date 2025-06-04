
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchTestById, verifyTestPassword, submitTest, fetchAdminTestById } from '@/lib/actions/testActions';
import type { Test, UserAnswer, TestResult, Question, Option as OptionType, TrueFalseStatement, Category, HotspotArea, MatchingItem } from '@/lib/types';
import { PasswordPrompt } from '@/components/test/PasswordPrompt';
import { UserIdPrompt } from '@/components/test/UserIdPrompt';
import { ModeSelectionPrompt } from '@/components/test/ModeSelectionPrompt';
import { QuestionDisplay } from '@/components/test/QuestionDisplay';
import { ResultsDisplay } from '@/components/test/ResultsDisplay';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader as DialogHeaderUi, DialogTitle as DialogTitleUi } from '@/components/ui/dialog';
import { Loader2, AlertTriangle, Send, List, CheckCircle2, Circle as CircleIcon, TimerIcon, Goal, Zap, RotateCcw, Rocket, Users, XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { QuestionType } from '@/lib/types';
import NextImage from 'next/image';


enum TestPageState {
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

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const testId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [pageState, setPageState] = useState<TestPageState>(TestPageState.Loading);
  const [testData, setTestData] = useState<Test | null>(null); // This will store the full test data with answers.
  const [studentViewData, setStudentViewData] = useState<Test | null>(null); // Data for student view (password check etc.)
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]); // Questions for display, answers stripped
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

  const pageStateRef = useRef(pageState);
  useEffect(() => {
    pageStateRef.current = pageState;
  }, [pageState]);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const openImageModal = (url: string) => {
      setModalImageUrl(url);
      setIsImageModalOpen(true);
  };


  const loadTest = useCallback(async () => {
    if (!testId) {
      setErrorMessage('Test ID is missing.');
      setPageState(TestPageState.Error);
      return;
    }
    try {
      setPageState(TestPageState.Loading);
      // Fetch data for student view (password check, questions without answers)
      const dataForStudentView = await fetchTestById(testId as string);
      // Fetch full test data (including answers for internal logic like race mode)
      const fullTestDataFromDb = await fetchAdminTestById(testId as string);

      if (!dataForStudentView || !fullTestDataFromDb) {
        setErrorMessage('Test not found.');
        setPageState(TestPageState.Error);
        return;
      }
      
      setStudentViewData(dataForStudentView);
      setTestData(fullTestDataFromDb); // This now comes from the database

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


  useEffect(() => {
    // The timer still runs for all modes, but its display is conditional
    if (pageState !== TestPageState.TakingTest) {
      return;
    }
    if (timeLeft <= 0) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);
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
    if (!testData) { // testData should now be populated from fetchAdminTestById
      setErrorMessage('Test data is not available for mode selection.');
      setPageState(TestPageState.Error);
      return;
    }

    let questionsToUse = [...testData.questions]; // These questions include correct answers

    if (mode === 'testing' || mode === 'race') {
      // Shuffle questions
      for (let i = questionsToUse.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionsToUse[i], questionsToUse[j]] = [questionsToUse[j], questionsToUse[i]];
      }
    }
    
    // Prepare questions for display (strip answers, shuffle choices if needed)
    const studentViewQuestions = questionsToUse.map(q => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { correctAnswer, ...rest } = q; 
        return {
            ...rest,
            choices: q.type === QuestionType.MatchingSelect && q.choices ? [...q.choices].sort(() => Math.random() - 0.5) : q.choices,
        } as Question; // Cast as Question (which doesn't have correctAnswer for student)
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

  const countUnansweredQuestions = () => {
    if (activeQuestions.length === 0) return 0;
    return activeQuestions.filter(q => {
        const userAnswer = userAnswers.find(ua => ua.questionId === q.id);
        if (!userAnswer || userAnswer.answer.trim() === '') return true;
        if (q.type === QuestionType.MultipleChoiceMultipleAnswer || (q.type === QuestionType.Hotspot && q.multipleSelection)) {
            try {
                const parsed = JSON.parse(userAnswer.answer);
                return !Array.isArray(parsed) || parsed.length === 0;
            } catch { return true; }
        }
        if (q.type === QuestionType.Hotspot && !q.multipleSelection) {
             try {
                const parsed = JSON.parse(userAnswer.answer);
                return !Array.isArray(parsed) || parsed.length !== 1 || !parsed[0];
            } catch { return true; }
        }
        if (q.type === QuestionType.MultipleTrueFalse || q.type === QuestionType.MatrixChoice) {
            try {
                const parsed = JSON.parse(userAnswer.answer);
                if (!Array.isArray(parsed) || !q.statements || parsed.length !== q.statements.length) return true;
                return parsed.some(a => typeof a !== 'string' || a.trim() === "");
            } catch { return true; }
        }
         if (q.type === QuestionType.MatchingSelect) {
            try {
                const parsed = JSON.parse(userAnswer.answer) as Array<{ promptId: string, choiceId: string | null }>;
                 if (!Array.isArray(parsed) || parsed.length !== (q.prompts?.length || 0)) return true; 
                return parsed.some(match => match.choiceId === null || match.choiceId === ''); 
            } catch { return true; }
        }
        return false;
    }).length;
  };

  const handleSubmitTest = async () => {
    const unansweredCount = countUnansweredQuestions();
    if (unansweredCount > 0) {
        setShowUnansweredWarningDialog(true);
        return;
    }
    await proceedWithSubmission();
  };

  const checkCurrentAnswerIsCorrect = (currentQDisplay: Question, currentAnswerString: string | undefined): boolean => {
    if (!testData) return false; // testData has full questions with answers

    const originalQuestion = testData.questions.find(q => q.id === currentQDisplay.id);
    if (!originalQuestion || currentAnswerString === undefined) return false;

    let isCorrect = false;

    try {
        switch (originalQuestion.type) {
        case QuestionType.MCQ:
            isCorrect = currentAnswerString === originalQuestion.correctAnswer;
            break;
        case QuestionType.TrueFalse:
            isCorrect = currentAnswerString.toLowerCase() === (originalQuestion.correctAnswer as string).toLowerCase();
            break;
        case QuestionType.ShortAnswer:
            isCorrect = currentAnswerString.toLowerCase().trim() === (originalQuestion.correctAnswer as string).toLowerCase().trim();
            break;
        case QuestionType.MultipleChoiceMultipleAnswer:
            {
            const userSelectedOptions: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
            const correctOptions = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
            const sortedUserSelected = [...userSelectedOptions].sort();
            const sortedCorrectOptions = [...correctOptions].sort();
            isCorrect = sortedUserSelected.length === sortedCorrectOptions.length &&
                        sortedUserSelected.every((val, index) => val === sortedCorrectOptions[index]);
            }
            break;
        case QuestionType.MultipleTrueFalse:
            {
            const userSelectedAnswers: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
            const correctAnswers = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
            if (userSelectedAnswers.length === correctAnswers.length && originalQuestion.statements?.length === correctAnswers.length) {
                isCorrect = userSelectedAnswers.every((val, index) => val.toLowerCase() === correctAnswers[index]?.toLowerCase());
            } else { isCorrect = false; }
            }
            break;
        case QuestionType.MatrixChoice:
            {
            const userSelectedCategories: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
            const correctCategories = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
             if (userSelectedCategories.length === correctCategories.length && originalQuestion.statements?.length === correctCategories.length) {
                isCorrect = userSelectedCategories.every((val, index) => val === correctCategories[index]);
            } else { isCorrect = false; }
            }
            break;
        case QuestionType.Hotspot:
            {
            const userSelectedHotspotIds: string[] = currentAnswerString ? JSON.parse(currentAnswerString) : [];
            if (originalQuestion.multipleSelection) {
                const correctAnswers = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
                const sortedUserSelected = [...userSelectedHotspotIds].sort();
                const sortedCorrect = [...correctAnswers].sort();
                isCorrect = sortedUserSelected.length === sortedCorrect.length &&
                            sortedUserSelected.every((id, index) => id === sortedCorrect[index]);
            } else {
                const correctAnswer = (typeof originalQuestion.correctAnswer === 'string' ? originalQuestion.correctAnswer : null);
                isCorrect = userSelectedHotspotIds.length === 1 && correctAnswer !== null && userSelectedHotspotIds[0] === correctAnswer;
            }
            }
            break;
        case QuestionType.MatchingSelect:
            {
            const userMatches: Array<{ promptId: string, choiceId: string | null }> = currentAnswerString ? JSON.parse(currentAnswerString) : [];
            const correctMatches = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as Array<{ promptId: string, choiceId: string }>;
            
            if (userMatches.length === (originalQuestion.prompts?.length || 0) && correctMatches.length === (originalQuestion.prompts?.length || 0)) {
                isCorrect = correctMatches.every(correctMatch => {
                const userMatch = userMatches.find(um => um.promptId === correctMatch.promptId);
                return userMatch && userMatch.choiceId !== null && userMatch.choiceId === correctMatch.choiceId;
                });
            } else if (userMatches.length === 0 && correctMatches.length === 0 && (originalQuestion.prompts?.length || 0) === 0) {
                isCorrect = true;
            }
            else { isCorrect = false; }
            }
            break;
        default:
            isCorrect = false;
        }
    } catch (e) {
        console.error("Error checking answer:", e, "Question:", originalQuestion, "User Answer:", currentAnswerString);
        isCorrect = false;
    }
    return isCorrect;
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
                toast({
                    title: "Incorrect!",
                    description: "Oops! That wasn't right. Back to Question 1 for you.",
                    variant: "destructive",
                    duration: 5000,
                });
                setCurrentQuestionIndex(0);
                setUserAnswers([]); 
            }, 1500); 
            return;
        } else { 
            setFeedbackType('correct');
            setShowFeedback(true);
            setTimeout(() => {
                setShowFeedback(false);
                if (currentQuestionIndex === activeQuestions.length - 1) {
                    setPageState(TestPageState.RaceFinished);
                } else if (currentQuestionIndex < activeQuestions.length - 1) {
                    setCurrentQuestionIndex(prev => prev + 1);
                }
            }, 1000); 
            return; 
        }
    }

    if (currentQuestionIndex < activeQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (testMode === 'race') return; 
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1); 
    }
  };

  const getIsQuestionAnswered = useCallback((questionId: string) => {
    const userAnswerEntry = userAnswers.find(ua => ua.questionId === questionId);
    const question = activeQuestions.find(q => q.id === questionId);

    if (!userAnswerEntry || !userAnswerEntry.answer.trim() || !question) {
      return false;
    }
    const { answer } = userAnswerEntry;

    try {
        switch (question.type) {
        case QuestionType.MCQ:
        case QuestionType.TrueFalse:
        case QuestionType.ShortAnswer:
            return answer.trim() !== '';

        case QuestionType.MultipleChoiceMultipleAnswer:
        case QuestionType.Hotspot:
            const parsedArray = JSON.parse(answer);
            return Array.isArray(parsedArray) && parsedArray.length > 0;

        case QuestionType.MultipleTrueFalse:
        case QuestionType.MatrixChoice:
            const parsedTFMatrixArray = JSON.parse(answer);
            const statementsCount = question.statements?.length || 0;
            if (!Array.isArray(parsedTFMatrixArray) || parsedTFMatrixArray.length !== statementsCount) {
            return false;
            }
            return parsedTFMatrixArray.every(ans => typeof ans === 'string' && ans.trim() !== '');
        case QuestionType.MatchingSelect:
            const parsedMatchingArray = JSON.parse(answer) as Array<{ promptId: string, choiceId: string | null }>;
            if (!Array.isArray(parsedMatchingArray) || parsedMatchingArray.length !== (question.prompts?.length || 0)) {
                return false;
            }
            return parsedMatchingArray.every(match => match.choiceId !== null && match.choiceId.trim() !== '');
        default:
            return false;
        }
    } catch {
        return false;
    }
  }, [userAnswers, activeQuestions]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
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

    // If studentViewData exists and indicates password protection, go to password prompt
    if (studentViewData?.password === 'protected') {
      setPageState(TestPageState.PasswordPrompt);
    } else if (studentViewData) { // Otherwise, if studentViewData exists, go to User ID prompt
      setPageState(TestPageState.UserIdPrompt);
    } else { // Fallback to reloading test data if studentViewData is not available
      loadTest();
    }
  }, [studentViewData, loadTest]);


  if (pageState === TestPageState.Loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Loading Test...</p>
      </div>
    );
  }

  if (pageState === TestPageState.Error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{errorMessage || 'An unknown error occurred.'}</AlertDescription>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </Alert>
    );
  }

  if (pageState === TestPageState.PasswordPrompt && studentViewData) { // Use studentViewData for password check
    return <PasswordPrompt open={true} onVerify={handlePasswordVerify} error={passwordError} onOpenChange={() => { if (pageStateRef.current === TestPageState.PasswordPrompt) router.push('/'); }}/>;
  }

  if (pageState === TestPageState.UserIdPrompt) {
    return <UserIdPrompt open={true} onIdentifierSubmit={handleUserIdSubmit} onOpenChange={() => { if (pageStateRef.current === TestPageState.UserIdPrompt) router.push('/'); }} />;
  }

  if (pageState === TestPageState.ModeSelection) {
    return <ModeSelectionPrompt open={true} onModeSelect={handleModeSelect} onOpenChange={() => { if (pageStateRef.current === TestPageState.ModeSelection) router.push('/'); }} />;
  }

  if (pageState === TestPageState.TakingTest && testData && activeQuestions.length > 0) {
    const currentQuestion = activeQuestions[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex + 1) / activeQuestions.length) * 100;

    return (
      <div className="max-w-3xl mx-auto relative pb-24 md:pb-0">
        {showFeedback && feedbackType && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] animate-fadeIn">
            <div className="bg-card p-8 rounded-lg shadow-2xl text-center animate-scaleUp mx-4">
              {feedbackType === 'correct' ? (
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
        )}
        <Sheet open={isTocOpen} onOpenChange={setIsTocOpen}>
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
                      setCurrentQuestionIndex(index);
                      setIsTocOpen(false);
                    }}
                    disabled={testMode === 'race'} 
                  >
                    {isAnswered ? (
                      <CheckCircle2 className={cn("mr-2 h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-green-600")} />
                    ) : (
                      <CircleIcon className={cn("mr-2 h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
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

        <h1 className="text-3xl font-bold text-center mb-2 text-primary">{testData.title}</h1>
        
        {testMode === 'race' && (
          <div className="my-4 p-3 bg-primary/10 border border-primary/70 text-primary rounded-md text-center">
            <Rocket className="inline-block mr-2 h-5 w-5" />
            <span className="font-semibold">Race Mode Active!</span> Incorrect answers reset you to Question 1. Good luck!
          </div>
        )}
         {testMode === 'testing' && (
          <div className="my-4 p-3 bg-purple-500/10 border border-purple-500 text-purple-700 dark:text-purple-300 rounded-md text-center">
            <Zap className="inline-block mr-2 h-5 w-5" />
            <span className="font-semibold">Testing Mode!</span> Questions and options are randomized. Answers checked at the end.
          </div>
        )}
         {testMode === 'training' && (
          <div className="my-4 p-3 bg-blue-500/10 border border-blue-500 text-blue-700 dark:text-blue-300 rounded-md text-center">
            <Users className="inline-block mr-2 h-5 w-5" />
            <span className="font-semibold">Training Mode!</span> Questions and options are in order. Answers checked at the end.
          </div>
        )}

        {testMode === 'race' && activeQuestions.length > 0 && (
          <div className="my-6 p-4 bg-card border rounded-lg shadow-sm">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>START</span>
              <span>FINISH</span>
            </div>
            <div className="w-full bg-muted rounded-full h-6 overflow-hidden relative border">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-300 ease-out flex items-center" 
                style={{ width: `${((currentQuestionIndex) / activeQuestions.length) * 100}%` }}
              >
              </div>
              <div 
                className="absolute top-0 h-full flex items-center transition-all duration-300 ease-out"
                style={{ left: `calc(${((currentQuestionIndex) / activeQuestions.length) * 100}% - 12px)` }} 
              >
                <Rocket className="h-5 w-5 text-primary-foreground transform -rotate-45 bg-primary p-0.5 rounded-full shadow-md" /> 
              </div>
            </div>
             <p className="text-center text-sm font-semibold text-primary mt-2">
              {userId || 'You'}: Question {currentQuestionIndex + 1} / {activeQuestions.length}
            </p>
          </div>
        )}


        {testMode !== 'race' && (
            <div className="my-6">
                <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {activeQuestions.length}
                    </p>
                    <div className={cn(
                        "text-sm font-semibold px-2 py-1 rounded flex items-center",
                        timeLeft <= 60 && timeLeft > 0 ? "text-destructive-foreground bg-destructive animate-pulse" :
                        timeLeft === 0 ? "text-destructive-foreground bg-destructive" :
                        "text-primary-foreground bg-primary/90"
                    )}>
                        <TimerIcon className="mr-1.5 h-4 w-4" />
                        Time Left: {formatTime(timeLeft)}
                    </div>
                </div>
                <Progress value={progressPercentage} className="w-full h-3" />
            </div>
        )}

        <QuestionDisplay
          question={currentQuestion}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={activeQuestions.length}
          userAnswer={userAnswers.find(ans => ans.questionId === currentQuestion.id)?.answer}
          onAnswerChange={handleAnswerChange}
          testMode={testMode}
          onImageClick={openImageModal}
        />

        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-sm border-t p-4 md:static md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 md:mt-8">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <Button onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0 || testMode === 'race'} variant="outline" className="w-1/3 md:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
            </Button>
            
            {currentQuestionIndex === activeQuestions.length - 1 ? (
              testMode === 'race' ? (
                <Button onClick={goToNextQuestion} variant="default" size="lg" className="w-1/3 md:w-auto bg-green-600 hover:bg-green-700">
                    <Goal className="mr-2 h-5 w-5" /> Finish Race!
                </Button>
              ) : ( 
                <Button onClick={handleSubmitTest} variant="default" size="lg" className="w-1/3 md:w-auto">
                    <Send className="mr-2 h-5 w-5" /> Submit
                </Button>
              )
            ) : (
                <Button onClick={goToNextQuestion} variant="default" className="w-1/3 md:w-auto">
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
          </div>
        </div>

        {showUnansweredWarningDialog && (
          <AlertDialog open={showUnansweredWarningDialog} onOpenChange={setShowUnansweredWarningDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Unanswered Questions</AlertDialogTitle>
                <AlertDialogDescription>
                   You have {countUnansweredQuestions()} unanswered question(s). Are you sure you want to submit?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowUnansweredWarningDialog(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={async () => {
                  setShowUnansweredWarningDialog(false);
                  await proceedWithSubmission();
                }}>Submit Anyway</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {modalImageUrl && (
             <Dialog open={isImageModalOpen && !!modalImageUrl} onOpenChange={(isOpen) => { if (!isOpen) setModalImageUrl(null); setIsImageModalOpen(isOpen);}}>
                <DialogContent className="max-w-3xl p-2">
                     <DialogHeaderUi>
                        <DialogTitleUi className="sr-only">Enlarged Image</DialogTitleUi>
                    </DialogHeaderUi>
                    <NextImage
                        src={modalImageUrl}
                        alt={"Enlarged question image"}
                        width={1200}
                        height={800}
                        className="w-full h-auto object-contain rounded-md"
                    />
                </DialogContent>
            </Dialog>
        )}
      </div>
    );
  }

  if (pageState === TestPageState.Submitting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Submitting Your Answers...</p>
      </div>
    );
  }

  if (pageState === TestPageState.RaceFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
        <Goal className="h-24 w-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-bold text-primary mb-4">Congratulations, {userId || 'Racer'}!</h1>
        <p className="text-xl text-foreground mb-8">You've successfully completed all questions in the race!</p>
        <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3">
           <Button onClick={proceedWithSubmission} size="lg">
             <Send className="mr-2 h-5 w-5" /> View Detailed Results
           </Button>
          <Button onClick={handleRetryTest} size="lg" variant="outline">
            <RotateCcw className="mr-2 h-5 w-5" />
            Play Again
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/">Back to Homepage</Link>
          </Button>
        </div>
         <p className="mt-8 text-sm text-muted-foreground">
            In a full multiplayer version, this is where you'd see overall race standings.
          </p>
      </div>
    );
  }

  if (pageState === TestPageState.Results && testResult) {
    return <ResultsDisplay results={testResult} testId={testId as string} onRetry={handleRetryTest} />;
  }

  if (studentViewData && studentViewData.questions.length === 0) { // Check studentViewData for initial question check
     return (
      <Alert variant="default" className="max-w-lg mx-auto">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Test Incomplete</AlertTitle>
        <AlertDescription>This test currently has no questions. Please contact the administrator.</AlertDescription>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </Alert>
    );
  }

  return null;
}

