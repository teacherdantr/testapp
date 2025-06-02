
'use server';

import { z } from 'zod';
import { addTest, getTestById, getTests as getAllTestsFromDb, deleteTest as deleteTestFromDb, updateTest as updateTestInDb, saveUserTestResult } from '@/lib/mockDb';
import type { Test, UserAnswer, Question, TestResult, TrueFalseStatement, Option, Category, StoredTestResult, HotspotArea, MatchingItem } from '@/lib/types';
import { QuestionType, HotspotShapeType } from '@/lib/types';
import { generateAnswerOptions as AIGenerateOptions } from '@/ai/flows/prevent-bias';

const optionSchema = z.object({
  id: z.string().optional(),
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
  coords: z.string().min(1, 'Coordinates cannot be empty'),
  label: z.string().optional(),
});

const matchingItemSchema = z.object({
  id: z.string().optional(), 
  text: z.string().min(1, "Item text cannot be empty"),
});

const correctMatchSchema = z.object({
  promptId: z.string(),
  choiceId: z.string().min(1, "Each prompt must be matched."), 
});


const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Question text cannot be empty'),
  type: z.nativeEnum(QuestionType),
  options: z.array(optionSchema).optional(),
  statements: z.array(trueFalseStatementSchema).optional(),
  categories: z.array(categorySchema).optional(),
  imageUrl: z.string().optional(),
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
}, {
  message: 'MCQ and MCMA questions must have at least two options.',
  path: ['options'],
}).refine(data => {
  if (data.type === QuestionType.MultipleChoiceMultipleAnswer) {
    return Array.isArray(data.correctAnswer) && data.correctAnswer.length > 0 && data.correctAnswer.every(item => typeof item === 'string');
  }
  if (data.type === QuestionType.Hotspot && data.multipleSelection) {
     return Array.isArray(data.correctAnswer) && data.correctAnswer.length > 0 && data.correctAnswer.every(item => typeof item === 'string');
  }
  if (data.type === QuestionType.MultipleTrueFalse || data.type === QuestionType.MatrixChoice) {
    return Array.isArray(data.correctAnswer) && 
           data.statements && 
           data.correctAnswer.length === data.statements.length && 
           data.correctAnswer.every(item => typeof item === 'string');
  }
  if (data.type === QuestionType.MultipleTrueFalse) {
     return (data.correctAnswer as string[]).every(ans => ans === 'true' || ans === 'false');
  }
  if (data.type === QuestionType.MatrixChoice) {
    return data.categories && data.categories.length > 0 && 
           (data.correctAnswer as string[]).every(ans => data.categories?.map(c => c.text).includes(ans));
  }
  if (data.type === QuestionType.Hotspot && !data.multipleSelection) {
    return typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '';
  }
  if ([QuestionType.MCQ, QuestionType.TrueFalse, QuestionType.ShortAnswer].includes(data.type)) {
    return typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '';
  }
  if (data.type === QuestionType.MatchingSelect) {
    return Array.isArray(data.correctAnswer) &&
           data.prompts && data.prompts.length > 0 &&
           data.choices && data.choices.length > 0 &&
           data.correctAnswer.length === data.prompts.length &&
           (data.correctAnswer as z.infer<typeof correctMatchSchema>[]).every(match => 
             match.choiceId.trim() !== '' && 
             data.prompts?.some(p => p.id === match.promptId) &&
             data.choices?.some(c => c.id === match.choiceId)
           );
  }
  return true;
}, {
  message: 'Correct answer format is invalid, missing, or incomplete for the question type. Ensure all matches are made for Matching questions, and correct options selected for MCMA/Hotspot-Multi.',
  path: ['correctAnswer'],
}).refine(data => {
    if (data.type === QuestionType.MultipleTrueFalse || data.type === QuestionType.MatrixChoice) {
        return data.statements && data.statements.length > 0 && data.statements.every(st => st.text.trim() !== '');
    }
    return true;
}, {
    message: 'Multiple True/False or MatrixChoice questions must have at least one statement with text.',
    path: ['statements'],
}).refine(data => {
  if (data.type === QuestionType.MatrixChoice) {
    return data.categories && data.categories.length >= 1 && data.categories.every(cat => cat.text.trim() !== '');
  }
  return true;
}, {
  message: 'MatrixChoice questions must have at least one category with text.',
  path: ['categories'],
}).refine(data => {
  if (data.type === QuestionType.Hotspot) {
    return data.imageUrl && data.imageUrl.trim() !== '' && (data.imageUrl.startsWith('https://') || data.imageUrl.startsWith('/images/'));
  }
  if (data.imageUrl && !(data.imageUrl.startsWith('https://') || data.imageUrl.startsWith('/images/'))) {
    return false;
  }
  return true;
}, {
  message: 'A valid HTTPS or local (/images/...) Image URL is required for Hotspot questions. For other types, it must be valid if provided.',
  path: ['imageUrl'],
}).refine(data => {
  if (data.type === QuestionType.Hotspot) {
    return data.hotspots && data.hotspots.length > 0 && data.hotspots.every(hs => hs.coords.trim() !== '');
  }
  return true;
}, {
  message: 'Hotspot questions must have at least one hotspot defined with coordinates.',
  path: ['hotspots'],
}).refine(data => {
  if (data.type === QuestionType.MatchingSelect) {
    return data.prompts && data.prompts.length >= 1 && data.prompts.every(p => p.text.trim() !== '') &&
           data.choices && data.choices.length >= 1 && data.choices.every(c => c.text.trim() !== '');
  }
  return true;
}, {
  message: 'Matching questions must have at least one prompt item and one choice item, all with text.',
  path: ['prompts'], 
});


const testSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().optional(),
  password: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'A test must have at least one question'),
});

export async function createTest(formData: FormData) {
  const rawData = {
    title: formData.get('title'),
    description: formData.get('description'),
    password: formData.get('password') || undefined,
    questions: JSON.parse(formData.get('questions') as string || '[]'),
  };

  const validatedFields = testSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten());
    return {
      error: "Validation failed",
      issues: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const newTest: Test = {
    id: crypto.randomUUID(),
    ...validatedFields.data,
    questions: validatedFields.data.questions.map(q => {
      let processedQuestion: any = { ...q };
      if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) {
        processedQuestion.options = undefined;
      }
      if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) {
        processedQuestion.statements = undefined;
      }
      if (q.type !== QuestionType.MatrixChoice) {
        processedQuestion.categories = undefined;
      }
      if (q.type !== QuestionType.Hotspot) {
        processedQuestion.hotspots = undefined;
      }
      if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer && q.type !== QuestionType.Hotspot && q.type !== QuestionType.MatchingSelect) {
         processedQuestion.imageUrl = undefined;
      }
      if (q.type !== QuestionType.MatchingSelect) {
        processedQuestion.prompts = undefined;
        processedQuestion.choices = undefined;
      } else if (q.type === QuestionType.MatchingSelect && Array.isArray(q.correctAnswer)) {
         processedQuestion.correctAnswer = q.correctAnswer.map(match => ({
           promptId: (match as any).promptId, 
           choiceId: (match as any).choiceId,
         }));
      }
      
      return {
        ...processedQuestion,
        id: crypto.randomUUID(),
        options: q.options?.map(opt => ({...opt, id: crypto.randomUUID()})),
        statements: q.statements?.map(st => ({...st, id: crypto.randomUUID()})),
        categories: q.categories?.map(cat => ({...cat, id: crypto.randomUUID()})),
        hotspots: q.hotspots?.map(hs => ({...hs, id: hs.id || crypto.randomUUID()})),
        prompts: q.prompts?.map(p => ({...p, id: p.id || crypto.randomUUID()})),
        choices: q.choices?.map(c => ({...c, id: c.id || crypto.randomUUID()})),
        multipleSelection: q.multipleSelection === undefined && q.type === QuestionType.Hotspot ? false : q.multipleSelection,
      };
    }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const savedTest = await addTest(newTest);
    return { testId: savedTest.id, message: 'Test created successfully!' };
  } catch (e) {
    return { error: 'Failed to create test.' };
  }
}

