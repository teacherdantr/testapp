
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { TestResult } from '@/lib/types';
import { HotspotShapeType } from '@/lib/types';
import { cn } from '@/lib/utils';
import NextImage from 'next/image';
import ImageWithZoom from './ImageWithZoom';
import { parseCoords, renderUserAnswer, renderCorrectAnswer } from './resultUtils';

interface HotspotResultProps {
  qResult: TestResult['questionResults'][0];
}

export default function HotspotResult({ qResult }: HotspotResultProps) {
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  useEffect(() => {
    const imgElement = imageRef.current;
    if (!imgElement) return;

    const updateDimensions = () => {
        if(imgElement.offsetWidth > 0 && imgElement.offsetHeight > 0) {
            setImageDimensions({ width: imgElement.offsetWidth, height: imgElement.offsetHeight });
        }
    };
    
    if (imgElement.complete && imgElement.naturalWidth > 0) {
        updateDimensions();
    } else {
        imgElement.onload = updateDimensions;
    }

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(imgElement);

    return () => {
        if (imgElement) {
          imgElement.onload = null;
          resizeObserver.unobserve(imgElement);
        }
    };
  }, [qResult.imageUrl]);

  if (!qResult.imageUrl || !qResult.hotspots) {
    return null; // Or some fallback UI
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full max-w-lg mx-auto aspect-[4/3] border rounded-md overflow-hidden" data-ai-hint="results map interactive-map-result">
         <NextImage
           ref={imageRef}
           src={qResult.imageUrl!}
           alt={`Hotspot image for question results`}
           fill
           sizes="(max-width: 768px) 100vw, 512px"
           className="w-full h-auto block object-contain opacity-50"
         />
        {imageDimensions && (
        <svg
          viewBox={`0 0 ${imageDimensions.width} ${imageDimensions.height}`}
          className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none"
        >
          {qResult.hotspots.map((hotspot) => {
            const imgDims = imageDimensions;
            if (!imgDims) return null;
            const parsed = parseCoords(hotspot.shape, hotspot.coords, imgDims.width, imgDims.height);
            if (!parsed) return null;

            const userSelectedThis = (JSON.parse(qResult.userAnswer || '[]') as string[]).includes(hotspot.id);
            const correctAnswers = Array.isArray(qResult.correctAnswer) ? qResult.correctAnswer : [qResult.correctAnswer];
            const isThisCorrectHotspot = correctAnswers.includes(hotspot.id);

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
        )}
      </div>
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
