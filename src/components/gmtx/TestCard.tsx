
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';

interface TestCardProps {
  name: string;
  image: string;
  hint: string;
  href?: string; // Future-proofing for adding links
}

export function TestCard({ name, image, hint, href = '#' }: TestCardProps) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 cursor-pointer group">
      <Card className="w-full aspect-[16/10] flex items-center justify-center p-4 shadow-md hover:shadow-lg hover:border-primary transition-all duration-200">
        <div className="relative w-full h-full">
          <Image src={image} alt={name} fill style={{ objectFit: 'contain' }} data-ai-hint={hint} />
        </div>
      </Card>
      <p className="text-sm font-medium text-center text-gray-600 group-hover:text-primary transition-colors">{name}</p>
    </Link>
  );
}
