'use server';

import { prisma } from '@/lib/prisma';
import type { UserAnswer, TestResult, Test, Question } from '@/lib/types';
import { QuestionType } from '@/lib/types';
import type { Prisma } from '@prisma/client';
import { mapPrismaQuestionToViewQuestion } from './mappers'; // Assuming mappers are in a sibling file


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

    const questionResultsPromises = testWithQuestions.questions.map(async (originalQuestionFromDb) => {
      const originalQuestion = mapPrismaQuestionToViewQuestion(originalQuestionFromDb);
      const prismaQuestionData = originalQuestionFromDb.questionData as Prisma.JsonObject;
      const originalCorrectAnswer = prismaQuestionData.correctAnswer as Question['correctAnswer'];


      const userAnswerObj = userAnswers.find(ua => ua.questionId === originalQuestion.id);
      const rawUserAnswer = userAnswerObj ? userAnswerObj.answer : '';
      let isCorrect = false;
      let pointsEarned = 0;

      totalPoints += originalQuestion.points;

      try {
        switch (originalQuestion.type) {
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
              const statements = originalQuestion.statements || [];
              if (userSelectedAnswers.length === correctAnswers.length && statements.length === correctAnswers.length) {
                  isCorrect = userSelectedAnswers.every((val, index) => val.toLowerCase() === correctAnswers[index]?.toLowerCase());
              } else { isCorrect = false; }
            }
            break;
          case QuestionType.MatrixChoice:
            {
              const userSelectedCategories: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const correctCategories = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as string[];
              const statements = originalQuestion.statements || [];
              if (userSelectedCategories.length === correctCategories.length && statements.length === correctCategories.length) {
                  isCorrect = userSelectedCategories.every((val, index) => val === correctCategories[index]);
              } else { isCorrect = false; }
            }
            break;
          case QuestionType.Hotspot:
            {
              const userSelectedHotspotIds: string[] = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
              const multipleSelection = originalQuestion.multipleSelection;
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
              const prompts = originalQuestion.prompts || [];
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
           case QuestionType.MatchingDragAndDrop:
             {
                const userMatches: Array<{ draggableItemId: string, targetItemId: string | null }> = rawUserAnswer ? JSON.parse(rawUserAnswer) : [];
                const correctMatches = (Array.isArray(originalCorrectAnswer) ? originalCorrectAnswer : []) as Array<{ draggableItemId: string, targetItemId: string }>;

                if (userMatches.length === correctMatches.length) {
                  const normalize = (arr: any[]) => arr.map(item => `${item.draggableItemId}-${item.targetItemId}`).sort().join(',');
                  isCorrect = normalize(userMatches.filter(m => m.targetItemId)) === normalize(correctMatches);
                } else {
                  isCorrect = false;
                }
             }
             break;
          default:
            console.warn(`Grading encountered an unexpected question type: ${originalQuestion.type} for question ID ${originalQuestion.id}`);
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
        questionType: originalQuestion.type,
        imageUrl: originalQuestion.imageUrl,
        options: originalQuestion.options,
        statements: originalQuestion.statements,
        categories: originalQuestion.categories,
        hotspots: originalQuestion.hotspots,
        multipleSelection: originalQuestion.multipleSelection,
        prompts: originalQuestion.prompts,
        choices: originalQuestion.choices,
        draggableItems: originalQuestion.draggableItems,
        targetItems: originalQuestion.targetItems,
        allowShuffle: originalQuestion.allowShuffle,
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
