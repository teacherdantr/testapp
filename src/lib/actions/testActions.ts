
'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma'; // Import Prisma client
import type { Test, UserAnswer, Question, TestResult, StoredTestResult, Option as OptionType, TrueFalseStatement, Category, HotspotArea, MatchingItem } from '@/lib/types';
import { QuestionType, HotspotShapeType } from '@/lib/types';
import { generateAnswerOptions as AIGenerateOptions } from '@/ai/flows/prevent-bias';
import type { Prisma } from '@prisma/client';

// Zod schemas for form validation (these remain largely the same)
const optionSchema = z.object({
  id: z.string().optional(), // Must be optional for new items
  text: z.string().min(1, 'Option text cannot be empty')
});

const trueFalseStatementSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Statement text cannot be empty'),
});

const categorySchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Category text cannot be empty'),
});

const hotspotAreaSchema = z.object({
  id: z.string().optional(),
  shape: z.nativeEnum(HotspotShapeType),
  coords: z.string().min(1, 'Coordinates cannot be empty')
    .regex(/^((\d+(\.\d+)?),){1,}(\d+(\.\d+)?)$/, 'Coordinates must be comma-separated numbers (e.g., 0.1,0.1,0.2,0.1 for rect; 0.5,0.5,0.05 for circle; 0.1,0.1,0.2,0.1,0.15,0.2 for poly)'),
  label: z.string().optional(),
});

const matchingItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Item text cannot be empty"),
});

const correctMatchSchema = z.object({
  promptId: z.string(), // This ID must reference an ID from the 'prompts' array
  choiceId: z.string().min(1, "Each prompt must be matched to a choice."), // This ID must reference an ID from the 'choices' array
});

