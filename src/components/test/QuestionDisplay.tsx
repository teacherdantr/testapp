
'use client';

import type { Question, Option } from '@/lib/types'; // Removed unused imports here
import { QuestionType, HotspotShapeType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Maximize2, CheckCircle2, Circle } from 'lucide-react';


interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: string | undefined;
  onAnswerChange: (questionId: string, answer: string) => void;
  testMode: 'training' | 'testing' | 'race' | null;
  // Add onImageClick prop
  onImageClick?: (imageUrl: string) => void;
}

export function QuestionDisplay({
  question,
  questionNumber,
  // totalQuestions, // totalQuestions prop is available but not used in this snippet. Re-add if needed.
  userAnswer,
  onAnswerChange,
  testMode,
  onImageClick,
}: QuestionDisplayProps) {

  const [selectedMcmaOptions, setSelectedMcmaOptions] = useState<string[]>([]);
  const [mtfAnswers, setMtfAnswers] = useState<string[]>([]);
  const [matrixAnswers, setMatrixAnswers] = useState<string[]>([]);
  const [selectedHotspotIds, setSelectedHotspotIds] = useState<string[]>([]);
  const [matchingAnswers, setMatchingAnswers] = useState<Array<{ promptId: string, choiceId: string | null }>>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Consolidate options preparation
  const optionsToDisplay = useMemo(() => {
    if (!question.options) {
      return [];
    }
    // Shuffle only for MCQ/MCMA in testing or race mode
    if ((testMode === 'testing' || testMode === 'race') && 
        (question.type === QuestionType.MCQ || question.type === QuestionType.MultipleChoiceMultipleAnswer)) {
      const optionsCopy = [...question.options];
      for (let i = optionsCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
      }
      return optionsCopy;
    }
    return question.options; // Return original options if not shuffling
  }, [question.options, question.type, testMode]);


  useEffect(() => {
    if (question.type === QuestionType.MultipleChoiceMultipleAnswer) {
      try {
        setSelectedMcmaOptions(userAnswer ? JSON.parse(userAnswer) : []);
      } catch (e) {
        setSelectedMcmaOptions([]);
      }
    } else if (question.type === QuestionType.MultipleTrueFalse) {
        try {
            const initialAnswers = userAnswer ? JSON.parse(userAnswer) : [];
            const statementsCount = question.statements?.length || 0;
            const correctlySizedAnswers = Array(statementsCount).fill("").map((_, idx) => initialAnswers[idx] || "");
            setMtfAnswers(correctlySizedAnswers);
        } catch(e) {
            const statementsCount = question.statements?.length || 0;
            setMtfAnswers(Array(statementsCount).fill(""));
        }
    } else if (question.type === QuestionType.MatrixChoice) {
      try {
        const initialAnswers = userAnswer ? JSON.parse(userAnswer) : [];
        const statementsCount = question.statements?.length || 0;
        const correctlySizedAnswers = Array(statementsCount).fill("").map((_,idx) => initialAnswers[idx] || "");
        setMatrixAnswers(correctlySizedAnswers);
      } catch (e) {
        const statementsCount = question.statements?.length || 0;
        setMatrixAnswers(Array(statementsCount).fill(""));
      }
    } else if (question.type === QuestionType.Hotspot) {
      try {
        setSelectedHotspotIds(userAnswer ? JSON.parse(userAnswer) : []);
      } catch (e) {
        setSelectedHotspotIds([]);
      }
    } else if (question.type === QuestionType.MatchingSelect) {
      try {
        const initialUserMatches = userAnswer ? JSON.parse(userAnswer) : [];
        const allPrompts = question.prompts || [];
        const currentMatches = allPrompts.map(prompt => {
            const existingMatch = initialUserMatches.find((match: any) => match.promptId === prompt.id);
            return { promptId: prompt.id, choiceId: existingMatch ? existingMatch.choiceId : null };
        });
        setMatchingAnswers(currentMatches);
      } catch (e) {
        setMatchingAnswers((question.prompts || []).map(p => ({ promptId: p.id, choiceId: null })));
      }
    }
  }, [userAnswer, question.id, question.type, question.statements, question.categories, question.hotspots, question.prompts]);

  const shuffledMatchingChoices = useMemo(() => {
    if (question.type === QuestionType.MatchingSelect && question.choices) {
      const choicesCopy = [...question.choices];
        // Only shuffle if in testing or race mode, otherwise maintain original order
      if (testMode === 'testing' || testMode === 'race') {
        for (let i = choicesCopy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [choicesCopy[i], choicesCopy[j]] = [choicesCopy[j], choicesCopy[i]];
        }
      }
      return choicesCopy;
    }
    return question.choices || [];
  }, [question.id, question.type, question.choices, testMode]);


  useEffect(() => {
    if ((question.type === QuestionType.Hotspot || question.type === QuestionType.MCQ || question.type === QuestionType.MultipleChoiceMultipleAnswer || question.type === QuestionType.MatchingSelect) && question.imageUrl && imageRef.current) {
      const updateDimensions = () => {
        if (imageRef.current) {
          setImageDimensions({
            width: imageRef.current.offsetWidth,
            height: imageRef.current.offsetHeight,
          });
        }
      };

      const imgElement = imageRef.current;
      if (imgElement.complete && imgElement.naturalWidth > 0) {
        updateDimensions();
      } else {
        imgElement.onload = updateDimensions;
      }

      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(imgElement);

      return () => {
        imgElement.onload = null;
        resizeObserver.unobserve(imgElement);
      };
    }
  }, [question.imageUrl, question.type, question.id]);


  const handleRadioChange = (value: string) => {
    onAnswerChange(question.id, value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onAnswerChange(question.id, e.target.value);
  };

  const handleMcmaChange = (optionText: string, checked: boolean) => {
    const newSelectedOptions = checked
      ? [...selectedMcmaOptions, optionText]
      : selectedMcmaOptions.filter(opt => opt !== optionText);
    setSelectedMcmaOptions(newSelectedOptions);
    onAnswerChange(question.id, JSON.stringify(newSelectedOptions));
  };

  const handleMtfChange = (statementIndex: number, value: 'true' | 'false') => {
    const newAnswers = [...mtfAnswers];
    newAnswers[statementIndex] = value;
    setMtfAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  const handleMatrixChange = (statementIndex: number, categoryText: string) => {
    const newAnswers = [...matrixAnswers];
    newAnswers[statementIndex] = categoryText;
    setMatrixAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  const handleHotspotClick = (hotspotId: string) => {
    let newSelectedIds: string[];
    if (question.multipleSelection) {
      newSelectedIds = selectedHotspotIds.includes(hotspotId)
        ? selectedHotspotIds.filter(id => id !== hotspotId)
        : [...selectedHotspotIds, hotspotId];
    } else {
      newSelectedIds = selectedHotspotIds.includes(hotspotId) ? [] : [hotspotId];
    }
    setSelectedHotspotIds(newSelectedIds);
    onAnswerChange(question.id, JSON.stringify(newSelectedIds));
  };

  const handleMatchingSelectChange = (promptId: string, choiceId: string) => {
    const newAnswers = matchingAnswers.map(match =>
      match.promptId === promptId ? { ...match, choiceId } : match
    );
    setMatchingAnswers(newAnswers);
    onAnswerChange(question.id, JSON.stringify(newAnswers));
  };

  const parseCoords = (shape: HotspotShapeType, coordsStr: string, imgWidth: number, imgHeight: number) => {
    const c = coordsStr.split(',').map(Number);
    if (shape === HotspotShapeType.Rectangle && c.length === 4) {
      return { x: c[0] * imgWidth, y: c[1] * imgHeight, width: c[2] * imgWidth, height: c[3] * imgHeight };
    }
    if (shape === HotspotShapeType.Circle && c.length === 3) {
      const avgDim = (imgWidth + imgHeight) / 2;
      return { cx: c[0] * imgWidth, cy: c[1] * imgHeight, r: c[2] * avgDim };
    }
    if (shape === HotspotShapeType.Polygon && c.length >= 6 && c.length % 2 === 0) {
      const points = [];
      for (let i = 0; i < c.length; i += 2) {
        points.push(`${c[i] * imgWidth},${c[i+1] * imgHeight}`);
      }
      return { points: points.join(' ') };
    }
    return null;
  };


  const renderImageWithZoom = (imageUrl: string, altText: string, isHotspotImage: boolean = false) => {
    if (!imageUrl) return null;

    const imageComponent = (
      <NextImage
        ref={isHotspotImage ? imageRef : null}
        src={imageUrl}
        alt={altText}
        width={isHotspotImage ? 800 : 600}
        height={isHotspotImage ? 600 : 400}
        className={cn("w-full h-auto block", isHotspotImage ? "" : "object-contain rounded-md")}
        onLoad={(e) => {
          if (isHotspotImage) {
            const target = e.target as HTMLImageElement;
            setImageDimensions({ width: target.offsetWidth, height: target.offsetHeight });
          }
        }}
      />
    );

    if (isHotspotImage) {
      return (
         <div className="mb-4 relative w-full max-w-2xl mx-auto border rounded-md overflow-hidden" data-ai-hint="interactive map question-image">
           {imageComponent}
         </div>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onImageClick && onImageClick(imageUrl)}
        className="mb-4 relative w-full max-w-md mx-auto border rounded-md overflow-hidden group block cursor-pointer hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
        aria-label={`Enlarge image for ${altText}`}
        data-ai-hint="question illustration"
      >
        {imageComponent}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200">
          <Maximize2 className="h-10 w-10 text-white" />
        </div>
      </button>
    );
  };


  return (
    <Card className="mb-6 shadow-lg" data-ai-hint="quiz education">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl md:text-2xl">Question {questionNumber}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {question.points} point{question.points !== 1 ? 's' : ''}
          </span>
        </div>
        <CardDescription className="pt-2 text-base md:text-lg text-foreground">
          {question.text}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(question.type === QuestionType.MCQ || question.type === QuestionType.MultipleChoiceMultipleAnswer || question.type === QuestionType.MatchingSelect) &&
          question.imageUrl && renderImageWithZoom(question.imageUrl, `Illustration for question ${questionNumber}`, false)}

        <div className="space-y-4">
          {question.type === QuestionType.MCQ && (
            <RadioGroup value={userAnswer} onValueChange={handleRadioChange} className="space-y-2">
              {optionsToDisplay.map((option: Option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
                  <RadioGroupItem value={option.text} id={`${question.id}-${option.id}`} />
                  <Label htmlFor={`${question.id}-${option.id}`} className="text-base font-normal cursor-pointer flex-grow">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === QuestionType.MultipleChoiceMultipleAnswer && (
            <div className="space-y-2">
              {optionsToDisplay.map((option: Option) => (
                <div key={option.id} className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
                  <Checkbox
                    id={`${question.id}-${option.id}`}
                    checked={selectedMcmaOptions.includes(option.text)}
                    onCheckedChange={(checked) => handleMcmaChange(option.text, !!checked)}
                  />
                  <Label htmlFor={`${question.id}-${option.id}`} className="text-base font-normal cursor-pointer flex-grow">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {question.type === QuestionType.MultipleTrueFalse && question.statements && (
             <div className="space-y-3 border rounded-md p-4">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 mb-2">
                <span className="font-medium text-muted-foreground">Statement</span>
                <span className="font-medium text-muted-foreground text-center">True</span>
                <span className="font-medium text-muted-foreground text-center">False</span>
              </div>
              {question.statements.map((statement, index) => (
                <RadioGroup
                  key={statement.id}
                  value={mtfAnswers[index]}
                  onValueChange={(value) => handleMtfChange(index, value as 'true' | 'false')}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-2 py-2 border-t first:border-t-0"
                >
                  <p className="text-foreground text-base">{statement.text}</p>
                  <Label
                    htmlFor={`${question.id}-s${statement.id}-true`}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors w-20 text-center text-base",
                      mtfAnswers[index] === 'true' ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent/50 border-input"
                    )}
                  >
                    <RadioGroupItem value="true" id={`${question.id}-s${statement.id}-true`} className="hidden" />
                    True
                  </Label>
                  <Label
                    htmlFor={`${question.id}-s${statement.id}-false`}
                    className={cn(
                      "flex items-center justify-center p-2 rounded-md border cursor-pointer transition-colors w-20 text-center text-base",
                      mtfAnswers[index] === 'false' ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent/50 border-input"
                    )}
                  >
                    <RadioGroupItem value="false" id={`${question.id}-s${statement.id}-false`} className="hidden" />
                    False
                  </Label>
                </RadioGroup>
              ))}
            </div>
          )}

          {question.type === QuestionType.MatrixChoice && question.statements && question.categories && (
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
          )}

          {question.type === QuestionType.Hotspot && question.imageUrl && question.hotspots && (
            <div className="relative w-full max-w-2xl mx-auto border rounded-md overflow-hidden" data-ai-hint="interactive map">
              <NextImage
                ref={imageRef}
                src={question.imageUrl}
                alt="Hotspot question image"
                width={800}
                height={600}
                className="w-full h-auto block"
                onLoad={(e) => {
                    const target = e.target as HTMLImageElement;
                    setImageDimensions({ width: target.offsetWidth, height: target.offsetHeight });
                }}
              />
              {imageDimensions && (
                <svg
                  viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
                  className="absolute top-0 left-0 w-full h-full z-10"
                >
                  {question.hotspots.map((hotspot) => {
                    const parsed = parseCoords(hotspot.shape, hotspot.coords, imageDimensions.width, imageDimensions.height);
                    if (!parsed) return null;
                    const isSelected = selectedHotspotIds.includes(hotspot.id);

                    if (hotspot.shape === HotspotShapeType.Rectangle) {
                      return (
                        <rect
                          key={hotspot.id}
                          x={parsed.x}
                          y={parsed.y}
                          width={parsed.width}
                          height={parsed.height}
                          className={cn(
                            "fill-transparent stroke-2 cursor-pointer hover:fill-primary/20",
                            isSelected ? "stroke-primary fill-primary/30" : "stroke-primary/50"
                          )}
                          onClick={() => handleHotspotClick(hotspot.id)}
                        />
                      );
                    } else if (hotspot.shape === HotspotShapeType.Circle) {
                      return (
                        <circle
                          key={hotspot.id}
                          cx={parsed.cx}
                          cy={parsed.cy}
                          r={parsed.r}
                          className={cn(
                            "fill-transparent stroke-2 cursor-pointer hover:fill-primary/20",
                            isSelected ? "stroke-primary fill-primary/30" : "stroke-primary/50"
                          )}
                          onClick={() => handleHotspotClick(hotspot.id)}
                        />
                      );
                    } else if (hotspot.shape === HotspotShapeType.Polygon) {
                      return (
                        <polygon
                          key={hotspot.id}
                          points={parsed.points}
                          className={cn(
                            "fill-transparent stroke-2 cursor-pointer hover:fill-primary/20",
                            isSelected ? "stroke-primary fill-primary/30" : "stroke-primary/50"
                          )}
                          onClick={() => handleHotspotClick(hotspot.id)}
                        />
                      );
                    }
                    return null;
                  })}
                </svg>
              )}
            </div>
          )}

          {question.type === QuestionType.MatchingSelect && question.prompts && shuffledMatchingChoices && (
            <div className="space-y-4">
              {question.prompts.map((prompt) => (
                <div key={prompt.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center p-3 border rounded-md md:min-w-[300px]">
                  <Label htmlFor={`q${question.id}-p${prompt.id}-select`} className="text-base text-foreground">
                    {prompt.text}
                  </Label>
                  <Select
                    value={matchingAnswers.find(m => m.promptId === prompt.id)?.choiceId || ''}
                    onValueChange={(choiceId) => handleMatchingSelectChange(prompt.id, choiceId)}
                  >
                    <SelectTrigger
                      id={`q${question.id}-p${prompt.id}-select`}
                      className="w-full md:w-[250px] text-base h-11"
                    >
                      <SelectValue placeholder="Select match..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shuffledMatchingChoices.map((choice) => (
                        <SelectItem key={choice.id} value={choice.id || ''} className="text-base">
                          {choice.text}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}


          {question.type === QuestionType.TrueFalse && (
             <RadioGroup value={userAnswer} onValueChange={handleRadioChange} className="space-y-2">
                <div className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
                    <RadioGroupItem value="true" id={`${question.id}-true`} />
                    <Label htmlFor={`${question.id}-true`} className="text-base font-normal cursor-pointer flex-grow">True</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-md border border-input hover:bg-accent/10 transition-colors has-[[data-state=checked]]:bg-accent has-[[data-state=checked]]:text-accent-foreground has-[[data-state=checked]]:border-accent">
                    <RadioGroupItem value="false" id={`${question.id}-false`} />
                    <Label htmlFor={`${question.id}-false`} className="text-base font-normal cursor-pointer flex-grow">False</Label>
                </div>
            </RadioGroup>
          )}

          {question.type === QuestionType.ShortAnswer && (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}

