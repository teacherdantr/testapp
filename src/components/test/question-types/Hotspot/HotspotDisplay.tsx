
'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { HotspotShapeType } from '@/lib/types';
import type { QuestionTypeDisplayProps } from '../QuestionTypeDisplayProps';
// Helper function (can be moved to a utils file if used elsewhere)
const parseCoords = (shape: HotspotShapeType, coordsStr: string, imgWidth: number, imgHeight: number) => {
  const c = coordsStr.split(',').map(Number);
  if (shape === HotspotShapeType.Rectangle && c.length === 4) {
    return { x: c[0] * imgWidth, y: c[1] * imgHeight, width: c[2] * imgWidth, height: c[3] * imgHeight };
  }
  if (shape === HotspotShapeType.Circle && c.length === 3) {
    const avgDim = (imgWidth + imgHeight) / 2; // Radius relative to average dimension
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

export function HotspotDisplay({ question, userAnswer, onAnswerChange }: QuestionTypeDisplayProps) {
  const [selectedHotspotIds, setSelectedHotspotIds] = useState<string[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    try {
      setSelectedHotspotIds(userAnswer ? JSON.parse(userAnswer) : []);
    } catch (e) {
      setSelectedHotspotIds([]);
    }
  }, [userAnswer]);

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
  }, [question.imageUrl]);

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

  if (!question.imageUrl || !question.hotspots) return null;

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[4/3] border rounded-md overflow-hidden" data-ai-hint="interactive map">
      <NextImage
        ref={imageRef}
        src={question.imageUrl}
        alt="Hotspot question image"
        fill
        sizes="(max-width: 768px) 100vw, 512px"
        className="object-contain"
        priority // Prioritize loading the main question image
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

            const shapeProps = {
                key: hotspot.id,
                className: cn(
                    "fill-transparent stroke-2 cursor-pointer transition-all",
                    isSelected
                      ? "stroke-green-500 fill-green-500/40 hover:fill-green-500/30" // Selected state
                      : "stroke-red-500/90 hover:fill-red-500/30" // Default (unselected) state
                  ),
                  onClick: () => handleHotspotClick(hotspot.id),
                  'aria-label': hotspot.label || `Hotspot area ${hotspot.id}`,
            };

            if (hotspot.shape === HotspotShapeType.Rectangle) {
              return <rect {...shapeProps} x={parsed.x} y={parsed.y} width={parsed.width} height={parsed.height} />;
            } else if (hotspot.shape === HotspotShapeType.Circle) {
              return <circle {...shapeProps} cx={parsed.cx} cy={parsed.cy} r={parsed.r} />;
            } else if (hotspot.shape === HotspotShapeType.Polygon) {
              return <polygon {...shapeProps} points={parsed.points} />;
            }
            return null;
          })}
        </svg>
      )}
    </div>
  );
}