// This schema validates the structure coming from the form
const formQuestionSchema = z.object({
  id: z.string().optional(), // For updates, this is the original question ID
  text: z.string().min(1, 'Question text cannot be empty'),
  type: z.nativeEnum(QuestionType),
  imageUrl: z.string().optional().refine(val => !val || val.startsWith('https://') || val.startsWith('/images/'), {
    message: 'Image URL must be a valid HTTPS URL or a local path like /images/your-image.png (optional)',
  }),
  options: z.array(optionSchema).optional(),
  statements: z.array(trueFalseStatementSchema).optional(),
  categories: z.array(categorySchema).optional(),
  hotspots: z.array(hotspotAreaSchema).optional(),
  multipleSelection: z.boolean().optional(),
  prompts: z.array(matchingItemSchema).optional(),
  choices: z.array(matchingItemSchema).optional(),
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()),
    z.array(correctMatchSchema),
  ]),
  points: z.number().min(1, 'Points must be at least 1'),
}).refine(data => {
  if ((data.type === QuestionType.MCQ || data.type === QuestionType.MultipleChoiceMultipleAnswer) && (!data.options || data.options.length < 2)) {
    return false;
  }
  return true;
}, { message: 'MCQ and MCMA questions must have at least two options.', path: ['options'] })
.refine(data => { 
  if (data.type === QuestionType.MultipleChoiceMultipleAnswer || (data.type === QuestionType.Hotspot && data.multipleSelection)) {
    if (!(Array.isArray(data.correctAnswer) && data.correctAnswer.length > 0 && typeof data.correctAnswer[0] === 'string')) return false;
    if (data.type === QuestionType.Hotspot && data.hotspots) { // Check if correct hotspot IDs exist in hotspots array
        return (data.correctAnswer as string[]).every(caId => data.hotspots!.some(h => h.id === caId));
    }
    if (data.type === QuestionType.MultipleChoiceMultipleAnswer && data.options) { // Check if correct option texts exist
        return (data.correctAnswer as string[]).every(caText => data.options!.some(o => o.text === caText));
    }
  }
  if (data.type === QuestionType.MultipleTrueFalse || data.type === QuestionType.MatrixChoice) {
    return Array.isArray(data.correctAnswer) && data.statements && data.correctAnswer.length === data.statements.length && typeof data.correctAnswer[0] === 'string';
  }
   if (data.type === QuestionType.MultipleTrueFalse) {
    return (data.correctAnswer as string[]).every(ans => ans === 'true' || ans === 'false');
  }
  if (data.type === QuestionType.MatrixChoice) {
    return data.categories && data.categories.length > 0 && (data.correctAnswer as string[]).every(ans => data.categories?.map(c => c.text).includes(ans));
  }
  if (data.type === QuestionType.Hotspot && !data.multipleSelection) {
    if(!(typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '')) return false;
    if (data.hotspots) { // Check if the single correct hotspot ID exists
        return data.hotspots.some(h => h.id === data.correctAnswer);
    }
  }
  if (data.type === QuestionType.MatchingSelect) {
    return Array.isArray(data.correctAnswer) && data.prompts && data.prompts.length > 0 && data.choices && data.choices.length > 0 && data.correctAnswer.length === data.prompts.length &&
           (data.correctAnswer as z.infer<typeof correctMatchSchema>[]).every(match => 
             data.prompts?.some(p => p.id === match.promptId) && 
             data.choices?.some(c => c.id === match.choiceId) && 
             match.choiceId.trim() !== '' // Ensures choiceId is not empty and references an actual choice
           );
  }
  if ([QuestionType.MCQ, QuestionType.TrueFalse, QuestionType.ShortAnswer].includes(data.type)) {
    if (!(typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '')) return false;
    if (data.type === QuestionType.MCQ && data.options) { // Check if MCQ correct answer is one of the options
        return data.options.some(o => o.text === data.correctAnswer);
    }
  }
  return true;
}, { message: 'Correct answer(s) must be provided, in the correct format, and reference existing items (options/hotspots/prompts/choices) for the question type.', path: ['correctAnswer'] })
.refine(data => {
    if (data.type === QuestionType.MultipleTrueFalse || data.type === QuestionType.MatrixChoice) {
        return data.statements && data.statements.length > 0 && data.statements.every(st => st.text.trim() !== '');
    }
    return true;
}, { message: 'Multiple True/False or MatrixChoice questions must have at least one statement with text.', path: ['statements']})
.refine(data => {
  if (data.type === QuestionType.MatrixChoice) {
    return data.categories && data.categories.length >= 1 && data.categories.every(cat => cat.text.trim() !== '');
  }
  return true;
}, { message: 'MatrixChoice questions must have at least one category with text.', path: ['categories']})
.refine(data => {
  if (data.type === QuestionType.Hotspot) {
    return !!(data.imageUrl && data.imageUrl.trim() !== '' && (data.imageUrl.startsWith('https://') || data.imageUrl.startsWith('/images/')));
  }
  return true;
}, { message: 'A valid HTTPS or local (/images/...) Image URL is required for Hotspot questions.', path: ['imageUrl']})
.refine(data => {
  if (data.type === QuestionType.Hotspot) {
    return data.hotspots && data.hotspots.length > 0 && data.hotspots.every(hs => hs.coords.trim() !== '');
  }
  return true;
}, { message: 'Hotspot questions must have at least one hotspot defined with coordinates.', path: ['hotspots']})
.refine(data => {
  if (data.type === QuestionType.MatchingSelect) {
    return data.prompts && data.prompts.length >= 1 && data.prompts.every(p => p.text.trim() !== '') &&
           data.choices && data.choices.length >= 1 && data.choices.every(c => c.text.trim() !== '');
  }
  return true;
}, { message: 'Matching questions must have at least one prompt item and one choice item, all with text.', path: ['prompts']});


const testFormSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().optional(),
  password: z.string().optional(),
  questions: z.array(formQuestionSchema).min(1, 'A test must have at least one question'),
});

