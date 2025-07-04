'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function deleteTestById(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.test.delete({ where: { id: testId } });
    return { success: true };
  } catch (e: any)
   {
    console.error("Prisma deleteTestById error:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return { success: false, error: 'Test not found.' };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
         return { success: false, error: `Failed to delete test. Associated user scores might exist. (${e.message})` };
    }
    return { success: false, error: `Failed to delete test. ${e.message}` };
  }
}