export async function updateTest(testId: string, formData: FormData): Promise<{ success?: boolean; error?: string; issues?: any; testId?: string; message?: string }> {
    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        password: formData.get('password') || undefined,
        questions: JSON.parse(formData.get('questions') as string || '[]'),
    };

    const validatedFields = testSchema.safeParse(rawData);

    if (!validatedFields.success) {
        console.error("Update Validation errors:", validatedFields.error.flatten());
        return {
            error: "Validation failed",
            issues: validatedFields.error.flatten().fieldErrors,
        };
    }

    const testToUpdate: Partial<Test> = {
        ...validatedFields.data,
        questions: validatedFields.data.questions.map((q: Question) => {
          let processedQuestion: any = { ...q };
          if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) {
            processedQuestion.options = undefined;
          }
          if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) {
            processedQuestion.statements = undefined;
          }
          if (q.type !== QuestionType.MatrixChoice) {
            processedQuestion.categories = undefined;
          }
          if (q.type !== QuestionType.Hotspot) {
            processedQuestion.hotspots = undefined;
          }
          if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer && q.type !== QuestionType.Hotspot && q.type !== QuestionType.MatchingSelect) {
            processedQuestion.imageUrl = undefined;
          }
          if (q.type !== QuestionType.MatchingSelect) {
            processedQuestion.prompts = undefined;
            processedQuestion.choices = undefined;
          } else {
            processedQuestion.prompts = q.prompts?.map(p => ({ id: p.id || crypto.randomUUID(), text: p.text }));
            processedQuestion.choices = q.choices?.map(c => ({ id: c.id || crypto.randomUUID(), text: c.text }));
            if (Array.isArray(q.correctAnswer)) {
                 processedQuestion.correctAnswer = q.correctAnswer.map(match => ({
                    promptId: (match as any).promptId,
                    choiceId: (match as any).choiceId,
                }));
            }
          }
          
          return {
            ...processedQuestion,
            id: q.id || crypto.randomUUID(),
            options: q.options?.map((opt: Option) => ({ ...opt, id: opt.id || crypto.randomUUID() })),
            statements: q.statements?.map((st: TrueFalseStatement) => ({ ...st, id: st.id || crypto.randomUUID() })),
            categories: q.categories?.map((cat: Category) => ({ ...cat, id: cat.id || crypto.randomUUID() })),
            hotspots: q.hotspots?.map((hs: HotspotArea) => ({ ...hs, id: hs.id || crypto.randomUUID() })),
            multipleSelection: q.multipleSelection === undefined && q.type === QuestionType.Hotspot ? false : q.multipleSelection,
          };
        }),
        updatedAt: new Date().toISOString(),
    };

    try {
        const updatedTest = await updateTestInDb(testId, testToUpdate);
        if (!updatedTest) {
            return { error: 'Failed to find test to update.' };
        }
        return { success: true, testId: updatedTest.id, message: 'Test updated successfully!' };
    } catch (e) {
        console.error("Error updating test:", e);
        return { error: 'Failed to update test.' };
    }
}


export async function fetchTestById(testId: string): Promise<Test | null> {
  const test = await getTestById(testId);
  if (!test) return null;

  const processedQuestions = test.questions.map(q => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correctAnswer, ...restOfQuestion } = q;
    return {
      ...restOfQuestion,
      choices: q.type === QuestionType.MatchingSelect && q.choices ? [...q.choices].sort(() => Math.random() - 0.5) : q.choices,
    } as unknown as Question; // Cast to Question, correctAnswers are stripped for student
  });


  return {
    ...test,
    questions: processedQuestions,
    password: test.password ? 'protected' : undefined,
  };
}

export async function fetchAdminTestById(testId: string): Promise<Test | null> {
  return await getTestById(testId); // Admin gets full data including correct answers
}


export async function verifyTestPassword(testId: string, passwordAttempt: string): Promise<{ authorized: boolean; error?: string }> {
  const test = await getTestById(testId);
  if (!test) {
    return { authorized: false, error: 'Test not found.' };
  }
  if (!test.password) {
    return { authorized: true }; // No password set
  }
  if (test.password === passwordAttempt) {
    return { authorized: true };
  }
  return { authorized: false, error: 'Incorrect password.' };
}