function mapFormQuestionToPrismaQuestionData(q: z.infer<typeof formQuestionSchema>): Prisma.JsonObject {
  const questionData: any = {
    // correctAnswer is already in the correct structure from the client/Zod validation
    correctAnswer: q.correctAnswer, 
  };

  // Add type-specific fields. Client ensures IDs are present for sub-items.
  if (q.options) questionData.options = q.options;
  if (q.statements) questionData.statements = q.statements;
  if (q.categories) questionData.categories = q.categories;
  if (q.hotspots) questionData.hotspots = q.hotspots;
  if (q.multipleSelection !== undefined) questionData.multipleSelection = q.multipleSelection;
  if (q.prompts) questionData.prompts = q.prompts;
  if (q.choices) questionData.choices = q.choices;
  
  return questionData as Prisma.JsonObject;
}


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
            // id for question itself is auto-generated by Prisma on create
            text: q.text,
            type: q.type,
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
            create: formQuestions.map(q => ({
              // q.id here is the *original* question ID if it existed,
              // but since we delete and recreate, Prisma will assign new IDs.
              // The client-side form should primarily use these q.id for keying in React.
              text: q.text,
              type: q.type,
              points: q.points,
              imageUrl: q.imageUrl,
              questionData: mapFormQuestionToPrismaQuestionData(q),
            })),
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

function mapPrismaQuestionToViewQuestion(prismaQuestion: Prisma.QuestionGetPayload<{}>): Question {
  const qData = prismaQuestion.questionData as Prisma.JsonObject || {};
  return {
    id: prismaQuestion.id,
    text: prismaQuestion.text,
    type: prismaQuestion.type as QuestionType, 
    imageUrl: prismaQuestion.imageUrl || undefined,
    points: prismaQuestion.points,
    options: qData.options ? qData.options as OptionType[] : undefined,
    statements: qData.statements ? qData.statements as TrueFalseStatement[] : undefined,
    categories: qData.categories ? qData.categories as Category[] : undefined,
    hotspots: qData.hotspots ? qData.hotspots as HotspotArea[] : undefined,
    multipleSelection: qData.multipleSelection !== undefined ? qData.multipleSelection as boolean : undefined,
    prompts: qData.prompts ? qData.prompts as MatchingItem[] : undefined,
    choices: qData.choices ? qData.choices as MatchingItem[] : undefined,
    correctAnswer: qData.correctAnswer as any, // This includes the correct answer
  };
}


export async function fetchTestById(testId: string): Promise<Test | null> {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) return null;

    const processedQuestionsForStudent = test.questions.map(q => {
      const viewQuestion = mapPrismaQuestionToViewQuestion(q);
      const qDataForStudent = { ... (q.questionData as Prisma.JsonObject) };
      delete qDataForStudent.correctAnswer; 

      const studentQuestion: Question = {
        id: q.id,
        text: q.text,
        type: q.type as QuestionType,
        imageUrl: q.imageUrl || undefined,
        points: q.points,
        options: qDataForStudent.options as OptionType[] | undefined,
        statements: qDataForStudent.statements as TrueFalseStatement[] | undefined,
        categories: qDataForStudent.categories as Category[] | undefined,
        hotspots: qDataForStudent.hotspots as HotspotArea[] | undefined,
        multipleSelection: qDataForStudent.multipleSelection as boolean | undefined,
        prompts: qDataForStudent.prompts as MatchingItem[] | undefined,
        choices: (q.type === QuestionType.MatchingSelect && qDataForStudent.choices)
          ? [...(qDataForStudent.choices as MatchingItem[])].sort(() => Math.random() - 0.5)
          : qDataForStudent.choices as MatchingItem[] | undefined,
        correctAnswer: '' // Student does not get the correct answer
      };
      return studentQuestion;
    });

    return {
      ...test,
      questions: processedQuestionsForStudent,
      password: test.password ? 'protected' : undefined,
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
    };
  } catch (e: any) {
    console.error("Prisma fetchTestById error:", e);
    return null;
  }
}

export async function fetchAdminTestById(testId: string): Promise<Test | null> {
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true },
    });

    if (!test) return null;

    return {
      ...test,
      questions: test.questions.map(mapPrismaQuestionToViewQuestion),
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
    };
  } catch (e: any) {
    console.error("Prisma fetchAdminTestById error:", e);
    return null;
  }
}


export async function verifyTestPassword(testId: string, passwordAttempt: string): Promise<{ authorized: boolean; error?: string }> {
 try {
    const test = await prisma.test.findUnique({ where: { id: testId }, select: { password: true } });
    if (!test) {
      return { authorized: false, error: 'Test not found.' };
    }
    if (!test.password) {
      return { authorized: true }; 
    }
    if (test.password === passwordAttempt) {
      return { authorized: true };
    }
    return { authorized: false, error: 'Incorrect password.' };
  } catch (e: any) {
    console.error("Prisma verifyTestPassword error:", e);
    return { authorized: false, error: "Server error verifying password." };
  }
}

