
'use server';

import { prisma } from "@/lib/prisma";
import type { Prisma } from '@prisma/client';

export async function cloneTest(testId: string): Promise<{ success: boolean; newTest?: Prisma.TestGetPayload<{ include: { questions: true }}>; error?: string }> {
  try {
    const originalTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: true,
      },
    });

    if (!originalTest) {
      return { success: false, error: "Original test not found." };
    }

    // Create the new test by duplicating data.
    // Prisma will auto-generate new IDs for the test and its questions.
    const newTest = await prisma.test.create({
      data: {
        title: `${originalTest.title} (Copy)`,
        description: originalTest.description,
        password: originalTest.password,
        questions: {
          create: originalTest.questions.map((q) => ({
            text: q.text,
            type: q.type as Prisma.QuestionType, // Ensure type matches Prisma's enum
            points: q.points,
            imageUrl: q.imageUrl,
            questionData: q.questionData as Prisma.JsonObject, // Pass the JSON data directly
          })),
        },
      },
      include: {
        questions: true, // Include the newly created questions in the return object
      },
    });

    return { success: true, newTest };

  } catch (e: any) {
    console.error("Prisma cloneTest error:", e);
    return { success: false, error: `Failed to clone test in database. ${e.message}` };
  }
}
