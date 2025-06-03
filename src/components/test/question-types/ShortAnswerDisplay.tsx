
'use client';

import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';

export function ShortAnswerDisplay({ question, userAnswer, onAnswerChange }: QuestionTypeDisplayProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onAnswerChange(question.id, e.target.value);
  };

  return (
    <div>
      <Label htmlFor={`${question.id}-shortanswer`} className="sr-only">Your Answer</Label>
      <Textarea
        id={`${question.id}-shortanswer`}
        value={userAnswer || ''}
        onChange={handleInputChange}
        placeholder="Type your answer here..."
        className="text-base min-h-[100px]"
      />
    </div>
  );
}
