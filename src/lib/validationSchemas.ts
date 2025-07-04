
import { z } from 'zod';
import { QuestionType, HotspotShapeType } from '@/lib/types';

export const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text cannot be empty')
});

export const trueFalseStatementSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Statement text cannot be empty'),
});

export const categorySchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Category text cannot be empty'),
});

export const hotspotAreaSchema = z.object({
  id: z.string().optional(),
  shape: z.nativeEnum(HotspotShapeType),
  coords: z.string().min(1, 'Coordinates cannot be empty')
    .regex(/^((\d+(\.\d+)?),){1,}(\d+(\.\d+)?)$/, 'Coordinates must be comma-separated numbers (e.g., 0.1,0.1,0.2,0.1 for rect; 0.5,0.5,0.05 for circle; 0.1,0.1,0.2,0.1,0.15,0.2 for poly)'),
  label: z.string().optional(),
});

export const matchingItemSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, "Item text cannot be empty"),
});

export const correctMatchSchema = z.object({
  promptId: z.string(),
  choiceId: z.string().min(1, "Each prompt must be matched to a choice."),
});

export const correctDragDropMatchSchema = z.object({
    draggableItemId: z.string(),
    targetItemId: z.string(),
});

export const formQuestionSchema = z.object({
  id: z.string().optional(),
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
  draggableItems: z.array(matchingItemSchema).optional(),
  targetItems: z.array(matchingItemSchema).optional(),
  allowShuffle: z.boolean().optional(),
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()),
    z.array(correctMatchSchema),
    z.array(correctDragDropMatchSchema),
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
    if (data.type === QuestionType.Hotspot && data.hotspots) {
        return (data.correctAnswer as string[]).every(caId => data.hotspots!.some(h => h.id === caId));
    }
    if (data.type === QuestionType.MultipleChoiceMultipleAnswer && data.options) {
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
    if (data.hotspots) {
        return data.hotspots.some(h => h.id === data.correctAnswer);
    }
  }
  if (data.type === QuestionType.MatchingSelect) {
    return Array.isArray(data.correctAnswer) && data.prompts && data.prompts.length > 0 && data.choices && data.choices.length > 0 && data.correctAnswer.length === data.prompts.length &&
           (data.correctAnswer as z.infer<typeof correctMatchSchema>[]).every(match =>
             data.prompts?.some(p => p.id === match.promptId) &&
             data.choices?.some(c => c.id === match.choiceId) &&
             match.choiceId.trim() !== ''
           );
  }
   if (data.type === QuestionType.MatchingDragAndDrop) {
    if (!data.draggableItems || !data.targetItems || data.draggableItems.length !== data.targetItems.length) {
        return false;
    }
    if (!Array.isArray(data.correctAnswer) || data.correctAnswer.length !== data.draggableItems.length) {
        return false;
    }
     return (data.correctAnswer as Array<{ draggableItemId: string, targetItemId: string }>).every(match =>
      data.draggableItems!.some(item => item.id === match.draggableItemId) &&
      data.targetItems!.some(target => target.id === match.targetItemId)
    );
  }
  if ([QuestionType.MCQ, QuestionType.TrueFalse, QuestionType.ShortAnswer].includes(data.type)) {
    if (!(typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '')) return false;
    if (data.type === QuestionType.MCQ && data.options) {
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
  } else if (data.type === QuestionType.MatchingDragAndDrop) {
    return data.draggableItems && data.draggableItems.length >= 1 && data.draggableItems.every(item => item.text.trim() !== '') &&
           data.targetItems && data.targetItems.length >= 1 && data.targetItems.every(item => item.text.trim() !== '');
  }
  return true;
}, {
  message: 'Matching questions must have at least one prompt/target item and one choice/draggable item, all with text.',
  path: ['prompts'],
});

export const testFormSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty'),
  description: z.string().optional(),
  password: z.string().optional(),
  questions: z.array(formQuestionSchema).min(1, 'A test must have at least one question'),
});
