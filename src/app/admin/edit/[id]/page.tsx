
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link'; // Added Link import
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuestionBuilder } from '@/components/admin/QuestionBuilder';
import { fetchAdminTestById } from '@/lib/actions/test/getTests';
import { updateTest } from '@/lib/actions/test/updateTest';
import { QuestionType, type Test, type Category, type HotspotArea, HotspotShapeType, type MatchingItem } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle, Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { Switch } from "@/components/ui/switch";

const optionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1, 'Option text cannot be empty'),
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

const correctMatchSchema = z.object({ // For MatchingSelect
  promptId: z.string(),
  choiceId: z.string(),
});

const correctDragDropMatchSchema = z.object({ // For MatchingDragAndDrop
    draggableItemId: z.string(),
    targetItemId: z.string(),
});


const questionSchema = z.object({
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
  prompts: z.array(matchingItemSchema).optional(), // For MatchingSelect
  choices: z.array(matchingItemSchema).optional(), // For MatchingSelect
  draggableItems: z.array(matchingItemSchema).optional(), // For MatchingDragAndDrop
  targetItems: z.array(matchingItemSchema).optional(), // For MatchingDragAndDrop
  allowShuffle: z.boolean().optional(), // For MatchingDragAndDrop
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()).min(1, 'At least one correct answer must be selected/provided for this type if it is an array of strings.'),
    z.array(correctMatchSchema).min(1, 'At least one match must be defined for MatchingSelect if it is an array of matches.'),
    z.array(correctDragDropMatchSchema), // Added for MatchingDragAndDrop
  ]),
  points: z.number().min(1, 'Points must be at least 1'),
}).refine(data => { // Validation for MCQ and MCMA options
  if (data.type === QuestionType.MCQ || data.type === QuestionType.MultipleChoiceMultipleAnswer) {
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: 'MCQ and MCMA questions must have at least two options.',
  path: ['options'],
}).refine(data => { // Validation for various correctAnswer formats
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
    if (!(Array.isArray(data.correctAnswer) && data.statements && data.correctAnswer.length === data.statements.length && typeof data.correctAnswer[0] === 'string')) return false;
  }
   if (data.type === QuestionType.MultipleTrueFalse) {
    return (data.correctAnswer as string[]).every(ans => ans === 'true' || ans === 'false');
  }
  if (data.type === QuestionType.MatrixChoice) {
    if (!(data.categories && data.categories.length > 0 && (data.correctAnswer as string[]).every(ans => data.categories?.map(c => c.text).includes(ans)))) return false;
  }
  if (data.type === QuestionType.Hotspot && !data.multipleSelection) {
    if(!(typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '')) return false;
    if (data.hotspots) {
        return data.hotspots.some(h => h.id === data.correctAnswer);
    }
  }
  if (data.type === QuestionType.MatchingSelect) {
    if (!data.prompts || data.prompts.length === 0 || !data.choices || data.choices.length === 0) {
      return false;
    }
    if (!Array.isArray(data.correctAnswer) || data.correctAnswer.length !== data.prompts.length) {
      return false;
    }
    return (data.correctAnswer as z.infer<typeof correctMatchSchema>[]).every(match => {
      const promptExists = data.prompts!.some(p => p.id === match.promptId);
      const choiceIsValidIfSelected = match.choiceId === '' || data.choices!.some(c => c.id === match.choiceId);
      const allPromptsMatchedToNonEmptyChoice = (data.correctAnswer as z.infer<typeof correctMatchSchema>[]).every(m => m.choiceId !== '');
      return promptExists && choiceIsValidIfSelected && allPromptsMatchedToNonEmptyChoice;
    });
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
}, {
  message: 'Correct answer(s) must be provided, in the correct format, and reference existing items (options/hotspots/prompts/choices) for the question type. For MatchingSelect, ensure all prompts are matched to a valid, non-empty choice.',
  path: ['correctAnswer'],
}).refine(data => { // Validation for MTF/Matrix statements
    if (data.type === QuestionType.MultipleTrueFalse || data.type === QuestionType.MatrixChoice) {
        return data.statements && data.statements.length > 0 && data.statements.every(st => st.text.trim() !== '');
    }
    return true;
}, {
    message: 'Multiple True/False or MatrixChoice questions must have at least one statement with text.',
    path: ['statements'],
}).refine(data => { // Validation for Matrix categories
  if (data.type === QuestionType.MatrixChoice) {
    return data.categories && data.categories.length >= 1 && data.categories.every(cat => cat.text.trim() !== '');
  }
  return true;
}, {
  message: 'MatrixChoice questions must have at least one category with text.',
  path: ['categories'],
}).refine(data => { // Validation for Hotspot image URL
  if (data.type === QuestionType.Hotspot) {
    return !!(data.imageUrl && data.imageUrl.trim() !== '' && (data.imageUrl.startsWith('https://') || data.imageUrl.startsWith('/images/')));
  }
  return true;
}, { message: 'A valid HTTPS or local (/images/...) Image URL is required for Hotspot questions.', path: ['imageUrl']})
.refine(data => { // Validation for Hotspot areas
  if (data.type === QuestionType.Hotspot) {
    return data.hotspots && data.hotspots.length > 0 && data.hotspots.every(hs => hs.coords.trim() !== '');
  }
  return true;
}, {
  message: 'Hotspot questions must have at least one hotspot defined with coordinates.',
  path: ['hotspots'],
}).refine(data => { // Validation for MatchingSelect prompts/choices
  if (data.type === QuestionType.MatchingSelect) {
    return data.prompts && data.prompts.length >= 1 && data.prompts.every(p => p.text.trim() !== '') &&
           data.choices && data.choices.length >= 1 && data.choices.every(c => c.text.trim() !== '');
  }
  return true;
}, {
  message: 'Matching questions must have at least one prompt item and one choice item, all with text.',
  path: ['prompts'],
}).refine(data => { // Validation for MatchingDragAndDrop
  if (data.type === QuestionType.MatchingDragAndDrop) {
    // Items must exist and have text
    if (!data.draggableItems || data.draggableItems.length === 0 || !data.draggableItems.every(item => item.text.trim() !== '') ||
        !data.targetItems || data.targetItems.length === 0 || !data.targetItems.every(item => item.text.trim() !== '')) {
      return false;
    }
     if (data.draggableItems.length !== data.targetItems.length) {
        return false;
    }
    return true;
  }
  return true;
}, {
  message: 'For Matching Drag & Drop: Draggable and Target items must exist, have text, and there must be an equal number of each.',
  path: ['draggableItems'],
});


const testEditSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().optional(),
  passwordEnabled: z.boolean().optional(),
  password: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'A test must have at least one question'),
}).refine(data => {
    if (data.passwordEnabled && (!data.password || data.password.length < 4)) {
        return false;
    }
    return true;
}, {
    message: "Password must be at least 4 characters long if enabled.",
    path: ["password"],
});

