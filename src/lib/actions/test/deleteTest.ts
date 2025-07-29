'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function deleteTestById(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // First, check if there are any submissions for this test
    const submissionCount = await prisma.userScore.count({
      where: { testId: testId },
    });

    if (submissionCount > 0) {
      return {
        success: false,
        error: `Cannot delete test. There are ${submissionCount} submission(s) associated with it. Please delete the submissions first if you wish to proceed.`,
      };
    }

    // If no submissions, proceed with deletion
    await prisma.test.delete({ where: { id: testId } });
    return { success: true };
  } catch (e: any) {
    console.error("Prisma deleteTestById error:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025') {
        return { success: false, error: 'Test not found.' };
      }
    }
    return { success: false, error: `Failed to delete test. ${e.message}` };
  }
}
