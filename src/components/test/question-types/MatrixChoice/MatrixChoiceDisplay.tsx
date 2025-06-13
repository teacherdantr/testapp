
'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle } from 'lucide-react';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';

export function MatrixChoiceDisplay({ question, userAnswer, onAnswerChange }: QuestionTypeDisplayProps) {
  const [matrixAnswers, setMatrixAnswers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const initialAnswers = userAnswer ? JSON.parse(userAnswer) : [];
      const statementsCount = question.statements?.length || 0;
      const correctlySizedAnswers = Array(statementsCount).fill("").map((_,idx) => initialAnswers[idx] || "");
      setMatrixAnswers(correctlySizedAnswers);
    } catch (e) {
      const statementsCount = question.statements?.length || 0;
      setMatrixAnswers(Array(statementsCount).fill(""));
    }
  }, [userAnswer, question.statements]);

  const handleMatrixChange = (statementIndex: number, categoryText: string) => {
    const newAnswers = [...matrixAnswers];
    newAnswers[statementIndex] = categoryText;
    setMatrixAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  if (!question.statements || !question.categories) return null;

  return (
    <Table className="border rounded-md">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%] text-muted-foreground text-base">Statement</TableHead>
          {question.categories.map(category => (
            <TableHead key={category.id} className="text-center text-muted-foreground text-base">{category.text}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {question.statements.map((statement, stmtIndex) => (
          <TableRow key={statement.id}>
            <TableCell className="font-medium text-foreground text-base">{statement.text}</TableCell>
            {question.categories!.map((category) => (
              <TableCell key={category.id} className="text-center p-1">
                <RadioGroup
                  value={matrixAnswers[stmtIndex]}
                  onValueChange={(value) => handleMatrixChange(stmtIndex, value)}
                  className="flex justify-center"
                >
                  <Label
                    htmlFor={`${question.id}-s${statement.id}-c${category.id}`}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border cursor-pointer transition-colors",
                      matrixAnswers[stmtIndex] === category.text
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent/50 border-input"
                    )}
                    title={`Select ${category.text} for "${statement.text}"`}
                  >
                    <RadioGroupItem
                      value={category.text}
                      id={`${question.id}-s${statement.id}-c${category.id}`}
                      className="hidden"
                    />
                    {matrixAnswers[stmtIndex] === category.text ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                    )}
                  </Label>
                </RadioGroup>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