export type TestEditFormValues = z.infer<typeof testEditSchema>;

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { toast } = useToast();
  const [isLoadingTest, setIsLoadingTest] = useState(true);
  const [testNotFound, setTestNotFound] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, register, handleSubmit, formState: { errors, isSubmitting, isDirty, isValid }, watch, setValue, getValues, reset } = useForm<TestEditFormValues>({
    resolver: zodResolver(testEditSchema),
    defaultValues: {
      title: '',
      description: '',
      passwordEnabled: false,
      password: '',
      questions: [],
    },
    mode: 'onChange', // Important for live validation updates
  });

  useEffect(() => {
    if (!testId) {
      setTestNotFound(true);
      setIsLoadingTest(false);
      return;
    }
    const loadTest = async () => {
      try {
        const testData = await fetchAdminTestById(testId as string);
        if (testData) {
          const mappedQuestions = testData.questions.map(q => {
              try {
                let correctAnswerValue: any;
                const ensureIds = <T extends { id?: string, text?: string }>(items: T[] = [], itemName: string = "item"): T[] =>
                    items.map(item => ({ ...item, id: item.id || crypto.randomUUID() }));

                let processedQuestionData: Partial<TestEditFormValues['questions'][0]> = {};

                switch (q.type) {
                  case QuestionType.MCQ:
                  case QuestionType.TrueFalse:
                  case QuestionType.ShortAnswer:
                    correctAnswerValue = q.correctAnswer || '';
                    break;
                  case QuestionType.MultipleChoiceMultipleAnswer:
                    correctAnswerValue = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                    break;
                  case QuestionType.MultipleTrueFalse:
                  case QuestionType.MatrixChoice:
                    const defaultStatements = ensureIds(q.statements, 'statement');
                    correctAnswerValue = (Array.isArray(q.correctAnswer) && q.correctAnswer.length === defaultStatements.length)
                      ? q.correctAnswer
                      : defaultStatements.map(() => (q.type === QuestionType.MultipleTrueFalse ? 'false' : (ensureIds(q.categories, 'category')[0]?.text || '')));
                    processedQuestionData = { statements: defaultStatements, categories: ensureIds(q.categories, 'category') };
                    break;
                  case QuestionType.Hotspot:
                    if (q.multipleSelection) {
                      correctAnswerValue = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                    } else {
                      correctAnswerValue = typeof q.correctAnswer === 'string' ? q.correctAnswer : '';
                    }
                    break;
                  case QuestionType.MatchingSelect:
                    const defaultPrompts = ensureIds(q.prompts, 'prompt');
                    const existingCorrectAnswers = (Array.isArray(q.correctAnswer) ? q.correctAnswer : []) as Array<{promptId: string, choiceId: string}>;
                    correctAnswerValue = defaultPrompts.map(prompt => {
                      const existingMatch = existingCorrectAnswers.find(match => match.promptId === prompt.id);
                      return {
                        promptId: prompt.id,
                        choiceId: existingMatch ? (existingMatch.choiceId === null || existingMatch.choiceId === undefined ? '' : String(existingMatch.choiceId)) : '',
                      };
                    });
                    processedQuestionData = { prompts: defaultPrompts, choices: ensureIds(q.choices, 'choice') };
                    break;
                  case QuestionType.MatchingDragAndDrop:
                     const defaultDraggableItems = ensureIds(q.draggableItems, 'draggableItem');
                     const defaultTargetItems = ensureIds(q.targetItems, 'targetItem');
                     const existingDragDropCorrectAnswers = (Array.isArray(q.correctAnswer) ? q.correctAnswer : []) as Array<{draggableItemId: string, targetItemId: string}>;
                     
                     // Ensure correct answer array length matches item arrays' length
                     correctAnswerValue = defaultTargetItems.map((target, index) => {
                         const draggable = defaultDraggableItems[index];
                         const existingMatch = existingDragDropCorrectAnswers.find(m => m.targetItemId === target.id);
                         return {
                             draggableItemId: existingMatch ? existingMatch.draggableItemId : (draggable ? draggable.id : ''),
                             targetItemId: target.id,
                         };
                     });

                     processedQuestionData = {
                         draggableItems: defaultDraggableItems,
                         targetItems: defaultTargetItems,
                         allowShuffle: q.allowShuffle === undefined ? true : q.allowShuffle,
                     };
                     break;
                  default:
                    correctAnswerValue = Array.isArray(q.correctAnswer) ? q.correctAnswer : (q.correctAnswer || '');
                }
                
                return {
                  id: q.id,
                  text: q.text || '',
                  type: q.type,
                  imageUrl: q.imageUrl || '',
                  options: ensureIds(q.options, 'option'),
                  statements: ensureIds(q.statements, 'statement'),
                  categories: ensureIds(q.categories, 'category'),
                  hotspots: (q.hotspots || []).map(hs => ({ ...hs, id: hs.id || crypto.randomUUID(), shape: hs.shape || HotspotShapeType.Rectangle, coords: hs.coords || '', label: hs.label || '' })),
                  multipleSelection: q.multipleSelection === undefined ? false : q.multipleSelection,
                  prompts: ensureIds(q.prompts, 'prompt'),
                  choices: ensureIds(q.choices, 'choice'),
                  draggableItems: ensureIds(q.draggableItems, 'draggableItem'),
                  targetItems: ensureIds(q.targetItems, 'targetItem'),
                  allowShuffle: q.allowShuffle === undefined ? true : q.allowShuffle,
                  correctAnswer: correctAnswerValue,
                  points: q.points || 10,
                  ...processedQuestionData
                };
              } catch (mapError: any) {
                console.error(`Error mapping question ID ${q.id || 'new'} ("${(q.text || '').substring(0,30)}...") for form:`, mapError.message, q);
                toast({ title: "Data Loading Error", description: `Could not fully load question "${(q.text || 'Unnamed Question').substring(0,20)}...". It may have invalid data or structure. Please review and save to fix.`, variant: "destructive", duration: 7000 });
                return {
                    id: q.id || crypto.randomUUID(),
                    text: `Error: Could not load question text for ID ${q.id}. Original text: ${(q.text || '').substring(0,50)}...`,
                    type: q.type || QuestionType.MCQ,
                    imageUrl: q.imageUrl || '',
                    options: [{id: crypto.randomUUID(), text: 'Error Option 1'}, {id: crypto.randomUUID(), text: 'Error Option 2'}],
                    statements: [], categories: [], hotspots: [], multipleSelection: false, prompts: [], choices: [],
                    draggableItems: [], targetItems: [], allowShuffle: false,
                    correctAnswer: '', // Fallback, might be invalid depending on type
                    points: 10,
                };
              }
            });

          reset({
            title: testData.title,
            description: testData.description || '',
            passwordEnabled: !!testData.password,
            password: testData.password || '',
            questions: mappedQuestions,
          });
        } else {
          setTestNotFound(true);
        }
      } catch (error) {
        console.error("Failed to load test data:", error);
        toast({ title: "Error", description: "Failed to load test data.", variant: "destructive" });
        setTestNotFound(true);
      } finally {
        setIsLoadingTest(false);
      }
    };
    loadTest();
  }, [testId, reset, toast]);

  const passwordEnabled = watch('passwordEnabled');

  const generateRandomPassword = () => {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setValue('password', retVal, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: TestEditFormValues) => {
    if (!testId) return;

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    if (data.passwordEnabled && data.password) {
        formData.append('password', data.password);
    } else {
        formData.append('password', ''); // Send empty string to clear password
    }

    const processedQuestions = data.questions.map(q => {
      const ensureClientIds = <T extends { id?: string }>(items: T[] = []): T[] =>
        items.map(item => ({ ...item, id: item.id || crypto.randomUUID() }));

      const questionToProcess: any = {
        ...q,
        id: q.id, // Existing question ID if present
        options: ensureClientIds(q.options),
        statements: ensureClientIds(q.statements),
        categories: ensureClientIds(q.categories),
        hotspots: (q.hotspots || []).map(hs => ({ ...hs, id: hs.id || crypto.randomUUID()})),
        prompts: ensureClientIds(q.prompts),
        choices: ensureClientIds(q.choices),
        draggableItems: ensureClientIds(q.draggableItems),
        targetItems: ensureClientIds(q.targetItems),
      };

      // Clean up correctAnswer based on type for storage
      if (q.type === QuestionType.MatchingSelect && Array.isArray(q.correctAnswer)) {
        questionToProcess.correctAnswer = q.correctAnswer
          .map((match: any) => ({
            promptId: match.promptId,
            choiceId: typeof match.choiceId === 'string' ? match.choiceId : '',
          }))
          .filter((match: any) => match.choiceId !== ''); // Filter out "unselected"
      } else if (q.type === QuestionType.MatchingDragAndDrop && Array.isArray(q.correctAnswer)) {
        questionToProcess.correctAnswer = q.correctAnswer
          .map((match: any) => ({
            draggableItemId: match.draggableItemId,
            targetItemId: typeof match.targetItemId === 'string' ? match.targetItemId : '',
          }))
      }


      // Remove fields not relevant to the question type
      if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) delete questionToProcess.options;
      if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) delete questionToProcess.statements;
      if (q.type !== QuestionType.MatrixChoice) delete questionToProcess.categories;
      if (q.type !== QuestionType.Hotspot) {
        delete questionToProcess.hotspots;
        if (questionToProcess.multipleSelection === undefined) delete questionToProcess.multipleSelection;
      }
      if (![QuestionType.MCQ, QuestionType.MultipleChoiceMultipleAnswer, QuestionType.Hotspot, QuestionType.MatchingSelect, QuestionType.MultipleTrueFalse].includes(q.type)) delete questionToProcess.imageUrl;
      if (q.type !== QuestionType.MatchingSelect) { delete questionToProcess.prompts; delete questionToProcess.choices; }
      if (q.type !== QuestionType.MatchingDragAndDrop) { delete questionToProcess.draggableItems; delete questionToProcess.targetItems; delete questionToProcess.allowShuffle;}


      return questionToProcess;
    });

    formData.append('questions', JSON.stringify(processedQuestions));

    const result = await updateTest(testId as string, formData);

    if (result.error) {
      toast({
        title: 'Error Updating Test',
        description: result.error + (result.issues ? ` Issues: ${JSON.stringify(result.issues)}` : ''),
        variant: 'destructive',
        duration: 7000,
      });
    } else if (result.testId) {
      toast({
        title: 'Test Updated Successfully!',
        description: `Test "${data.title}" has been updated.`,
      });
      reset(data); // Reset form with current data to clear dirty state and reflect successful save
    }
  };

  if (isLoadingTest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Test for Editing...</p>
      </div>
    );
  }

  if (testNotFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="mt-4 text-xl text-destructive">Test Not Found</p>
        <p className="text-muted-foreground">The test you are trying to edit does not exist.</p>
        <Button onClick={() => router.push('/admin')} className="mt-6">Back to Admin Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-start">
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Link>
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b sticky top-0 bg-card/95 backdrop-blur-sm z-10">
            <div>
              <CardTitle className="text-3xl font-bold text-primary">Edit Test</CardTitle>
              <CardDescription>Modify the details of your test below.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => router.push('/admin')}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!isDirty || !isValid || isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg">Test Title</Label>
              <Input id="title" {...register('title')} placeholder="e.g., European Capitals Quiz" className="text-base" />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-lg">Description (Optional)</Label>
              <Textarea id="description" {...register('description')} placeholder="A brief summary of what this test covers." />
            </div>

            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    <Controller
                        name="passwordEnabled"
                        control={control}
                        render={({ field }) => (
                            <Switch
                                id="passwordEnabled"
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (!checked) {
                                        setValue('password', '');
                                    }
                                }}
                            />
                        )}
                    />
                    <Label htmlFor="passwordEnabled" className="text-lg">Enable Password Protection</Label>
                </div>
                {passwordEnabled && (
                    <div className="pl-8 space-y-2 mt-2">
                        <Label htmlFor="password">Set Password</Label>
                        <div className="relative flex items-center">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder="Enter a secure password"
                                className="pr-10"
                            />
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 h-7 w-7 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                         <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateRandomPassword}
                            className="mt-2"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Generate Password
                        </Button>
                    </div>
                )}
            </div>

            <div>
              <Label className="text-lg mb-2 block">Questions</Label>
              <QuestionBuilder control={control} register={register} errors={errors} getValues={getValues} setValue={setValue} watch={watch} />
              {errors.questions && typeof errors.questions.message === 'string' && (
                <p className="text-sm text-destructive mt-2">{errors.questions.message}</p>
              )}
               {errors.questions?.root && <p className="text-sm text-destructive mt-2">{errors.questions.root.message}</p>}
                {Array.isArray(errors.questions) && errors.questions.map((qError, i) => {
                    let errorMessages = [];
                    if (qError?.text) errorMessages.push(`Q${i+1} Text: ${qError.text.message}`);

                    if (qError?.options?.message) {
                        errorMessages.push(`Q${i+1} Options: ${qError.options.message}`);
                    } else if (Array.isArray(qError?.options)) {
                        qError.options.forEach((optErr: any, optIdx: number) => {
                            if(optErr?.text?.message) errorMessages.push(`Q${i+1} Opt${optIdx+1} Text: ${optErr.text.message}`);
                        });
                    }
                    
                    if (qError?.draggableItems?.message) {
                       errorMessages.push(`Q${i+1} Draggable Items: ${qError.draggableItems.message}`);
                    }
                    if (qError?.targetItems?.message) {
                       errorMessages.push(`Q${i+1} Target Items: ${qError.targetItems.message}`);
                    }


                    if (qError?.statements) {
                        if (qError.statements.message) {
                            errorMessages.push(`Q${i+1} Statements: ${qError.statements.message}`);
                        } else if (Array.isArray(qError.statements) && qError.statements.some((s:any) => s && Object.keys(s).length > 0 && s.text?.message)) {
                            errorMessages.push(`Q${i+1} Statements: Contains invalid items. Check details within the question.`);
                        }
                    }
                    if (qError?.categories) {
                        if (qError.categories.message) {
                            errorMessages.push(`Q${i+1} Categories: ${qError.categories.message}`);
                        } else if (Array.isArray(qError.categories) && qError.categories.some((c:any) => c && Object.keys(c).length > 0 && c.text?.message)) {
                            errorMessages.push(`Q${i+1} Categories: Contains invalid items. Check details within the question.`);
                        }
                    }
                    if (qError?.hotspots) {
                        if (qError.hotspots.message) {
                             errorMessages.push(`Q${i+1} Hotspots: ${qError.hotspots.message}`);
                        } else if (Array.isArray(qError.hotspots) && qError.hotspots.some((h:any) => h && Object.keys(h).length > 0 && (h.coords?.message || h.label?.message))) {
                             errorMessages.push(`Q${i+1} Hotspots: Contains invalid items. Check details within the question.`);
                        }
                    }

                    if (qError?.imageUrl) errorMessages.push(`Q${i+1} Image URL: ${(qError.imageUrl as any).message}`);
                    if (qError?.correctAnswer) errorMessages.push(`Q${i+1} Correct Answer: ${(qError.correctAnswer as any).message}`);
                    if (qError?.points) errorMessages.push(`Q${i+1} Points: ${qError.points.message}`);

                    if (errorMessages.length > 0) {
                        return <p key={`q-${i}-err`} className="text-sm text-destructive mt-1">{errorMessages.join('; ')}</p>;
                    }
                    return null;
                })}
            </div>
          </CardContent>
          {/* Footer is now empty as buttons are moved to the header */}
          <CardFooter />
        </Card>
      </form>
    </div>
  );
}
