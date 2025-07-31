
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { StatCard } from '@/components/gmtx/StatCard';
import { prisma } from '@/lib/prisma';
import { ConfigurePageClient } from './ConfigurePageClient';
import { mapPrismaQuestionToViewQuestion } from '@/lib/actions/test/mappers';

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

const defaultExamDetails = {
    timeAllowed: 50,
    passingScore: 700,
};

async function getTestDetails(examName: string) {
    const test = await prisma.test.findFirst({
        where: { title: examName },
        include: { questions: true },
    });

    if (!test) {
        return null;
    }

    const mappedQuestions = test.questions.map(mapPrismaQuestionToViewQuestion);

    return {
        id: test.id,
        questionCount: mappedQuestions.length,
        totalScore: mappedQuestions.reduce((sum, q) => sum + q.points, 0),
    };
}


export default async function GmtxConfigureTestPage({ params }: { params: { testName: string, examName: string }}) {
  const testName = params.testName as string;
  const examName = decodeURIComponent(params.examName as string);

  const categoryData = testDataMap[testName];
  const testDetails = await getTestDetails(examName);
  
  if (!categoryData || !testDetails) {
    return notFound();
  }
  
  return (
    <ConfigurePageClient
      categoryData={categoryData}
      examName={examName}
      testId={testDetails.id}
      examDetails={{
        questions: testDetails.questionCount,
        timeAllowed: defaultExamDetails.timeAllowed,
        passingScore: defaultExamDetails.passingScore,
        totalScore: testDetails.totalScore,
      }}
    />
  );
}
