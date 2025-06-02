
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
      testTitle: score.testTitleSnapshot, // Use the snapshot
      score: score.score,
      totalPoints: score.totalPoints,
      questionResults: score.questionResultsDetails as TestResult['questionResults'], // Assuming structure matches
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
      testTitle: score.testTitleSnapshot, // Use the snapshot
      score: score.score,
      totalPoints: score.totalPoints,
      questionResults: score.questionResultsDetails as TestResult['questionResults'], // Assuming structure matches
      submittedAt: score.submittedAt.toISOString(),
      timeTaken: score.timeTakenSeconds ?? undefined,
      testMode: score.testMode as StoredTestResult['testMode'] | undefined,
    }));
  } catch (e: any) {
    console.error('Error fetching all public test submissions with Prisma:', e);
    return { error: `Failed to fetch public test records. ${e.message}` };
  }
}
