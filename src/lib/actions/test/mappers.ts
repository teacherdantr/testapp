import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import type { Option as OptionType, TrueFalseStatement, Category, HotspotArea, MatchingItem, Question } from '@/lib/types';
import { QuestionType, HotspotShapeType } from '@/lib/types';
import type { formQuestionSchema } from '@/lib/validationSchemas';


export function mapFormQuestionToPrismaQuestionData(q: z.infer<typeof formQuestionSchema>): Prisma.JsonObject {
  const questionData: any = {
    correctAnswer: q.correctAnswer,
  };

  if (q.options) questionData.options = q.options;
  if (q.statements) questionData.statements = q.statements;
  if (q.categories) questionData.categories = q.categories;
  if (q.hotspots) questionData.hotspots = q.hotspots;
  if (q.multipleSelection !== undefined) questionData.multipleSelection = q.multipleSelection;

  // Fields specific to MatchingSelect
  if (q.type === QuestionType.MatchingSelect) {
    if (q.prompts) questionData.prompts = q.prompts;
    if (q.choices) questionData.choices = q.choices;
  }
  // Fields specific to MatchingDragAndDrop
  if (q.type === QuestionType.MatchingDragAndDrop) {
    if (q.draggableItems) questionData.draggableItems = q.draggableItems;
    if (q.targetItems) questionData.targetItems = q.targetItems;
    if (q.allowShuffle !== undefined) questionData.allowShuffle = q.allowShuffle;
  }


  return questionData as Prisma.JsonObject;
}


// Helper to ensure array items are valid objects with id and text
export const ensureValidItems = <T extends { id: string; text: string }>(
  items: any,
  itemTypeForLogging: string
): T[] | undefined => {
  if (!Array.isArray(items)) {
    return undefined;
  }
  const validItems = items.filter(item =>
    item &&
    typeof item.id === 'string' && item.id.trim() !== '' &&
    typeof item.text === 'string'
  );

  if (validItems.length !== items.length) {
    console.warn(`[mapPrismaQuestionToViewQuestion] Filtered out invalid items from ${itemTypeForLogging} array. Original count: ${items.length}, Valid count: ${validItems.length}. Review source data for question.`);
  }
  return validItems.map(item => ({
    id: item.id as string,
    text: item.text as string,
  })) as T[];
};


export const ensureValidHotspotItems = (items: any): HotspotArea[] | undefined => {
    if (!Array.isArray(items)) return undefined;
    const validItems = items.filter(item =>
        item &&
        typeof item.id === 'string' && item.id.trim() !== '' &&
        Object.values(HotspotShapeType).includes(item.shape as HotspotShapeType) &&
        typeof item.coords === 'string' && item.coords.trim() !== '' &&
        (item.label === undefined || typeof item.label === 'string')
    );
    if (validItems.length !== items.length) {
        console.warn(`[mapPrismaQuestionToViewQuestion] Filtered out invalid items from Hotspot array for a question. Original count: ${items.length}, Valid count: ${validItems.length}`);
    }
    return validItems.map(item => ({
        id: item.id,
        shape: item.shape as HotspotShapeType,
        coords: item.coords,
        label: item.label,
    }));
};

export function mapPrismaQuestionToViewQuestion(prismaQuestion: Prisma.QuestionGetPayload<{}>): Question {
  const qData = prismaQuestion.questionData as Prisma.JsonObject || {};
  let typeValue = prismaQuestion.type;

  if (!Object.values(QuestionType).includes(typeValue as QuestionType)) {
    console.error(`[mapPrismaQuestionToViewQuestion] Invalid question type from DB: '${typeValue}' for Q_ID ${prismaQuestion.id}. Defaulting to MCQ.`);
    typeValue = QuestionType.MCQ;
  }

  let correctAnswerForView: Question['correctAnswer'];
  if (typeValue === QuestionType.MatchingDragAndDrop) {
      correctAnswerForView = Array.isArray(qData.correctAnswer) ? qData.correctAnswer as Array<{ draggableItemId: string, targetItemId: string }> : [];
  } else {
      correctAnswerForView = qData.correctAnswer as any;
  }


  return {
    id: prismaQuestion.id,
    text: prismaQuestion.text,
    type: typeValue as QuestionType,
    imageUrl: prismaQuestion.imageUrl || undefined,
    points: prismaQuestion.points,
    options: ensureValidItems<OptionType>(qData.options, 'Option'),
    statements: ensureValidItems<TrueFalseStatement>(qData.statements, 'Statement'),
    categories: ensureValidItems<Category>(qData.categories, 'Category'),
    hotspots: ensureValidHotspotItems(qData.hotspots),
    multipleSelection: qData.multipleSelection !== undefined ? qData.multipleSelection as boolean : undefined,
    prompts: ensureValidItems<MatchingItem>(qData.prompts, 'Prompt'),
    choices: ensureValidItems<MatchingItem>(qData.choices, 'Choice'),
    draggableItems: ensureValidItems<MatchingItem>(qData.draggableItems, 'DraggableItem'),
    targetItems: ensureValidItems<MatchingItem>(qData.targetItems, 'TargetItem'),
    allowShuffle: qData.allowShuffle !== undefined ? qData.allowShuffle as boolean : undefined,
    correctAnswer: correctAnswerForView,
  };
}