export async function submitTest(
  testIdString: string, 
  userId: string, 
  userAnswers: UserAnswer[], 
  timeTaken: number, 
  testMode: 'training' | 'testing' | 'race' | null
): Promise<TestResult | { error: string }> {
  const test = await getTestById(testIdString); 
  if (!test) {
    return { error: 'Test not found.' };
  }
  if (!userId) {
    return { error: 'User identifier is missing.' };
  }

  let score = 0;
  let totalPoints = 0;

  const questionResults = test.questions.map(originalQuestion => {
    const userAnswerObj = userAnswers.find(ua => ua.questionId === originalQuestion.id);
    const rawUserAnswer = userAnswerObj ? userAnswerObj.answer : '';
    let isCorrect = false;
    let pointsEarned = 0;

    totalPoints += originalQuestion.points;

    try {
        switch (originalQuestion.type) {
        case QuestionType.MCQ:
            isCorrect = rawUserAnswer === originalQuestion.correctAnswer;
            break;
        case QuestionType.TrueFalse:
            isCorrect = rawUserAnswer.toLowerCase() === (originalQuestion.correctAnswer as string).toLowerCase();
            break;
        case QuestionType.ShortAnswer:
            isCorrect = rawUserAnswer.toLowerCase().trim() === (originalQuestion.correctAnswer as string).toLowerCase().trim();
            break;
        case QuestionType.MultipleChoiceMultipleAnswer:
            {
            const userSelectedOptions: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
            const correctOptions = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
            const sortedUserSelected = [...userSelectedOptions].sort();
            const sortedCorrectOptions = [...correctOptions].sort();
            isCorrect = sortedUserSelected.length === sortedCorrectOptions.length &&
                        sortedUserSelected.every((val, index) => val === sortedCorrectOptions[index]);
            }
            break;
        case QuestionType.MultipleTrueFalse:
            {
            const userSelectedAnswers: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
            const correctAnswers = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
             if (userSelectedAnswers.length === correctAnswers.length && originalQuestion.statements?.length === correctAnswers.length) {
                isCorrect = userSelectedAnswers.every((val, index) => val.toLowerCase() === correctAnswers[index]?.toLowerCase());
            } else { isCorrect = false; }
            }
            break;
        case QuestionType.MatrixChoice:
            {
            const userSelectedCategories: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
            const correctCategories = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
            if (userSelectedCategories.length === correctCategories.length && originalQuestion.statements?.length === correctCategories.length) {
                isCorrect = userSelectedCategories.every((val, index) => val === correctCategories[index]);
            } else { isCorrect = false; }
            }
            break;
        case QuestionType.Hotspot:
            {
            const userSelectedHotspotIds: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
            if (originalQuestion.multipleSelection) {
                const correctAnswers = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as string[];
                const sortedUserSelected = [...userSelectedHotspotIds].sort();
                const sortedCorrect = [...correctAnswers].sort();
                isCorrect = sortedUserSelected.length === sortedCorrect.length &&
                            sortedUserSelected.every((id, index) => id === sortedCorrect[index]);
            } else {
                const correctAnswer = (typeof originalQuestion.correctAnswer === 'string' ? originalQuestion.correctAnswer : null);
                isCorrect = userSelectedHotspotIds.length === 1 && correctAnswer !== null && userSelectedHotspotIds[0] === correctAnswer;
            }
            }
            break;
        case QuestionType.MatchingSelect:
            {
            const userMatches: Array<{ promptId: string, choiceId: string | null }> = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
            const correctMatches = (Array.isArray(originalQuestion.correctAnswer) ? originalQuestion.correctAnswer : []) as Array<{ promptId: string, choiceId: string }>;
            
            if (userMatches.length === (originalQuestion.prompts?.length || 0) && correctMatches.length === (originalQuestion.prompts?.length || 0) ) {
                 isCorrect = correctMatches.every(correctMatch => {
                    const userMatch = userMatches.find(um => um.promptId === correctMatch.promptId);
                    return userMatch && userMatch.choiceId !== null && userMatch.choiceId === correctMatch.choiceId;
                });
            } else if (userMatches.length === 0 && correctMatches.length === 0 && (originalQuestion.prompts?.length || 0) === 0) {
                isCorrect = true; 
            }
             else { isCorrect = false; }
            }
            break;
        default:
            isCorrect = false;
        }
    } catch (e) {
        console.error("Error grading question during submission:", e, "Question:", originalQuestion, "User Answer:", rawUserAnswer);
        isCorrect = false;
    }


    if (isCorrect) {
      score += originalQuestion.points;
      pointsEarned = originalQuestion.points;
    }

    return {
      questionId: originalQuestion.id,
      questionText: originalQuestion.text,
      questionType: originalQuestion.type,
      options: originalQuestion.options,
      statements: originalQuestion.statements,
      categories: originalQuestion.categories,
      imageUrl: originalQuestion.imageUrl,
      hotspots: originalQuestion.hotspots,
      multipleSelection: originalQuestion.multipleSelection,
      prompts: originalQuestion.prompts,
      choices: originalQuestion.choices,
      userAnswer: rawUserAnswer,
      correctAnswer: originalQuestion.correctAnswer, // Full correct answer for results display
      isCorrect,
      pointsEarned,
      pointsPossible: originalQuestion.points,
    };
  });

  const result: TestResult = {
    testId: testIdString, 
    score,
    totalPoints,
    questionResults,
    testTitle: test.title,
  };

  const storedResult: StoredTestResult = {
    ...result,
    userId: userId,
    submittedAt: new Date().toISOString(),
    timeTaken: timeTaken,
    testMode: testMode ?? undefined, 
  };
  await saveUserTestResult(storedResult);

  return result;
}

export async function generateAnswerOptionsAI(question: string, correctAnswer: string, numOptions: number = 4): Promise<{options: string[]} | {error: string}> {
  try {
    const result = await AIGenerateOptions({ question, correctAnswer, numOptions });
    return result;
  } catch (e) {
    console.error("AI option generation failed:", e);
    return { error: "Failed to generate options using AI." };
  }
}

export async function getAllTests(): Promise<Test[]> {
    return await getAllTestsFromDb();
}

export async function deleteTestById(testId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const deleted = await deleteTestFromDb(testId);
    if (deleted) {
      return { success: true };
    } else {
      return { success: false, error: 'Test not found or already deleted.' };
    }
  } catch (error) {
    console.error("Error deleting test:", error);
    return { success: false, error: 'Failed to delete test due to a server error.' };
  }
}
