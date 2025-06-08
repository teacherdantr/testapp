
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Import Prisma client
import type { StoredTestResult, TestResult } from '@/lib/types';
import type { Prisma } from '@prisma/client';

const userIdSchema = z.string().min(1, 'User identifier cannot be empty.');

export async function fetchUserScoreHistory(userId: string): Promise<StoredTestResult[] | { error: string }> {
  const validatedUserId = userIdSchema.safeParse(userId);

  if (!validatedUserId.success) {
    return { error: validatedUserId.error.flatten().fieldErrors._errors.join(', ') };
  }

  try {
    const userScoresFromDb = await prisma.userScore.findMany({
      where: { userId: validatedUserId.data },
      orderBy: { submittedAt: 'desc' },
    });

    // Map Prisma UserScore to StoredTestResult type
    return userScoresFromDb.map(score => ({
      userId: score.userId,
      testId: score.testId,
      testTitle: score.testTitle,
      score: score.score,
      totalPoints: score.totalPoints,
      questionResults: score.questionResultsDetails as TestResult['questionResults'],
      submittedAt: score.submittedAt.toISOString(),
      timeTaken: score.timeTakenSeconds ?? undefined,
      testMode: score.testMode as StoredTestResult['testMode'] | undefined,
    }));
  } catch (e: any) {
    console.error('Error fetching user score history with Prisma:', e);
    return { error: `Failed to fetch score history. ${e.message}` };
  }
}

export async function fetchAllPublicTestSubmissions(): Promise<StoredTestResult[] | { error: string }> {
  try {
    const allScoresFromDb = await prisma.userScore.findMany({
      orderBy: { submittedAt: 'desc' },
    });

    // Map Prisma UserScore to StoredTestResult type
    return allScoresFromDb.map(score => ({
      userId: score.userId,
      testId: score.testId,
      testTitle: score.testTitle,
      score: score.score,
      totalPoints: score.totalPoints,
      questionResults: score.questionResultsDetails as TestResult['questionResults'],
      submittedAt: score.submittedAt.toISOString(),
      timeTaken: score.timeTakenSeconds ?? undefined,
      testMode: score.testMode as StoredTestResult['testMode'] | undefined,
    }));
  } catch (e: any) {
    console.error('Error fetching all public test submissions with Prisma:', e);
    return { error: `Failed to fetch public test records. ${e.message}` };
  }
}

const deleteUserScoreSchema = z.object({
  userId: z.string(),
  testId: z.string(),
  submittedAt: z.string().datetime(), // Expect ISO string
});

export async function deleteUserScoreByIds(
  params: z.infer<typeof deleteUserScoreSchema>
): Promise<{ success: boolean; error?: string }> {
  console.log("[deleteUserScoreByIds Action] Received params:", params);
  const validatedParams = deleteUserScoreSchema.safeParse(params);

  if (!validatedParams.success) {
    console.error("[deleteUserScoreByIds Action] Validation failed:", validatedParams.error.flatten());
    return { success: false, error: 'Invalid parameters for deletion.' };
  }

  const { userId, testId, submittedAt } = validatedParams.data;

  try {
    const result = await prisma.userScore.delete({
      where: {
        userId_testId_submittedAt: {
          userId: userId,
          testId: testId,
          submittedAt: new Date(submittedAt), // Convert ISO string to Date object
        },
      },
    });
    console.log("[deleteUserScoreByIds Action] Deletion successful, result:", result);
    return { success: true };
  } catch (e: any) {
    console.error('[deleteUserScoreByIds Action] Error deleting user score with Prisma:', e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return { success: false, error: 'Submission record not found for deletion.' };
    }
    return { success: false, error: `Failed to delete submission. ${e.message}` };
  }
}

