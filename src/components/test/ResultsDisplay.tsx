
'use client';

import type { TestResult, MatchingItem } from '@/lib/types';
import { QuestionType, HotspotShapeType } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { useEffect, useRef, useState } from 'react';

import MatrixChoiceResult from './results/MatrixChoiceResult';
import HotspotResult from './results/HotspotResult';
import MatchingSelectResult from './results/MatchingSelectResult';
import DefaultQuestionResult from './results/DefaultQuestionResult';
import MatchingDragAndDropResult from './results/MatchingDragAndDropResult';
import ImageWithZoom from './results/ImageWithZoom';
import { renderUserAnswer, renderCorrectAnswer } from './results/resultUtils';


interface ResultsDisplayProps {
  results: TestResult;
  testId: string;
  onRetry: () => void; // New prop for handling retry action
}

export function ResultsDisplay({ results, testId, onRetry }: ResultsDisplayProps) {
  const scorePercentage = results.totalPoints > 0 ? (results.score / results.totalPoints) * 100 : 0;

  const [imageDimensionsMap, setImageDimensionsMap] = useState<Record<string, { width: number, height: number }>>({});
  const imageRefs = useRef<Record<string, HTMLImageElement | null>>({});


  useEffect(() => {
    results.questionResults.forEach(qResult => {
      if ((qResult.questionType === QuestionType.Hotspot || qResult.questionType === QuestionType.MCQ || qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer || qResult.questionType === QuestionType.MatchingSelect) && qResult.imageUrl && imageRefs.current[qResult.questionId]) {
        const imgElement = imageRefs.current[qResult.questionId];
        if (imgElement) {
          const updateDimensions = () => {
            if (imgElement.offsetWidth > 0 && imgElement.offsetHeight > 0) {
              setImageDimensionsMap(prev => ({
                ...prev,
                [qResult.questionId]: { width: imgElement.offsetWidth, height: imgElement.offsetHeight }
              }));
            }
          };
          if (imgElement.complete && imgElement.naturalWidth > 0) {
            updateDimensions();
          } else {
            imgElement.onload = updateDimensions;
            // Fallback for cached images not triggering onload sometimes
            if (!imgElement.complete && imgElement.naturalWidth === 0) {
              setTimeout(updateDimensions, 100);
            }
          }
          const resizeObserver = new ResizeObserver(updateDimensions);
          resizeObserver.observe(imgElement);

          return () => {
            imgElement.onload = null;
            resizeObserver.unobserve(imgElement);
          };
        }
      }
    });
  }, [results.questionResults]);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

  const renderQuestionResult = (qResult: TestResult['questionResults'][0], index: number) => {
    switch (qResult.questionType) {
 case QuestionType.MultipleTrueFalse:
        return <MatrixChoiceResult qResult={qResult} />;
      case QuestionType.Hotspot:
        return <HotspotResult qResult={qResult} imageDimensionsMap={imageDimensionsMap} imageRefs={imageRefs} openImageModal={openImageModal} />;
      case QuestionType.MatchingSelect:
        return <MatchingSelectResult qResult={qResult} />;
      case QuestionType.MatchingDragAndDrop:
        return <MatchingDragAndDropResult qResult={qResult} />;
      default:
        return <DefaultQuestionResult qResult={qResult} />;
    }
  };


  return (
    <Card className="w-full max-w-3xl mx-auto shadow-xl" data-ai-hint="results report">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold text-primary">Test Results: {results.testTitle}</CardTitle>
        <CardDescription className="text-xl text-foreground">
          You scored <span className="font-bold text-primary">{results.score}</span> out of <span className="font-bold text-primary">{results.totalPoints}</span> points.
        </CardDescription>
        <div className="w-full max-w-sm mx-auto pt-4">
          <Progress value={scorePercentage} className="h-4" />
          <p className="text-center text-lg font-semibold mt-2">{scorePercentage.toFixed(0)}%</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <h3 className="text-2xl font-semibold text-center mb-6">Answer Breakdown</h3>
        {results.questionResults.map((qResult, index) => (
          <Card key={qResult.questionId} className={`border-l-4 ${qResult.isCorrect ? 'border-green-500' : 'border-red-500'} bg-card overflow-hidden`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                {qResult.isCorrect ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                )}
              </div>
              <p className="text-base text-foreground pt-1">{qResult.questionText}</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
 {((qResult.questionType === QuestionType.MCQ || qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer || qResult.questionType === QuestionType.MatchingSelect || qResult.questionType === QuestionType.Hotspot) && qResult.imageUrl) && (
 <ImageWithZoom
 imageUrl={qResult.imageUrl}
 alt={`${qResult.questionType === QuestionType.Hotspot ? 'Hotspot image' : 'Illustration'} for question ${index + 1} results`}
 />)}

              {qResult.questionType === QuestionType.MultipleTrueFalse ? (
                <div className="space-y-1 mt-1">
                  {qResult.statements?.map((stmt, stmtIdx) => {
                    const userAnswersForStatements = JSON.parse(qResult.userAnswer || '[]') as string[];
                    const correctAnswersForStatements = qResult.correctAnswer as string[];

                    const userAnswerForStatement = userAnswersForStatements[stmtIdx];
                    const correctAnswerForStatement = correctAnswersForStatements[stmtIdx];
                    const isStatementCorrect = userAnswerForStatement?.toLowerCase() === correctAnswerForStatement?.toLowerCase();

                    return (
                      <div key={stmt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-1 border-b border-border/50 last:border-b-0">
                        <p className="flex-1 mr-2 text-muted-foreground">- {stmt.text}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mt-1 sm:mt-0 w-full sm:w-auto">
                          <span className={`px-2 py-0.5 rounded text-xs mb-1 sm:mb-0 w-full sm:w-auto text-center ${isStatementCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                            }`}>
                            Your: <span className="font-semibold">{userAnswerForStatement === undefined || userAnswerForStatement === "" ? "N/A" : userAnswerForStatement}</span>
                          </span>
                          {!isStatementCorrect && (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 w-full sm:w-auto text-center">
                              Correct: <span className="font-semibold">{correctAnswerForStatement}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : qResult.questionType === QuestionType.MatrixChoice && qResult.statements && qResult.categories ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-muted-foreground">Statement</TableHead>
                        {qResult.categories.map(cat => (
                          <TableHead key={cat.id} className="text-center text-muted-foreground">{cat.text}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qResult.statements.map((stmt, stmtIdx) => {
                        const userAnswersForMatrix = JSON.parse(qResult.userAnswer || '[]') as string[];
                        const correctAnswersForMatrix = qResult.correctAnswer as string[];
                        const userAnswerForStatement = userAnswersForMatrix[stmtIdx];
                        const correctAnswerForStatement = correctAnswersForMatrix[stmtIdx];

                        return (
                          <TableRow key={stmt.id}>
                            <TableCell className="font-medium text-foreground">{stmt.text}</TableCell>
                            {qResult.categories!.map(cat => (
                              <TableCell key={cat.id} className="text-center">
                                {userAnswerForStatement === cat.text && correctAnswerForStatement === cat.text && (
                                  <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                                )}
                                {userAnswerForStatement === cat.text && correctAnswerForStatement !== cat.text && (
                                  <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                                )}
                                {userAnswerForStatement !== cat.text && correctAnswerForStatement === cat.text && (
                                  <span className="text-green-500 font-bold">(Correct)</span>
                                )}
                                {(!qResult.userAnswer || (userAnswerForStatement !== cat.text && correctAnswerForStatement !== cat.text)) && ' '}
                              </TableCell>
                            ))}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  {!qResult.isCorrect && <p className="text-xs text-muted-foreground mt-2">For this question to be fully correct, all statements must be matched to their correct categories.</p>}
                </div>
              ) : qResult.questionType === QuestionType.Hotspot && qResult.imageUrl && qResult.hotspots ? (
                <div className="space-y-2">
                  {imageDimensionsMap[qResult.questionId] && (
                    <div className="relative w-full max-w-md mx-auto border rounded-md overflow-hidden" data-ai-hint="results map interactive-map-result">
                      {/* This div is just a container for the SVG if not using the zoom component directly for hotspot display */}
                      <NextImage
                        ref={el => imageRefs.current[qResult.questionId] = el} // Keep ref for initial measurement if needed for some reason
                        src={qResult.imageUrl!} // Non-null assertion as we check imageUrl above
                        alt={`Hotspot image for question ${index + 1} results`}
                        width={600} // Example, adjust as needed
                        height={450}
                        className="w-full h-auto block object-contain opacity-50" // Show base image slightly faded
                      />
                      <svg
                        viewBox={`0 0 ${imageDimensionsMap[qResult.questionId].width} ${imageDimensionsMap[qResult.questionId].height}`}
                        className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
                      >
                        {qResult.hotspots.map((hotspot) => {
                          const imgDims = imageDimensionsMap[qResult.questionId];
                          if (!imgDims) return null;
                          const parsed = parseCoords(hotspot.shape, hotspot.coords, imgDims.width, imgDims.height);
                          if (!parsed) return null;

                          const userSelectedThis = (JSON.parse(qResult.userAnswer || '[]') as string[]).includes(hotspot.id);
                          const isThisCorrectHotspot = (qResult.correctAnswer as string[]).includes(hotspot.id);

                          let strokeColor = "stroke-gray-400/70";
                          let fillColor = "fill-transparent";

                          if (isThisCorrectHotspot) {
                            strokeColor = "stroke-green-500";
                            fillColor = userSelectedThis ? "fill-green-500/30" : "fill-green-500/20";
                          }
                          if (userSelectedThis && !isThisCorrectHotspot) {
                            strokeColor = "stroke-red-500";
                            fillColor = "fill-red-500/30";
                          }


                          if (hotspot.shape === HotspotShapeType.Rectangle) {
                            return (<rect key={hotspot.id} x={parsed.x} y={parsed.y} width={parsed.width} height={parsed.height} className={cn("stroke-2", strokeColor, fillColor)} />);
                          } else if (hotspot.shape === HotspotShapeType.Circle) {
                            return (<circle key={hotspot.id} cx={parsed.cx} cy={parsed.cy} r={parsed.r} className={cn("stroke-2", strokeColor, fillColor)} />);
                          } else if (hotspot.shape === HotspotShapeType.Polygon) {
                            return (<polygon key={hotspot.id} points={parsed.points} className={cn("stroke-2", strokeColor, fillColor)} />);
                          }
                          return null;
                        })}
                      </svg>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold">Your selections: </span>
                    <span className={qResult.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                      {renderUserAnswer(qResult) || <span className="italic text-muted-foreground">None</span>}
                    </span>
                  </div>
                  {!qResult.isCorrect && (
                    <div>
                      <span className="font-semibold">Correct selections: </span>
                      <span className="text-green-700 dark:text-green-300">{renderCorrectAnswer(qResult)}</span>
                    </div>
                  )}
                </div>
              ) : qResult.questionType === QuestionType.MatchingSelect && qResult.prompts && qResult.choices ? (
                <div className="space-y-2">
                  {qResult.prompts.map(prompt => {
                    const userMatch = (JSON.parse(qResult.userAnswer || '[]') as Array<{ promptId: string, choiceId: string | null }>).find(m => m.promptId === prompt.id);
                    const correctMatch = (qResult.correctAnswer as Array<{ promptId: string, choiceId: string }>).find(m => m.promptId === prompt.id);

                    const userChoiceText = userMatch && userMatch.choiceId ? qResult.choices?.find(c => c.id === userMatch.choiceId)?.text : "Not matched";
                    const correctChoiceText = correctMatch ? qResult.choices?.find(c => c.id === correctMatch.choiceId)?.text : "N/A";

                    const isThisPairCorrect = userMatch?.choiceId === correctMatch?.choiceId;

                    return (
                      <div key={prompt.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-1 border-b border-border/50 last:border-b-0">
                        <p className="flex-1 mr-2 font-medium">{prompt.text}</p>
                        <div className="flex items-center space-x-2 mt-1 sm:mt-0">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs",
                            isThisPairCorrect ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                          )}>
                            Your: <span className="font-semibold">{userChoiceText}</span>
                          </span>
                          {!isThisPairCorrect && (
                            <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                              Correct: <span className="font-semibold">{correctChoiceText}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!qResult.isCorrect && <p className="text-xs text-muted-foreground mt-2">For this question to be fully correct, all prompts must be matched correctly.</p>}
                </div>
              ) : (
              <>
                <div>
                  <span className="font-semibold">Your Answer: </span>
                  <span className={qResult.isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                    {renderUserAnswer(qResult)}
                  </span>
                </div>
                {!qResult.isCorrect && renderCorrectAnswer(qResult) && (
                  <div>
                    <span className="font-semibold">Correct Answer: </span>
                    <span className="text-green-700 dark:text-green-300">{renderCorrectAnswer(qResult)}</span>
                  </div>
                )}
              </>
              )}

              {(qResult.questionType === QuestionType.MCQ || qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer) && qResult.options && (
                <div className="pl-4 pt-2">
                  <p className="font-semibold text-xs text-muted-foreground mb-1">OPTIONS:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {qResult.options.map(opt => {
                      const isCorrectOption = qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer
                        ? (qResult.correctAnswer as string[]).includes(opt.text)
                        : qResult.correctAnswer === opt.text;

                      const userSelectedThisOption = qResult.questionType === QuestionType.MultipleChoiceMultipleAnswer
                        ? (JSON.parse(qResult.userAnswer || '[]') as string[]).includes(opt.text)
                        : qResult.userAnswer === opt.text;

                      let className = '';
                      if (isCorrectOption) className = 'font-medium text-green-700 dark:text-green-300';
                      if (userSelectedThisOption && !isCorrectOption) className = 'line-through text-red-700 dark:text-red-300';
                      if (!userSelectedThisOption && !isCorrectOption && !userSelectedThisOption) className = 'text-muted-foreground';


                      return (
                        <li key={opt.id} className={className}>
                          {opt.text}
                          {isCorrectOption && userSelectedThisOption && <CheckCircle2 className="inline ml-1 h-4 w-4 text-green-500 dark:text-green-300" />}
                          {isCorrectOption && !userSelectedThisOption && <AlertCircle className="inline ml-1 h-4 w-4 text-green-500 dark:text-green-300" />}
                          {userSelectedThisOption && !isCorrectOption && <XCircle className="inline ml-1 h-4 w-4 text-red-500 dark:text-red-300" />}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <p className="text-right text-muted-foreground mt-2">
                Points: {qResult.pointsEarned} / {qResult.pointsPossible}
              </p>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter className="flex justify-center items-center py-6 space-x-4">
        <Button onClick={onRetry} size="lg" variant="outline">
          <RotateCcw className="mr-2 h-5 w-5" />
          Retry Test
        </Button>
        <Button asChild size="lg">
          <Link href="/">Back to Homepage</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

