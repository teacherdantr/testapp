
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { QuestionBuilder } from '@/components/admin/QuestionBuilder';
import { fetchAdminTestById, updateTest } from '@/lib/actions/testActions';
import { QuestionType, type Test, type Category, type HotspotArea, HotspotShapeType, type MatchingItem } from '@/lib/types';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
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

const correctMatchSchema = z.object({
  promptId: z.string(),
  choiceId: z.string().min(1, "Each prompt must be matched to a choice."),
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
  prompts: z.array(matchingItemSchema).optional(),
  choices: z.array(matchingItemSchema).optional(),
  correctAnswer: z.union([
    z.string(),
    z.array(z.string()).min(1, 'At least one correct answer must be selected/provided.'),
    z.array(correctMatchSchema).min(1, 'At least one match must be defined.'),
  ]),
  points: z.number().min(1, 'Points must be at least 1'),
}).refine(data => {
  if (data.type === QuestionType.MCQ || data.type === QuestionType.MultipleChoiceMultipleAnswer) {
    return data.options && data.options.length >= 2 && data.options.every(opt => opt.text.trim() !== '');
  }
  return true;
}, {
  message: 'MCQ and MCMA questions must have at least two options with text.',
  path: ['options'],
}).refine(data => {
  if (data.type === QuestionType.MultipleChoiceMultipleAnswer || (data.type === QuestionType.Hotspot && data.multipleSelection)) {
    return Array.isArray(data.correctAnswer) && data.correctAnswer.length > 0 && typeof data.correctAnswer[0] === 'string';
  }
  if (data.type === QuestionType.MultipleTrueFalse || data.type === QuestionType.MatrixChoice) {
    return Array.isArray(data.correctAnswer) &&
           data.statements &&
           data.correctAnswer.length === data.statements.length && typeof data.correctAnswer[0] === 'string';
  }
   if (data.type === QuestionType.MultipleTrueFalse) {
    return (data.correctAnswer as string[]).every(ans => ans === 'true' || ans === 'false');
  }
  if (data.type === QuestionType.MatrixChoice) {
    return data.categories && data.categories.length > 0 && (data.correctAnswer as string[]).every(ans => data.categories?.map(c => c.text).includes(ans));
  }
  if (data.type === QuestionType.Hotspot && !data.multipleSelection) {
    return typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '';
  }
  if (data.type === QuestionType.MatchingSelect) {
    return Array.isArray(data.correctAnswer) &&
           data.prompts && data.prompts.length > 0 &&
           data.choices && data.choices.length > 0 &&
           data.correctAnswer.length === data.prompts.length &&
           (data.correctAnswer as z.infer<typeof correctMatchSchema>[]).every(match =>
             data.prompts?.some(p => p.id === match.promptId) &&
             data.choices?.some(c => c.id === match.choiceId) &&
             match.choiceId.trim() !== '' // This is the key check for matching select
           );
  }
  if ([QuestionType.MCQ, QuestionType.TrueFalse, QuestionType.ShortAnswer].includes(data.type)) {
    return typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '';
  }
  return true;
}, {
  message: 'Correct answer(s) must be provided and in the correct format for the question type.',
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
    return !!(data.imageUrl && data.imageUrl.trim() !== '' && (data.imageUrl.startsWith('https://') || data.imageUrl.startsWith('/images/')));
  }
  return true;
}, { message: 'A valid HTTPS or local (/images/...) Image URL is required for Hotspot questions.', path: ['imageUrl']})
.refine(data => {
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

  const { control, register, handleSubmit, formState: { errors, isSubmitting, isDirty, isValid }, watch, setValue, getValues, reset } = useForm<TestEditFormValues>({
    resolver: zodResolver(testEditSchema),
    defaultValues: {
      title: '',
      description: '',
      passwordEnabled: false,
      password: '',
      questions: [],
    },
    mode: 'onChange', 
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
          reset({
            title: testData.title,
            description: testData.description || '',
            passwordEnabled: !!testData.password,
            password: testData.password || '',
            questions: testData.questions.map(q => {
              try {
                let correctAnswerValue: any;
                const defaultStatements = q.statements || [];
                const defaultPrompts = q.prompts || [];

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
                    correctAnswerValue = (Array.isArray(q.correctAnswer) && q.correctAnswer.length === defaultStatements.length)
                      ? q.correctAnswer
                      : defaultStatements.map(() => (q.type === QuestionType.MultipleTrueFalse ? 'false' : ''));
                    break;
                  case QuestionType.Hotspot:
                    if (q.multipleSelection) {
                      correctAnswerValue = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                    } else {
                      correctAnswerValue = typeof q.correctAnswer === 'string' ? q.correctAnswer : '';
                    }
                    break;
                  case QuestionType.MatchingSelect:
                    let matches = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                    if (matches.length !== defaultPrompts.length || !matches.every(m => typeof m === 'object' && m !== null && 'promptId' in m && 'choiceId' in m)) {
                      matches = defaultPrompts.map(p => ({ promptId: p.id, choiceId: '' }));
                    }
                    correctAnswerValue = matches.map(match => ({
                      promptId: (match as any).promptId,
                      choiceId: (match as any).choiceId === null || (match as any).choiceId === undefined ? '' : String((match as any).choiceId),
                    }));
                    break;
                  default:
                    correctAnswerValue = '';
                }
                // Ensure all nested array items have an ID for useFieldArray
                const ensureIds = <T extends { id?: string, text?: string }>(items: T[] = []): T[] => 
                    items.map(item => ({ ...item, id: item.id || crypto.randomUUID() }));

                return {
                  id: q.id, // Existing question ID
                  text: q.text || '',
                  type: q.type,
                  imageUrl: q.imageUrl || '',
                  options: ensureIds(q.options),
                  statements: ensureIds(q.statements),
                  categories: ensureIds(q.categories),
                  hotspots: (q.hotspots || []).map(hs => ({ ...hs, id: hs.id || crypto.randomUUID() })),
                  multipleSelection: q.multipleSelection === undefined ? false : q.multipleSelection,
                  prompts: ensureIds(q.prompts),
                  choices: ensureIds(q.choices),
                  correctAnswer: correctAnswerValue,
                  points: q.points || 1,
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
                    correctAnswer: '',
                    points: 1,
                };
              }
            }),
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

  const onSubmit = async (data: TestEditFormValues) => {
    if (!testId) return;

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    if (data.passwordEnabled && data.password) {
        formData.append('password', data.password);
    } else {
        formData.append('password', ''); 
    }

    const processedQuestions = data.questions.map(q => {
      // Ensure sub-items have IDs (primarily for newly added ones via QuestionBuilder)
      const ensureClientIds = <T extends { id?: string }>(items: T[] = []): T[] => 
        items.map(item => ({ ...item, id: item.id || crypto.randomUUID() }));

      const questionToProcess: any = { 
        ...q,
        id: q.id, // Preserve original question ID if it exists
        options: ensureClientIds(q.options),
        statements: ensureClientIds(q.statements),
        categories: ensureClientIds(q.categories),
        hotspots: (q.hotspots || []).map(hs => ({ ...hs, id: hs.id || crypto.randomUUID()})),
        prompts: ensureClientIds(q.prompts),
        choices: ensureClientIds(q.choices),
      };
      
      // Ensure correctAnswer for MatchingSelect has string choiceIds (even if empty)
      if (questionToProcess.type === QuestionType.MatchingSelect && Array.isArray(questionToProcess.correctAnswer)) {
        questionToProcess.correctAnswer = questionToProcess.correctAnswer.map((match: any) => ({
            promptId: match.promptId,
            choiceId: typeof match.choiceId === 'string' ? match.choiceId : '', // Ensure choiceId is a string
        }));
      }
      
      // Remove fields not relevant to the question type to keep questionData clean
      if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) {
        delete questionToProcess.options;
      }
      if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) {
        delete questionToProcess.statements;
      }
      if (q.type !== QuestionType.MatrixChoice) {
        delete questionToProcess.categories;
      }
      if (q.type !== QuestionType.Hotspot) {
        delete questionToProcess.hotspots;
        // multipleSelection is only for hotspot, but can remain as it's optional unless explicitly removed
        if (questionToProcess.multipleSelection === undefined) { // Ensure it's explicitly set if not hotspot
           delete questionToProcess.multipleSelection;
        }
      }
       // Only keep imageUrl for relevant types
      if (![QuestionType.MCQ, QuestionType.MultipleChoiceMultipleAnswer, QuestionType.Hotspot, QuestionType.MatchingSelect].includes(q.type)) {
         delete questionToProcess.imageUrl;
      }
      if (q.type !== QuestionType.MatchingSelect) {
        delete questionToProcess.prompts;
        delete questionToProcess.choices;
      }
      
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
      router.push('/admin');
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
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Edit Test</CardTitle>
          <CardDescription>Modify the details of your test below.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
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
                    <div className="pl-8 space-y-2">
                        <Label htmlFor="password">Set Password</Label>
                        <Input id="password" type="password" {...register('password')} placeholder="Enter a secure password" />
                        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
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
                {Array.isArray(errors.questions) && errors.questions.map((qError, i) => (
                    qError?.correctAnswer && <p key={`q-${i}-ca-err`} className="text-sm text-destructive mt-1">{`Q${i+1} Correct Answer: ${(qError.correctAnswer as any).message}`}</p>
                ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto text-lg py-3 px-6" size="lg" disabled={!isDirty || !isValid || isSubmitting}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push('/admin')} className="ml-4">
                Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
    

    