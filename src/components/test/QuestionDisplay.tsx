
'use client';

import type { Question } from '@/lib/types';
import { QuestionType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { Maximize2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { McqDisplay } from './question-types/MCQ/McqDisplay';
import { McmaDisplay } from './question-types/MCMA/McmaDisplay';
import { TrueFalseDisplay } from './question-types/TrueFalse/TrueFalseDisplay';
import { ShortAnswerDisplay } from './question-types/ShortAnswer/ShortAnswerDisplay';
import { MtfDisplay } from './question-types/MTF/MtfDisplay';
import { MatrixChoiceDisplay } from './question-types/MatrixChoice/MatrixChoiceDisplay';
import { HotspotDisplay } from './question-types/Hotspot/HotspotDisplay'; // Corrected import path
import { MatchingSelectDisplay } from './question-types/Matching/MatchingSelectDisplay';
import { MatchingDragAndDropDisplay } from './question-types/Matching/MatchingDragAndDropDisplay';
import type { QuestionTypeDisplayProps } from './question-types/QuestionTypeDisplayProps';


interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: string | undefined;
  isAnswered: boolean;
  onAnswerChange: (questionId: string, answer: string) => void;
  onResetAnswer: (questionId: string) => void;
  testMode: 'training' | 'testing' | 'race' | null;
  onImageClick?: (imageUrl: string) => void;
}

export function QuestionDisplay({
  question,
  questionNumber,
  // totalQuestions, // totalQuestions prop is available but not used in this snippet. Re-add if needed.
  userAnswer,
  isAnswered,
  onAnswerChange,
  onResetAnswer,
  testMode,
  onImageClick,
}: QuestionDisplayProps) {

  const commonProps: QuestionTypeDisplayProps = {
    question,
    userAnswer,
    onAnswerChange,
    testMode,
    onImageClick,
  };

  const renderQuestionSpecificContent = () => {
    switch (question.type) {
      case QuestionType.MCQ:
        return <McqDisplay {...commonProps} />;
      case QuestionType.MultipleChoiceMultipleAnswer:
        const currentOptions = (testMode === 'training' ? question.options : commonProps.question.options) || [];
        return <McmaDisplay {...commonProps} question={{...question, options: currentOptions}} />;
      case QuestionType.TrueFalse:
        return <TrueFalseDisplay {...commonProps} />;
      case QuestionType.ShortAnswer:
        return <ShortAnswerDisplay {...commonProps} />;
      case QuestionType.MultipleTrueFalse:
        return <MtfDisplay {...commonProps} />;
      case QuestionType.MatrixChoice:
        return <MatrixChoiceDisplay {...commonProps} />;
      case QuestionType.Hotspot:
        return <HotspotDisplay {...commonProps} />; // HotspotDisplay handles its own image
      case QuestionType.MatchingSelect:
        return <MatchingSelectDisplay {...commonProps} />;
      case QuestionType.MatchingDragAndDrop:
        return <MatchingDragAndDropDisplay {...commonProps} />;
      default:
        return <p>Unsupported question type.</p>;
    }
  };

  // Render general question image (for MCQ, MCMA, MatchingSelect) if URL exists
  // HotspotDisplay handles its own image rendering internally.
  const shouldRenderGeneralImage =
    (question.type === QuestionType.MCQ ||
     question.type === QuestionType.MultipleChoiceMultipleAnswer ||
     question.type === QuestionType.MatchingSelect ||
     question.type === QuestionType.MatchingDragAndDrop ||
     question.type === QuestionType.MultipleTrueFalse) &&
    question.imageUrl;

  return (
    <Card className="mb-6 shadow-lg" data-ai-hint="quiz education">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-xl md:text-2xl flex-1">Question {questionNumber}</CardTitle>
            <div className="flex items-center space-x-2 shrink-0">
                <span className="text-sm text-muted-foreground">
                    {question.points} point{question.points !== 1 ? 's' : ''}
                </span>
                {isAnswered && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <RefreshCcw className="mr-1 h-3 w-3" />
                        Reset
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will clear your answer for this question. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onResetAnswer(question.id)}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
            </div>
        </div>
        <CardDescription className="pt-2 text-base md:text-lg text-foreground">
          {question.text}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {shouldRenderGeneralImage && onImageClick && (
          <button
            type="button"
            onClick={() => onImageClick(question.imageUrl!)}
            className="mb-4 relative w-full max-w-md mx-auto border rounded-md overflow-hidden group block cursor-pointer hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label={`Enlarge image for question ${questionNumber}`}
            data-ai-hint="question illustration"
          >
            <NextImage
              src={question.imageUrl!}
              alt={`Illustration for question ${questionNumber}`}
              width={600} // Provide appropriate intrinsic sizes
              height={400}
              className="w-full h-auto block object-contain rounded-md"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200">
              <Maximize2 className="h-10 w-10 text-white" />
            </div>
          </button>
        )}
        <div className="space-y-4">
          {renderQuestionSpecificContent()}
        </div>
      </CardContent>
    </Card>
  );
}
