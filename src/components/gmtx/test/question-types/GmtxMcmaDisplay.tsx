
'use client';

import type { Question, Option } from '@/lib/types';
import { cn } from '@/lib/utils';
import { QuestionType } from '@/lib/types';
import { Circle, CheckCircle, CheckSquare, Square } from 'lucide-react';

interface GmtxMcmaDisplayProps {
    question: Question;
    selectedOptions: string[];
    onSelectOption: (optionId: string) => void;
}

function McmaOption({ option, isSelected, isSingleChoice, onSelect }: { option: Option, isSelected: boolean, isSingleChoice: boolean, onSelect: (optionId: string) => void }) {
  const Icon = isSingleChoice 
    ? (isSelected ? CheckCircle : Circle)
    : (isSelected ? CheckSquare : Square);
  
  return (
    <div
      onClick={() => onSelect(option.id)}
      className={cn(
        'flex items-center justify-center text-center p-3 rounded-md border cursor-pointer transition-colors min-h-[56px]',
        isSelected
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-gray-200 hover:bg-gray-300 border-gray-300'
      )}
    >
      <Icon className="h-5 w-5 mr-3 shrink-0" />
      <span className="flex-1">{option.text}</span>
    </div>
  );
}


export function GmtxMcmaDisplay({ question, selectedOptions, onSelectOption }: GmtxMcmaDisplayProps) {
    const isSingleChoice = question.type === QuestionType.MCQ;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(question.options || []).map(option => (
            <McmaOption
              key={option.id}
              option={option}
              isSelected={selectedOptions.includes(option.id)}
              isSingleChoice={isSingleChoice}
              onSelect={() => onSelectOption(option.id)}
            />
          ))}
        </div>
    );
}
