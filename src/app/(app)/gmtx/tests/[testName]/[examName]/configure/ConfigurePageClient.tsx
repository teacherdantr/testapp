
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/components/gmtx/StatCard';

interface ConfigurePageClientProps {
    categoryData: {
        icon: string;
        title: string;
    };
    examName: string;
    testId: string;
    examDetails: {
        questions: number;
        timeAllowed: number;
        passingScore: number;
        totalScore: number;
    };
}

export function ConfigurePageClient({ categoryData, examName, testId, examDetails }: ConfigurePageClientProps) {
  const router = useRouter();
  
  const handleStartTest = () => {
    router.push(`/gmtx/test/${testId}`);
  };

  return (
    <main className="flex-1 flex flex-col bg-blue-50 p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Image src={categoryData.icon} alt={categoryData.title} width={40} height={40} data-ai-hint="logo" />
        <h1 className="text-2xl font-bold text-gray-800">{examName}</h1>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-2xl bg-white p-8 shadow-lg rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] items-center gap-x-6 gap-y-4 mb-6">
            <label htmlFor="language-select" className="text-right font-medium text-gray-700">Ngôn ngữ :</label>
            <Select defaultValue="vietnamese">
              <SelectTrigger id="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vietnamese">tiếng việt</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>

            <label htmlFor="mode-select" className="text-right font-medium text-gray-700">Chế độ :</label>
            <div>
                <Select defaultValue="testing">
                    <SelectTrigger id="mode-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="testing">Testing</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Testing Mode is timed and does not provide detailed feedback on answers</p>
            </div>
          </div>
          
          <Separator className="my-8"/>

          <div className="grid grid-cols-3 gap-6 text-center mb-10">
            <StatCard label="Questions" value={examDetails.questions} />
            <StatCard label="Minutes" subLabel="Time Allowed" value={examDetails.timeAllowed} />
            <StatCard label={`Out of ${examDetails.totalScore}`} subLabel="Passing Score" value={examDetails.passingScore} />
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" size="lg" onClick={() => router.back()}>Cancel</Button>
            <Button size="lg" onClick={handleStartTest}>Start Test</Button>
          </div>

        </Card>
      </div>
    </main>
  );
}
