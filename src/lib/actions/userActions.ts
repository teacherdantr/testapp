
'use server';

import { z } from 'zod';
import { getUserTestHistory, getAllUserTestResults } from '@/lib/mockDb';
import type { StoredTestResult } from '@/lib/types';

const userIdSchema = z.string().min(1, 'User identifier cannot be empty.');

export async function fetchUserScoreHistory(userId: string): Promise<StoredTestResult[] | { error: string }> {
  const validatedUserId = userIdSchema.safeParse(userId);

  if (!validatedUserId.success) {
    return { error: validatedUserId.error.flatten().fieldErrors._errors.join(', ') };
  }

  try {
    const history = await getUserTestHistory(validatedUserId.data);
    return history;
  } catch (error) {
    console.error('Error fetching user score history:', error);
    return { error: 'Failed to fetch score history.' };
  }
}

export async function fetchAllPublicTestSubmissions(): Promise<StoredTestResult[] | { error: string }> {
  try {
    const submissions = await getAllUserTestResults();
    return submissions;
  } catch (error) {
    console.error('Error fetching all public test submissions:', error);
    return { error: 'Failed to fetch public test records.' };
  }
}
