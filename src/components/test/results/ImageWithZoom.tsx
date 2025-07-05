
'use client';

import NextImage from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface ImageWithZoomProps {
  imageUrl?: string;
  questionId: string;
  altText: string;
  // Props for managing modal state from parent
  isImageModalOpen: boolean;
  modalImageUrl: string | null;
  openImageModal: (url: string) => void;
  setIsImageModalOpen: (isOpen: boolean) => void;
  // Prop for image dimensions if needed by parent (e.g., Hotspot)
  onImageDimensionsChange?: (questionId: string, dimensions: { width: number, height: number } | null) => void;
}

export default function ImageWithZoom({
  imageUrl,
  questionId,
  altText,
  isImageModalOpen,
  modalImageUrl,
  openImageModal,
  setIsImageModalOpen,
  onImageDimensionsChange,
}: ImageWithZoomProps) {
  if (!imageUrl) return null;

  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const imgElement = imageRef.current;
    if (!imgElement) return;

    const updateDimensions = () => {
      if (imgElement.offsetWidth > 0 && imgElement.offsetHeight > 0) {
        const dimensions = { width: imgElement.offsetWidth, height: imgElement.offsetHeight };
        if (onImageDimensionsChange) {
          onImageDimensionsChange(questionId, dimensions);
        }
      } else {
         if (onImageDimensionsChange) {
             onImageDimensionsChange(questionId, null);
         }
      }
    };

    if (imgElement.complete && imgElement.naturalWidth > 0) {
      updateDimensions();
    } else {
      imgElement.onload = updateDimensions;
      // Fallback for cached images not triggering onload sometimes
      if (!imgElement.complete && imgElement.naturalWidth === 0) {
        const timer = setTimeout(updateDimensions, 100);
        return () => clearTimeout(timer);
      }
    }

    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(imgElement);

    return () => {
      imgElement.onload = null;
      resizeObserver.unobserve(imgElement);
    };
  }, [imageUrl, questionId, onImageDimensionsChange]); // Added dependencies


  return (
    <Dialog open={isImageModalOpen && modalImageUrl === imageUrl} onOpenChange={(isOpen) => { if (!isOpen) setModalImageUrl(null); setIsImageModalOpen(isOpen); }}>
      <DialogTrigger asChild>
        <button
          type="button"
          onClick={() => openImageModal(imageUrl)}
          className="mb-3 relative w-full max-w-xs mx-auto border rounded-md overflow-hidden group block cursor-pointer hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Enlarge image for ${altText}`}
        >
          <NextImage
            ref={imageRef}
            src={imageUrl}
            alt={altText}
            width={400} // Example, adjust as needed or make prop
            height={300} // Example, adjust as needed or make prop
            className="w-full h-auto block object-contain"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200">
            <Maximize2 className="h-8 w-8 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-2">
        <NextImage
          src={imageUrl}
          alt={altText + " - Enlarged"}
          width={1200} // Example, adjust as needed or make prop
          height={800} // Example, adjust as needed or make prop
          className="w-full h-auto object-contain rounded-md"
        />
        <DialogClose className="absolute right-2 top-2" />
      </DialogContent>
    </Dialog>
  );
}