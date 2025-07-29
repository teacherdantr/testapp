
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NextImage from 'next/image';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
}

export function TestInterfaceImageModal({ isOpen, onClose, imageUrl }: ImageModalProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-2">
        <DialogHeader>
          <DialogTitle className="sr-only">Enlarged Image</DialogTitle>
        </DialogHeader>
        <NextImage
          src={imageUrl}
          alt={"Enlarged question image"}
          width={1200}
          height={800}
          className="w-full h-auto object-contain rounded-md"
        />
      </DialogContent>
    </Dialog>
  );
}
