
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Printer } from 'lucide-react';
import type { TestResult } from '@/lib/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface GmtxResultsPageProps {
  result: TestResult;
}

const formatTime = (seconds?: number) => {
  if (seconds === undefined) return '00:00:00';
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export function GmtxResultsPage({ result }: GmtxResultsPageProps) {
  const router = useRouter();
  const passingScore = 32; // This seems hardcoded in the image, so we'll do the same
  const passed = result.score >= passingScore;
  const scorePercentage = result.totalPoints > 0 ? (result.score / result.totalPoints) * 100 : 0;
  const dateFinished = format(new Date(), 'dd/MM/yyyy h:mm:ss aa');

  return (
    <div className="flex-1 bg-white p-6 overflow-y-auto">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Image src="https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level1.svg" alt="IC3 Digital Literacy Level 1" width={40} height={40} data-ai-hint="logo" />
        <h1 className="text-2xl font-bold text-gray-800">Digital Literacy Level 1</h1>
      </header>

      <main>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-700">{result.testTitle} Training</h2>
          <Button variant="ghost" size="icon">
            <Printer className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm mb-8">
          <div>
            <p className="font-semibold text-gray-500">Category</p>
            <p className="text-gray-800">IC3 GS6</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Thời gian Sử dụng</p>
            <p className="text-gray-800">{formatTime(result.timeTaken)} / 00:50:00</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Product</p>
            <p className="text-gray-800">Digital Literacy Level 1</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Điểm</p>
            <p className="text-gray-800">{result.score} / {result.totalPoints}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Chế độ</p>
            <p className="text-gray-800">Training</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Min. Passing Score</p>
            <p className="text-gray-800">{passingScore} / {result.totalPoints}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-500">Date Finished</p>
            <p className="text-gray-800">{dateFinished}</p>
          </div>
        </div>
        
        <Button variant="outline" className="mb-10">Review Missed Questions</Button>

        <div className="flex justify-center items-center">
          <div className="relative w-64 h-64">
             <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="stroke-current text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
              />
              <path
                className={`stroke-current ${passed ? 'text-green-500' : 'text-red-500'}`}
                strokeDasharray={`${scorePercentage}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                 <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {passed ? 'Passed' : 'Failed'}
                 </p>
                 <p className="text-5xl font-bold text-gray-800">{scorePercentage.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
