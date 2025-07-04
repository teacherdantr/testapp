import { prisma } from "@/lib/prisma";
import { testFormSchema } from "@/lib/validationSchemas";
import { mapFormQuestionToPrismaQuestionData } from "@/lib/actions/test/mappers"; // Assuming you'll create this mappers file

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
          create: formQuestions.map(q => ({
            text: q.text,
            type: String(q.type), // Ensure type is a string
            points: q.points,
            imageUrl: q.imageUrl,
            questionData: mapFormQuestionToPrismaQuestionData(q),
          })),
        },
      },
    });
    return { testId: newTest.id, message: 'Test created successfully!' };
  } catch (e: any) {
    console.error("Prisma createTest error:", e);
    return { error: `Failed to create test in database. ${e.message}` };
  }
}
