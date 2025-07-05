'use server';

import { prisma } from '@/lib/prisma';
import { mapFormQuestionToPrismaQuestionData } from './mappers';
import { testFormSchema } from '@/lib/validationSchemas';
import { Prisma } from '@prisma/client';
import { QuestionType } from '@/lib/types';

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
              const questionToProcess: any = {
                ...q,
                id: q.id, // Existing question ID if present
              };

              // Remove fields not relevant to the question type
              if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) delete questionToProcess.options;
              if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) delete questionToProcess.statements;
              if (q.type !== QuestionType.MatrixChoice) delete questionToProcess.categories;
              if (q.type !== QuestionType.Hotspot) {
                delete questionToProcess.hotspots;
                if (questionToProcess.multipleSelection === undefined) delete questionToProcess.multipleSelection;
              }
              if (![QuestionType.MCQ, QuestionType.MultipleChoiceMultipleAnswer, QuestionType.Hotspot, QuestionType.MatchingSelect, QuestionType.MatchingDragAndDrop].includes(q.type)) delete questionToProcess.imageUrl;
              if (q.type !== QuestionType.MatchingSelect) { delete questionToProcess.prompts; delete questionToProcess.choices; }
              if (q.type !== QuestionType.MatchingDragAndDrop) { delete questionToProcess.draggableItems; delete questionToProcess.targetItems; delete questionToProcess.allowShuffle;}

              return {
                id: questionToProcess.id,
                text: questionToProcess.text,
                type: questionToProcess.type as Prisma.QuestionType,
                points: questionToProcess.points,
                imageUrl: questionToProcess.imageUrl,
                questionData: mapFormQuestionToPrismaQuestionData(questionToProcess),
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
