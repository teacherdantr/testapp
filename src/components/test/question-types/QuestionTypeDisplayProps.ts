
import type { Question } from '@/lib/types';

export interface QuestionTypeDisplayProps {
  question: Question;
  userAnswer: string | undefined;
  onAnswerChange: (questionId: string, answer: string) => void;
  testMode: 'training' | 'testing' | 'race' | null;
  // onImageClick is for general question images, not the primary Hotspot image
  onImageClick?: (imageUrl: string) => void;
}
