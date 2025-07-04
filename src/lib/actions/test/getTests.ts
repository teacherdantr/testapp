
import { prisma } from '@/lib/prisma';
import type { Test, Question } from '@/lib/types';
import { QuestionType } from '@/lib/types';
import type { Prisma } from '@prisma/client';
import { mapPrismaQuestionToViewQuestion } from './mappers'; // Assuming mappers are in './mappers'

export async function fetchTestById(testId: string): Promise<Test | null> {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) return null;

    const processedQuestionsWithAnswers = test.questions.map(mapPrismaQuestionToViewQuestion);

    const studentViewQuestions = processedQuestionsWithAnswers.map(q => {
      const { correctAnswer, ...studentQuestionFields } = q;
      return {
        ...studentQuestionFields,
         choices: (q.type === QuestionType.MatchingSelect && Array.isArray(q.choices))
          ? [...q.choices].sort(() => Math.random() - 0.5)
          : q.choices,
        correctAnswer: '' as any,
      };
    });

    return {
      ...test,
      questions: studentViewQuestions as Question[], // Cast to Question[]
      password: test.password ? 'protected' : undefined,
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
    };
  } catch (e: any) {
    console.error("Prisma fetchTestById error:", e);
    return null;
  }
}

export async function fetchAdminTestById(testId: string): Promise<Test | null> {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) return null;

    return {
      ...test,
      questions: test.questions.map(mapPrismaQuestionToViewQuestion) as Question[], // Cast to Question[]
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
    };
  } catch (e: any) {
    console.error("Prisma fetchAdminTestById error:", e);
    return null;
  }
}

export async function getAllTests(): Promise<Test[]> {
  try {
    const testsFromDb = await prisma.test.findMany({
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });

    return testsFromDb.map(test => ({
      ...test,
      questions: test.questions.map(mapPrismaQuestionToViewQuestion) as Question[], // Cast to Question[]
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
    }));
  } catch (e: any) {
    console.error("Prisma getAllTests error:", e);
    throw new Error(`Failed to fetch tests from database: ${e.message}`);
  }
}
