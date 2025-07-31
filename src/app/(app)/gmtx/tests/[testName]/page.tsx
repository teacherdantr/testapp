
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PracticeExamItem } from '@/components/gmtx/PracticeExamItem';
import { ChevronLeft, ListChecks } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const testDataMap: { [key: string]: any } = {
  'digital-literacy-level-1': {
    title: 'Digital Literacy Level 1',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level1.svg',
    studyGuide: 'Digital Literacy Level 1 Study Guide',
    dbFilter: 'LV01',
  },
  'digital-literacy-level-2': {
    title: 'Digital Literacy Level 2',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level2.svg',
    studyGuide: 'Digital Literacy Level 2 Study Guide',
    dbFilter: null, // No filter for now
  },
  'digital-literacy-level-3': {
    title: 'Digital Literacy Level 3',
    icon: 'https://content.gmetrix.net/images/ColorSVGIcons/IconIC3Level3.svg',
    studyGuide: 'Digital Literacy Level 3 Study Guide',
    dbFilter: null, // No filter for now
  },
};

export default async function GmtxTestDetailsPage({ params }: { params: { testName: string } }) {
  const { testName } = params;
  const data = testDataMap[testName];

  if (!data) {
    return notFound();
  }

  let practiceExams: Array<{ name: string; passed: boolean }> = [];
  if (data.dbFilter) {
    const testsFromDb = await prisma.test.findMany({
      where: {
        title: {
          contains: data.dbFilter,
        },
      },
      select: {
        title: true,
      },
      orderBy: {
        title: 'asc',
      }
    });
    practiceExams = testsFromDb.map(test => ({
      name: test.title,
      passed: false, // Defaulting to not passed
    }));
  }

  return (
    <main className="flex-1 flex flex-col bg-gray-50 p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/gmtx" aria-label="Go back">
            <ChevronLeft className="h-6 w-6" />
          </Link>
        </Button>
        <Image src={data.icon} alt={data.title} width={40} height={40} data-ai-hint="logo" />
        <h1 className="text-2xl font-bold text-gray-800">{data.title}</h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Practice Exams</h2>
          <div className="space-y-4">
            {practiceExams.length > 0 ? (
              practiceExams.map((exam) => (
                <PracticeExamItem key={exam.name} name={exam.name} passed={exam.passed} />
              ))
            ) : (
              <p className="text-sm text-gray-500">No practice exams available for this level yet.</p>
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
