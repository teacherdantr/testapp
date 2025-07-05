'use server';

import { prisma } from "@/lib/prisma";
import { testFormSchema } from "@/lib/validationSchemas";
import { mapFormQuestionToPrismaQuestionData } from "@/lib/actions/test/mappers"; // Assuming you'll create this mappers file
import { QuestionType } from "@/lib/types";

export async function createTest(formData: FormData) {
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    password: formData.get('password') || undefined,
    questions: JSON.parse(formData.get('questions') as string || '[]'),
  };

  const validatedFields = testFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Validation errors (createTest):", validatedFields.error.flatten().fieldErrors);
    return {
      error: "Validation failed",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, description, password, questions: formQuestions } = validatedFields.data;

  try {
    const newTest = await prisma.test.create({
      data: {
        title,
        description,
        password,
        questions: {
          create: formQuestions.map(q => {
            let processedQuestion: any = { ...q };

            // Clean up fields not relevant to the question type
            if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) delete processedQuestion.options;
            if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) delete processedQuestion.statements;
            if (q.type !== QuestionType.MatrixChoice) delete processedQuestion.categories;
            if (q.type !== QuestionType.Hotspot) {
              delete processedQuestion.hotspots;
              if (processedQuestion.multipleSelection === undefined) delete processedQuestion.multipleSelection;
            }
            if (![QuestionType.Hotspot, QuestionType.MCQ, QuestionType.MultipleChoiceMultipleAnswer, QuestionType.MatchingSelect, QuestionType.MatchingDragAndDrop].includes(q.type)) {
              delete processedQuestion.imageUrl;
            }
            if (q.type !== QuestionType.MatchingSelect) { delete processedQuestion.prompts; delete processedQuestion.choices; }
            if (q.type !== QuestionType.MatchingDragAndDrop) { delete processedQuestion.draggableItems; delete processedQuestion.targetItems; delete processedQuestion.allowShuffle;}


            if (q.type === QuestionType.MatchingSelect && Array.isArray(q.correctAnswer)) {
               processedQuestion.correctAnswer = q.correctAnswer.map(match => ({
                 promptId: (match as any).promptId,
                 choiceId: (match as any).choiceId,
               }));
            }

            return {
              text: q.text,
              type: String(q.type), // Ensure type is a string
              points: q.points,
              imageUrl: q.imageUrl,
              questionData: mapFormQuestionToPrismaQuestionData(processedQuestion),
            };
          }),
        },
      },
    });
    return { testId: newTest.id, message: 'Test created successfully!' };
  } catch (e: any) {
    console.error("Prisma createTest error:", e);
    return { error: `Failed to create test in database. ${e.message}` };
  }
}
