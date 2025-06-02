
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
import { createTest } from '@/lib/actions/testActions';
import { QuestionType, HotspotShapeType } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";

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
  correctAnswer: z.union([
    z.string(), // For MCQ, TrueFalse, ShortAnswer, Single Hotspot
    z.array(z.string()).min(1, 'At least one correct answer must be selected/provided.'), // For MCMA, MTF, Matrix, Multi-Hotspot
    z.array(correctMatchSchema).min(1, 'At least one match must be defined.'), // For MatchingSelect
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
             data.choices?.some(c => c.id === match.choiceId)
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
  // imageUrl validation is now part of the main object schema
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
  path: ['prompts'], // Could also be path: ['choices']
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
          imageUrl: '', // Added default
          options: [{ text: '' }, { text: '' }],
          statements: [],
          categories: [],
          hotspots: [],
          multipleSelection: false,
          prompts: [],
          choices: [],
          correctAnswer: '',
          points: 1
        },
      ],
    },
  });

  const passwordEnabled = watch('passwordEnabled');

  const onSubmit = async (data: TestCreationFormValues) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    if (data.passwordEnabled && data.password) {
        formData.append('password', data.password);
    }

    const processedQuestions = data.questions.map(q => {
      let processedQuestion: any = { ...q };
      // Clear fields not relevant to the question type
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
        // imageUrl is NOT cleared here as MCQ/MCMA can also have it
        processedQuestion.hotspots = undefined;
        // multipleSelection is only for hotspot, but can remain as it's optional
      }
      if (q.type !== QuestionType.MCQ && q.type !== QuestionType.MultipleChoiceMultipleAnswer && q.type !== QuestionType.Hotspot) {
         // Clear imageUrl if not MCQ, MCMA, or Hotspot
         processedQuestion.imageUrl = undefined;
      }
      if (q.type !== QuestionType.MatchingSelect) {
        processedQuestion.prompts = undefined;
        processedQuestion.choices = undefined;
      }
      // Ensure correctAnswer is in the correct format for specific types
      if (q.type === QuestionType.MatchingSelect && Array.isArray(q.correctAnswer)) {
         processedQuestion.correctAnswer = q.correctAnswer.map(match => ({
           promptId: (match as any).promptId, // Type assertion needed as Zod union is complex
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
                    qError?.correctAnswer && <p key={`q-${i}-ca-err`} className="text-sm text-destructive mt-1">{`Q${i+1} Correct Answer: ${qError.correctAnswer.message}`}</p>
                ))}
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
