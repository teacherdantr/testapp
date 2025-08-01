
'use client';

import type { Question, Option } from '@/lib/types';
import { cn } from '@/lib/utils';

interface GmtxMcmaDisplayProps {
    question: Question;
    selectedOptions: string[];
    onSelectOption: (optionId: string) => void;
}

function McmaOption({ option, isSelected, onSelect }: { option: Option, isSelected: boolean, onSelect: (optionId: string) => void }) {
  return (
    <div
      onClick={() => onSelect(option.id)}
      className={cn(
        'flex items-center p-4 rounded-md border cursor-pointer transition-colors',
        isSelected
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-gray-200 hover:bg-gray-300 border-gray-300'
      )}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded-full border border-current mr-4">
        {isSelected && <div className="h-3 w-3 rounded-full bg-current" />}
      </div>
      <span className="flex-1">{option.text}</span>
    </div>
  );
}


export function GmtxMcmaDisplay({ question, selectedOptions, onSelectOption }: GmtxMcmaDisplayProps) {
    return (
        <div className="space-y-3">
          {(question.options || []).map(option => (
            <McmaOption
              key={option.id}
              option={option}
              isSelected={selectedOptions.includes(option.id)}
              onSelect={() => onSelectOption(option.id)}
            />
          ))}
        </div>
    );
}