export async function submitTest(
  testIdString: string,
  userId: string,
  userAnswers: UserAnswer[],
  timeTaken: number,
  testMode: 'training' | 'testing' | 'race' | null
): Promise<TestResult | { error: string }> {
  try {
    const testWithQuestions = await prisma.test.findUnique({
      where: { id: testIdString },
      include: { questions: true },
    });

    if (!testWithQuestions) {
      return { error: 'Test not found.' };
    }
    if (!userId) {
      return { error: 'User identifier is missing.' };
    }

    let score = 0;
    let totalPoints = 0;

    const questionResultsPromises = testWithQuestions.questions.map(async (originalQuestion) => {
      const prismaQuestionData = originalQuestion.questionData as Prisma.JsonObject;
      const originalCorrectAnswer = prismaQuestionData.correctAnswer as Question['correctAnswer'];

      const userAnswerObj = userAnswers.find(ua => ua.questionId === originalQuestion.id);
      const rawUserAnswer = userAnswerObj ? userAnswerObj.answer : '';
      let isCorrect = false;
      let pointsEarned = 0;

      totalPoints += originalQuestion.points;

      try {
        switch (originalQuestion.type as QuestionType) {
          case QuestionType.MCQ:
            isCorrect = rawUserAnswer === originalCorrectAnswer;
            break;
          case QuestionType.TrueFalse:
            isCorrect = rawUserAnswer.toLowerCase() === (originalCorrectAnswer as string)?.toLowerCase();
            break;
          case QuestionType.ShortAnswer:
            isCorrect = rawUserAnswer.toLowerCase().trim() === (originalCorrectAnswer as string)?.toLowerCase().trim();
            break;
          case QuestionType.MultipleChoiceMultipleAnswer:
            {
              const userSelectedOptions: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const correctOptions = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as string[];
              const sortedUserSelected = [...userSelectedOptions].sort();
              const sortedCorrectOptions = [...correctOptions].sort();
              isCorrect = sortedUserSelected.length === sortedCorrectOptions.length &&
                          sortedUserSelected.every((val, index) => val === sortedCorrectOptions[index]);
            }
            break;
          case QuestionType.MultipleTrueFalse:
            {
              const userSelectedAnswers: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const correctAnswers = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as string[];
              const statements = prismaQuestionData.statements as TrueFalseStatement[] || [];
              if (userSelectedAnswers.length === correctAnswers.length && statements.length === correctAnswers.length) {
                  isCorrect = userSelectedAnswers.every((val, index) => val.toLowerCase() === correctAnswers[index]?.toLowerCase());
              } else { isCorrect = false; }
            }
            break;
          case QuestionType.MatrixChoice:
            {
              const userSelectedCategories: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const correctCategories = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as string[];
              const statements = prismaQuestionData.statements as TrueFalseStatement[] || [];
              if (userSelectedCategories.length === correctCategories.length && statements.length === correctCategories.length) {
                  isCorrect = userSelectedCategories.every((val, index) => val === correctCategories[index]);
              } else { isCorrect = false; }
            }
            break;
          case QuestionType.Hotspot:
            {
              const userSelectedHotspotIds: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const multipleSelection = prismaQuestionData.multipleSelection as boolean;
              if (multipleSelection) {
                  const correctAnswers = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as string[];
                  const sortedUserSelected = [...userSelectedHotspotIds].sort();
                  const sortedCorrect = [...correctAnswers].sort();
                  isCorrect = sortedUserSelected.length === sortedCorrect.length &&
                              sortedUserSelected.every((id, index) => id === sortedCorrect[index]);
              } else {
                  const correctAnswerString = (typeof originalCorrectAnswer === 'string' ? originalCorrectAnswer : null);
                  isCorrect = userSelectedHotspotIds.length === 1 && correctAnswerString !== null && userSelectedHotspotIds[0] === correctAnswerString;
              }
            }
            break;
          case QuestionType.MatchingSelect:
            {
              const userMatches: Array<{ promptId: string, choiceId: string | null }> = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const correctMatches = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as Array<{ promptId: string, choiceId: string }>;
              const prompts = prismaQuestionData.prompts as MatchingItem[] || [];
              if (userMatches.length === prompts.length && correctMatches.length === prompts.length ) {
                   isCorrect = correctMatches.every(correctMatch => {
                      const userMatch = userMatches.find(um => um.promptId === correctMatch.promptId);
                      return userMatch && userMatch.choiceId !== null && userMatch.choiceId === correctMatch.choiceId;
                  });
              } else if (userMatches.length === 0 && correctMatches.length === 0 && prompts.length === 0) {
                  isCorrect = true;
              } else { isCorrect = false; }
            }
            break;
          default:
            isCorrect = false;
        }
      } catch (e) {
        console.error("Error grading question during submission:", e, "Question ID:", originalQuestion.id, "User Answer:", rawUserAnswer);
        isCorrect = false;
      }

      if (isCorrect) {
        pointsEarned = originalQuestion.points;
      }

      return {
        questionId: originalQuestion.id,
        questionText: originalQuestion.text,
        questionType: originalQuestion.type as QuestionType,
        imageUrl: originalQuestion.imageUrl || undefined,
        options: prismaQuestionData.options as OptionType[] | undefined,
        statements: prismaQuestionData.statements as TrueFalseStatement[] | undefined,
        categories: prismaQuestionData.categories as Category[] | undefined,
        hotspots: prismaQuestionData.hotspots as HotspotArea[] | undefined,
        multipleSelection: prismaQuestionData.multipleSelection as boolean | undefined,
        prompts: prismaQuestionData.prompts as MatchingItem[] | undefined,
        choices: prismaQuestionData.choices as MatchingItem[] | undefined,
        userAnswer: rawUserAnswer,
        correctAnswer: originalCorrectAnswer,
        isCorrect,
        pointsEarned,
        pointsPossible: originalQuestion.points,
      };
    });

    const resolvedQuestionResults = await Promise.all(questionResultsPromises);
    score = resolvedQuestionResults.reduce((acc, qr) => acc + qr.pointsEarned, 0);

    const resultForClient: TestResult = {
      testId: testIdString,
      score,
      totalPoints,
      questionResults: resolvedQuestionResults,
      testTitle: testWithQuestions.title,
    };

    await prisma.userScore.create({
      data: {
        userId: userId,
        testId: testIdString,
        testTitle: testWithQuestions.title,
        score: score,
        totalPoints: totalPoints,
        questionResultsDetails: resultForClient.questionResults as Prisma.JsonArray,
        timeTakenSeconds: timeTaken,
        testMode: testMode ?? undefined,
      }
    });

    return resultForClient;

  } catch (e: any) {
    console.error("Prisma submitTest error:", e);
    return { error: `Failed to submit test. ${e.message}` };
  }
}

export async function generateAnswerOptionsAI(question: string, correctAnswer: string, numOptions: number = 4): Promise<{options: string[]} | {error: string}> {
  try {
    const result = await AIGenerateOptions({ question, correctAnswer, numOptions });
    return result;
  } catch (e: any) {
    console.error("AI option generation failed:", e);
    return { error: `Failed to generate options using AI. ${e.message}` };
  }
}

export async function getAllTests(): Promise<Test[]> {
  try {
    const testsFromDb = await prisma.test.findMany({
      include: { questions: true },
      orderBy: { createdAt: 'desc' },
    });

    return testsFromDb.map(test => ({
      ...test,
      questions: test.questions.map(mapPrismaQuestionToViewQuestion),
      createdAt: test.createdAt.toISOString(),
      updatedAt: test.updatedAt.toISOString(),
    }));
  } catch (e: any) {
    console.error("Prisma getAllTests error:", e);
    return [];
  }
}

export async function deleteTestById(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.test.delete({ where: { id: testId } });
    return { success: true };
  } catch (e: any) {
    console.error("Prisma deleteTestById error:", e);
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return { success: false, error: 'Test not found.' };
    }
    return { success: false, error: `Failed to delete test. ${e.message}` };
  }
}

    