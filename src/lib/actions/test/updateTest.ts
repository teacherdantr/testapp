'use server';

import { prisma } from '@/lib/prisma';
import { mapFormQuestionToPrismaQuestionData } from './mappers';
import { testFormSchema } from '@/lib/validationSchemas';
import { Prisma } from '@prisma/client';

export async function updateTest(testId: string, formData: FormData): Promise<{ success?: boolean; error?: string; issues?: any; testId?: string; message?: string }> {
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    password: formData.get('password') || undefined,
    questions: JSON.parse(formData.get('questions') as string || '[]'),
  };

  const validatedFields = testFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Update Validation errors (updateTest):", JSON.stringify(validatedFields.error.flatten(), null, 2));
    return {
      error: "Validation failed. Please check the form for errors.",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description, password, questions: formQuestions } = validatedFields.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { testId: testId } });

      await tx.test.update({
        where: { id: testId },
        data: {
          title,
          description,
          password: password || null,
          questions: {
            create: formQuestions.map(q => {
              console.log('q.type:', q.type); // 👈 Add this here
          
              return {
                id: q.id,
                text: q.text,
                type: q.type as Prisma.QuestionType,
                points: q.points,
                imageUrl: q.imageUrl,
                questionData: mapFormQuestionToPrismaQuestionData(q),
              };
            }),
          },
          updatedAt: new Date(),
        },
      });
    });

    return { success: true, testId: testId, message: 'Test updated successfully!' };
  } catch (e: any) {
    console.error("Prisma updateTest error:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
       return { error: `Database error during update: ${e.code} - ${e.message}. Check related data.` };
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
       return { error: `Database validation error during update: ${e.message}. Ensure all data fields are correct.` };
    }
    return { error: `Failed to update test in database. ${e.message}` };
  }
}
