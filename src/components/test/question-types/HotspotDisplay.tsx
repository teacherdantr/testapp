
'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { HotspotShapeType } from '@/lib/types';
import type { QuestionTypeDisplayProps } from './QuestionTypeDisplayProps';

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
    if (question.imageUrl && imageRef.current) {
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
        if (imgElement) {
          imgElement.onload = null;
          resizeObserver.unobserve(imgElement);
        }
      };
    }
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
    <div className="relative w-full max-w-2xl mx-auto border rounded-md overflow-hidden" data-ai-hint="interactive map">
      <NextImage
        ref={imageRef}
        src={question.imageUrl}
        alt="Hotspot question image"
        width={800} // Intrinsic width, will be overridden by CSS/container
        height={600} // Intrinsic height
        className="w-full h-auto block"
        onLoad={(e) => {
          const target = e.target as HTMLImageElement;
          // Ensure naturalWidth is available for accurate dimensions
          if (target.naturalWidth > 0) {
            setImageDimensions({ width: target.offsetWidth, height: target.offsetHeight });
          }
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
                    "fill-transparent stroke-2 cursor-pointer",
                    isSelected
                      ? "stroke-green-500 fill-green-500/30 hover:fill-green-500/20" // Selected state
                      : "stroke-red-500 hover:fill-red-500/20" // Default (unselected) state
                  )}
                  onClick={() => handleHotspotClick(hotspot.id)}
                  aria-label={hotspot.label || `Hotspot area ${hotspot.id}`}
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
                    "fill-transparent stroke-2 cursor-pointer",
                    isSelected
                      ? "stroke-green-500 fill-green-500/30 hover:fill-green-500/20" // Selected state
                      : "stroke-red-500 hover:fill-red-500/20" // Default (unselected) state
                  )}
                  onClick={() => handleHotspotClick(hotspot.id)}
                  aria-label={hotspot.label || `Hotspot area ${hotspot.id}`}
                />
              );
            } else if (hotspot.shape === HotspotShapeType.Polygon) {
              return (
                <polygon
                  key={hotspot.id}
                  points={parsed.points}
                  className={cn(
                    "fill-transparent stroke-2 cursor-pointer",
                    isSelected
                      ? "stroke-green-500 fill-green-500/30 hover:fill-green-500/20" // Selected state
                      : "stroke-red-500 hover:fill-red-500/20" // Default (unselected) state
                  )}
                  onClick={() => handleHotspotClick(hotspot.id)}
                  aria-label={hotspot.label || `Hotspot area ${hotspot.id}`}
                />
              );
            }
            return null;
          })}
        </svg>
      )}
    </div>
  );
}
