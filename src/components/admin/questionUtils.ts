// src/components/admin/questionUtils.ts
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import type { toast as toastFnType } from '@/hooks/use-toast';
import { generateAnswerOptions } from '@/ai/server-actions'; // Updated import
import { QuestionType } from '@/lib/types';

/**
 * Generates answer options using AI based on the question type and question text.
 */
export const handleGenerateAIOptions = async (
  questionIndex: number,
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>,
  toast: typeof toastFnType
) => {
  const questionText = getValues(`questions.${questionIndex}.text`) as string;
  const questionType = getValues(`questions.${questionIndex}.type`) as QuestionType;

  if (!questionText || questionText.trim() === '') {
    toast({
      title: 'Input Required',
      description: 'Please enter the question text first.',
      variant: 'destructive',
    });
    return;
  }

  if (questionType === QuestionType.MCQ || questionType === QuestionType.MultipleChoiceMultipleAnswer) {
    let seedCorrectAnswer = '';
    const currentCorrectAnswerField = getValues(`questions.${questionIndex}.correctAnswer`);

    if (questionType === QuestionType.MCQ) {
      if (typeof currentCorrectAnswerField === 'string' && currentCorrectAnswerField.trim() !== '') {
        seedCorrectAnswer = currentCorrectAnswerField;
      } else {
        // If no correct answer text is directly in the field, try to find it from options
        const options = getValues(`questions.${questionIndex}.options`) as Array<{ text: string }> || [];
        const selectedOption = options.find(opt => opt.text === currentCorrectAnswerField);
        if (selectedOption) {
            seedCorrectAnswer = selectedOption.text;
        } else {
            toast({
            title: 'Input Required',
            description: 'For MCQ, please ensure the correct answer text is defined in one of the options and selected.',
            variant: 'default',
            });
            return;
        }
      }
    } else if (questionType === QuestionType.MultipleChoiceMultipleAnswer) {
      const mcmaCorrectAnswers = currentCorrectAnswerField as string[];
      if (Array.isArray(mcmaCorrectAnswers) && mcmaCorrectAnswers.length > 0 && mcmaCorrectAnswers[0].trim() !== '') {
        seedCorrectAnswer = mcmaCorrectAnswers[0];
      } else {
        seedCorrectAnswer = " "; // AI might need some input, even if just a space
      }
    }

    toast({
      title: 'Generating Options',
      description: 'AI is working... Please wait.',
      variant: 'default',
    });

    try {
      const result = await generateAnswerOptions({
        question: questionText,
        correctAnswer: seedCorrectAnswer,
        numOptions: 4,
      });

      if ('options' in result && Array.isArray(result.options)) {
        const newOptions = result.options.map(text => ({ id: crypto.randomUUID(), text }));
        setValue(`questions.${questionIndex}.options`, newOptions, { shouldValidate: true, shouldDirty: true });
        
        if (questionType === QuestionType.MCQ && seedCorrectAnswer.trim() !== '') {
            const seedInNewOptions = newOptions.some(opt => opt.text === seedCorrectAnswer);
            if (seedInNewOptions) {
                 setValue(`questions.${questionIndex}.correctAnswer`, seedCorrectAnswer, { shouldValidate: true, shouldDirty: true });
            } else {
                // If AI didn't include the seed, clear the correct answer or add the seed back.
                // For now, let's assume the user will re-select if the AI-generated correct option differs.
                setValue(`questions.${questionIndex}.correctAnswer`, newOptions.length > 0 ? newOptions[0].text : '', { shouldValidate: true, shouldDirty: true });
                toast({ title: 'Note', description: 'AI options generated. The original correct answer might have changed if not present in new options. Please verify.', variant: 'default' });
            }
        } else if (questionType === QuestionType.MultipleChoiceMultipleAnswer) {
            // For MCMA, we typically want to preserve existing correct answers if they are among the new options
            // or let the user select from the new set.
            // For simplicity, after AI generation, we'll clear existing correct answers and let the user re-select.
            setValue(`questions.${questionIndex}.correctAnswer`, [], { shouldValidate: true, shouldDirty: true });
        }


        toast({
          title: 'Success!',
          description: 'AI-generated options have been populated.',
          variant: 'default',
        });
      } else if ('error' in result && 'message' in result) { // Assuming result has { error: string, message?: string }
        toast({
          title: 'AI Generation Failed',
          description: (result as any).message || (result as any).error, // Use message if available, else error
          variant: 'destructive',
        });
      } else if ('error' in result) {
         toast({
          title: 'AI Generation Failed',
          description: (result as {error: string}).error,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error calling generateAnswerOptions:', error);
      toast({
        title: 'Error',
        description: `An unexpected error occurred while generating options: ${error.message}`,
        variant: 'destructive',
      });
    }
  } else {
    toast({
      title: 'Not Applicable',
      description: 'AI option generation is currently supported for MCQ and Multiple Answer MCQ types.',
      variant: 'default',
    });
  }
};
