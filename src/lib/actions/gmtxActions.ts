
'use server';

import { prisma } from '@/lib/prisma';

export async function verifyGmtxTestPassword(testId: string, passwordAttempt: string): Promise<{ authorized: boolean; error?: string }> {
  if (!testId || !passwordAttempt) {
    return { authorized: false, error: 'Test ID and password are required.' };
  }

  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { password: true },
    });

    if (!test) {
      return { authorized: false, error: 'Test not found.' };
    }

    // If test has no password, it's authorized
    if (!test.password) {
      return { authorized: true };
    }
    
    // Check if the provided password matches
    if (test.password === passwordAttempt) {
      return { authorized: true };
    } else {
      return { authorized: false, error: 'Incorrect password.' };
    }
  } catch (e) {
    console.error(`Error verifying password for test ${testId}:`, e);
    return { authorized: false, error: 'A server error occurred during password verification.' };
  }
}
