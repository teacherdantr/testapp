'use client';

import NextImage from 'next/image';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Maximize2 } from 'lucide-react';

interface ImageWithZoomProps {
  imageUrl?: string;
  altText: string;
}

export default function ImageWithZoom({ imageUrl, altText }: ImageWithZoomProps) {
  if (!imageUrl) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="mb-3 relative w-full max-w-xs mx-auto border rounded-md overflow-hidden group block cursor-pointer hover:ring-2 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={`Enlarge image for ${altText}`}
        >
          <NextImage
            src={imageUrl}
            alt={altText}
            width={400}
            height={300}
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
          width={1200}
          height={800}
          className="w-full h-auto object-contain rounded-md"
        />
        <DialogClose className="absolute right-2 top-2" />
      </DialogContent>
    </Dialog>
  );
}
