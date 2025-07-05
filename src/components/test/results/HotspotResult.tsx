
'use client';

import React from 'react';
import type { TestResult } from '@/lib/types';
import { HotspotShapeType, QuestionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import { CheckCircle2, XCircle } from 'lucide-react';
import ImageWithZoom from './ImageWithZoom'; // Assuming you create this component
import { parseCoords, renderUserAnswer, renderCorrectAnswer } from './resultUtils';

interface HotspotResultProps {
  qResult: TestResult['questionResults'][0];
  imageDimensionsMap: Record<string, { width: number, height: number }>;
}
export default function HotspotResult({ qResult, imageDimensionsMap }: HotspotResultProps) {
  if (!qResult.imageUrl || !qResult.hotspots) {
    return null; // Or some fallback UI
  }
 // Note: imageRefs and openImageModal are no longer needed here, as they are handled by ImageWithZoom
  return (
    <div className="space-y-2">
      {/* Use the new ImageWithZoom component */}
      <ImageWithZoom
        imageUrl={qResult.imageUrl}
        questionType={qResult.questionType as QuestionType} // Pass questionType
        questionId={qResult.questionId}
        altText={`Hotspot image for question results`}
      />

      {imageDimensionsMap[qResult.questionId] && (
        <div className="relative w-full max-w-md mx-auto border rounded-md overflow-hidden" data-ai-hint="results map interactive-map-result">
           <NextImage
             // ref={el => imageRefs.current[qResult.questionId] = el} // Ref handled in ImageWithZoom
             src={qResult.imageUrl!}
             alt={`Hotspot image for question results`}
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
  );
}