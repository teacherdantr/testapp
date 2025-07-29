
'use client';

import { cn } from '@/lib/utils';
import { TimerIcon, Rocket, Zap, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TestInterfaceHeaderProps {
  testTitle: string;
  testMode: 'training' | 'testing' | 'race' | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLeft: number;
  userId: string | null;
}

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

export function TestInterfaceHeader({
  testTitle,
  testMode,
  currentQuestionIndex,
  totalQuestions,
  timeLeft,
  userId,
}: TestInterfaceHeaderProps) {

  const progressPercentage = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const modeDetails = {
    race: { icon: Rocket, text: 'Race Mode Active! Incorrect answers reset you.', style: 'bg-primary/10 border-primary/70 text-primary' },
    testing: { icon: Zap, text: 'Testing Mode! Questions and options are randomized.', style: 'bg-purple-500/10 border-purple-500 text-purple-700 dark:text-purple-300' },
    training: { icon: Users, text: 'Training Mode! Questions and options are in order.', style: 'bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300' },
  };

  const currentMode = testMode ? modeDetails[testMode] : null;

  return (
    <>
      <h1 className="text-3xl font-bold text-center mb-2 text-primary">{testTitle}</h1>
      
      {currentMode && (
        <div className={cn("my-4 p-3 border rounded-md text-center", currentMode.style)}>
          <currentMode.icon className="inline-block mr-2 h-5 w-5" />
          <span className="font-semibold">{currentMode.text}</span>
        </div>
      )}

      {testMode === 'race' && totalQuestions > 0 ? (
        <div className="my-6 p-4 bg-card border rounded-lg shadow-sm">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
            <span>START</span>
            <span>FINISH</span>
          </div>
          <div className="w-full bg-muted rounded-full h-6 overflow-hidden relative border">
            <div 
              className="bg-primary h-full rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${(currentQuestionIndex / (totalQuestions - 1)) * 100}%` }}
            />
            <div 
              className="absolute top-0 h-full flex items-center transition-all duration-300 ease-out"
              style={{ left: `calc(${(currentQuestionIndex / (totalQuestions - 1)) * 100}% - 12px)` }} 
            >
              <Rocket className="h-5 w-5 text-primary-foreground transform -rotate-45 bg-primary p-0.5 rounded-full shadow-md" /> 
            </div>
          </div>
          <p className="text-center text-sm font-semibold text-primary mt-2">
            {userId || 'You'}: Question {currentQuestionIndex + 1} / {totalQuestions}
          </p>
        </div>
      ) : (
        <div className="my-6">
          <div className="flex justify-between items-center mb-1">
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
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
    </>
  );
}
