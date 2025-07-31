
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SessionCard } from '@/components/gmtx/SessionCard';
import Link from 'next/link';

const testDataMap: { [key: string]: any } = {
  'digital-literacy-level-1': {
    title: 'Digital Literacy Level 1',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level1.svg',
  },
  'digital-literacy-level-2': {
    title: 'Digital Literacy Level 2',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level2.svg',
  },
  'digital-literacy-level-3': {
    title: 'Digital Literacy Level 3',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level3.svg',
  },
};

const examData = {
    'Digital Literacy Level 1 Test 1': [
      { lastSaved: '7 thg 7, 2025', mode: 'Testing', progress: 64 },
      { lastSaved: '7 thg 7, 2025', mode: 'Testing', progress: 66 },
      { lastSaved: '7 thg 7, 2025', mode: 'Testing', progress: 93 },
      { lastSaved: '7 thg 7, 2025', mode: 'Testing', progress: 33 },
      { lastSaved: '7 thg 7, 2025', mode: 'Training', progress: 22 },
      { lastSaved: '7 thg 7, 2025', mode: 'Testing', progress: 0 },
      { lastSaved: '13 thg 6, 2025', mode: 'Training', progress: 0 },
      { lastSaved: '27 thg 5, 2025', mode: 'Training', progress: 88 },
      { lastSaved: '26 thg 5, 2025', mode: 'Training', progress: 100 },
    ],
    'Digital Literacy Level 1 Test 2': [],
    'Digital Literacy Level 2 Test 1': [],
    'Digital Literacy Level 2 Test 2': [],
    'Digital Literacy Level 3 Test 1': [],
    'Digital Literacy Level 3 Test 2': [],
};


export default function GmtxExamSessionsPage() {
  const router = useRouter();
  const params = useParams();
  const testName = params.testName as string;
  const examName = decodeURIComponent(params.examName as string);

  const configureLink = `/gmtx/tests/${testName}/${params.examName}/configure`;

  const categoryData = testDataMap[testName];
  const sessions = (examData as any)[examName] || [];


  if (!categoryData) {
    return notFound();
  }

  return (
    <main className="flex-1 flex flex-col bg-gray-50 p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Image src={categoryData.icon} alt={categoryData.title} width={40} height={40} data-ai-hint="logo" />
        <h1 className="text-2xl font-bold text-gray-800">{examName}</h1>
      </header>
      
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">Start a new test or resume one below</p>
        <Button asChild>
          <Link href={configureLink}>New Test</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session: any, index: number) => (
          <SessionCard key={index} {...session} />
        ))}
      </div>
      
      {sessions.length === 0 && (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm mt-4">
              <p className="text-muted-foreground">No saved sessions for this test.</p>
              <p className="text-muted-foreground">Click 'New Test' to begin.</p>
          </div>
      )}

    </main>
  );
}
