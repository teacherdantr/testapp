
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PracticeExamItem } from '@/components/gmtx/PracticeExamItem';
import { ChevronLeft, ListChecks, MoreVertical } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';

const testDataMap: { [key: string]: any } = {
  'digital-literacy-level-1': {
    title: 'Digital Literacy Level 1',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level1.svg',
    practiceExams: [
      { name: 'Digital Literacy Level 1 Test 1', passed: true },
      { name: 'Digital Literacy Level 1 Test 2', passed: true },
    ],
    studyGuide: 'Digital Literacy Level 1 Study Guide',
  },
  'digital-literacy-level-2': {
    title: 'Digital Literacy Level 2',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level2.svg',
    practiceExams: [
      { name: 'Digital Literacy Level 2 Test 1', passed: false },
      { name: 'Digital Literacy Level 2 Test 2', passed: false },
    ],
    studyGuide: 'Digital Literacy Level 2 Study Guide',
  },
  'digital-literacy-level-3': {
    title: 'Digital Literacy Level 3',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level3.svg',
    practiceExams: [
      { name: 'Digital Literacy Level 3 Test 1', passed: false },
      { name: 'Digital Literacy Level 3 Test 2', passed: false },
    ],
    studyGuide: 'Digital Literacy Level 3 Study Guide',
  },
};

export default function GmtxTestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const testName = params.testName as string;

  const data = testDataMap[testName];

  if (!data) {
    // In a real app, you might fetch data and show a loading state,
    // or redirect to a 404 page if not found.
    return notFound();
  }

  return (
    <main className="flex-1 flex flex-col bg-gray-50 p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Image src={data.icon} alt={data.title} width={40} height={40} data-ai-hint="logo" />
        <h1 className="text-2xl font-bold text-gray-800">{data.title}</h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Practice Exams</h2>
          <div className="space-y-4">
            {data.practiceExams.length > 0 ? (
              data.practiceExams.map((exam: any) => (
                <PracticeExamItem key={exam.name} name={exam.name} passed={exam.passed} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No practice exams available for this level.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Study Guide</h2>
          <Card className="p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-700">{data.studyGuide}</span>
            </div>
            <Button>Bắt đầu</Button>
          </Card>
        </section>
      </div>
    </main>
  );
}
