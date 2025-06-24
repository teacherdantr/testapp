
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
import { createTest } from '@/lib/actions/testActions';
import { QuestionType, HotspotShapeType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, RefreshCw, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { useState } from 'react';

const optionSchema = z.object({
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

const correctDragDropMatchSchema = z.object({
    draggableItemId: z.string(),
    targetItemId: z.string(),
});

const questionSchema = z.object({
  text: z.string().min(1, 'Question text cannot be empty'),
  type: z.nativeEnum(QuestionType),
  imageUrl: z.string().optional().refine(val => !val || val.startsWith('https://') || val.startsWith('/images/'), {
    message: 'Image URL must be a valid HTTPS URL or a local path like /images/your-image.png (optional)',
  }),
  options: z.array(optionSchema).optional(), // For MCQ, MCMA
  statements: z.array(trueFalseStatementSchema).optional(), // For MTF, MatrixChoice
  categories: z.array(categorySchema).optional(), // For MatrixChoice
  hotspots: z.array(hotspotAreaSchema).optional(), // For Hotspot
  multipleSelection: z.boolean().optional(), // For Hotspot
  prompts: z.array(matchingItemSchema).optional(), // For MatchingSelect
  choices: z.array(matchingItemSchema).optional(), // For MatchingSelect
  draggableItems: z.array(matchingItemSchema).optional(), // For MatchingDragAndDrop
  targetItems: z.array(matchingItemSchema).optional(), // For MatchingDragAndDrop
  allowShuffle: z.boolean().optional(), // For MatchingDragAndDrop
  explanation: z.string().optional(), // For all question types
  correctAnswer: z.union([
    z.string(), // For MCQ, TrueFalse, ShortAnswer, Single Hotspot
    z.array(z.string()).min(1, 'At least one correct answer must be selected/provided.'), // For MCMA, MTF, Matrix, Multi-Hotspot
    z.array(correctMatchSchema).min(1, 'At least one match must be defined.'), // For MatchingSelect
    z.array(correctDragDropMatchSchema), // For MatchingDragAndDrop
  ]),
  points: z.number().min(1, 'Points must be at least 1'),
}).refine(data => {
  if (data.type === QuestionType.MCQ || data.type === QuestionType.MultipleChoiceMultipleAnswer) {
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: 'MCQ and MCMA questions must have at least two options.',
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
             data.choices?.some(c => c.id === match.choiceId)
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
    return typeof data.correctAnswer === 'string' && data.correctAnswer.trim() !== '';
  }
  return true;
}, {
  message: 'Correct answer(s) must be provided and in the correct format for the question type. For MatchingDragAndDrop, check that all pairs are matched.',
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
  } else if (data.type === QuestionType.MatchingDragAndDrop) {
        return data.draggableItems && data.draggableItems.length >= 1 && data.draggableItems.every(item => item.text.trim() !== '') &&
               data.targetItems && data.targetItems.length >= 1 && data.targetItems.every(item => item.text.trim() !== '');
  }
  return true;
}, {
  message: 'Matching questions must have at least one prompt/target item and one choice/draggable item, all with text.',
  path: ['draggableItems'],
});


const testCreationSchema = z.object({
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


export type TestCreationFormValues = z.infer<typeof testCreationSchema>;

export default function CreateTestPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const { control, register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue, getValues } = useForm<TestCreationFormValues>({
    resolver: zodResolver(testCreationSchema),
    defaultValues: {
      title: '',
      description: '',
      passwordEnabled: false,
      password: '',
      questions: [
        {
          text: '',
          type: QuestionType.MCQ,
          imageUrl: '',
          options: [{ text: '' }, { text: '' }],
          statements: [],
          categories: [],
          hotspots: [],
          multipleSelection: false,
          prompts: [],
          choices: [],
          draggableItems: [],
          targetItems: [],
          allowShuffle: true,
          correctAnswer: '',
          points: 1
        },
      ],
    },
  });

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

  const onSubmit = async (data: TestCreationFormValues) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    if (data.passwordEnabled && data.password) {
        formData.append('password', data.password);
    }

    const processedQuestions = data.questions.map(q => {
      let processedQuestion: any = { ...q };

      // Clean up fields not relevant to the question type
      if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer) delete processedQuestion.options;
      if (q.type !== QuestionType.MultipleTrueFalse && q.type !== QuestionType.MatrixChoice) delete processedQuestion.statements;
      if (q.type !== QuestionType.MatrixChoice) delete processedQuestion.categories;
      if (q.type !== QuestionType.Hotspot) {
        delete processedQuestion.hotspots;
        if (processedQuestion.multipleSelection === undefined) delete processedQuestion.multipleSelection;
      }
      if (![QuestionType.MCQ, QuestionType.MultipleChoiceMultipleAnswer, QuestionType.Hotspot, QuestionType.MatchingSelect].includes(q.type)) delete processedQuestion.imageUrl;
      if (q.type !== QuestionType.MatchingSelect) { delete processedQuestion.prompts; delete processedQuestion.choices; }
      if (q.type !== QuestionType.MatchingDragAndDrop) { delete processedQuestion.draggableItems; delete processedQuestion.targetItems; delete processedQuestion.allowShuffle;}


      if (q.type === QuestionType.MatchingSelect && Array.isArray(q.correctAnswer)) {
         processedQuestion.correctAnswer = q.correctAnswer.map(match => ({
           promptId: (match as any).promptId,
           choiceId: (match as any).choiceId,
         }));
      }

      return processedQuestion;
    });

    formData.append('questions', JSON.stringify(processedQuestions));

    const result = await createTest(formData);

    if (result.error) {
      toast({
        title: 'Error Creating Test',
        description: result.error + (result.issues ? ` Issues: ${JSON.stringify(result.issues)}` : ''),
        variant: 'destructive',
      });
    } else if (result.testId) {
      toast({
        title: 'Test Created Successfully!',
        description: `Test "${data.title}" has been created. ID: ${result.testId}`,
      });
      router.push('/admin');
    }
  };

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
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">Create New Test</CardTitle>
          <CardDescription>Fill in the details below to create your new test.</CardDescription>
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
                                onCheckedChange={field.onChange}
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

                    if (qError?.statements) {
                        if (qError.statements.message) {
                            errorMessages.push(`Q${i+1} Statements: ${qError.statements.message}`);
                        } else if (Array.isArray(qError.statements) && qError.statements.some((s:any) => s && Object.keys(s).length > 0)) {
                            errorMessages.push(`Q${i+1} Statements: Contains invalid items. Check details within the question.`);
                        }
                    }
                    if (qError?.categories) {
                        if (qError.categories.message) {
                            errorMessages.push(`Q${i+1} Categories: ${qError.categories.message}`);
                        } else if (Array.isArray(qError.categories) && qError.categories.some((c:any) => c && Object.keys(c).length > 0)) {
                            errorMessages.push(`Q${i+1} Categories: Contains invalid items. Check details within the question.`);
                        }
                    }
                    if (qError?.hotspots) {
                        if (qError.hotspots.message) {
                            errorMessages.push(`Q${i+1} Hotspots: ${qError.hotspots.message}`);
                        } else if (Array.isArray(qError.hotspots) && qError.hotspots.some((h:any) => h && Object.keys(h).length > 0)) {
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
          <CardFooter>
            <Button type="submit" className="w-full md:w-auto text-lg py-3 px-6" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Test...' : 'Create Test'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
