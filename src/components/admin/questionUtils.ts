// src/components/admin/questionUtils.ts
import type { UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import type { toast as toastFnType } from '@/hooks/use-toast'; // Import the type of the toast function
import { generateAnswerOptions } from '@/ai/flows/prevent-bias'; // Correct import for the server action
import { QuestionType } from '@/lib/types';

/**
 * Generates answer options using AI based on the question type and question text.
 */
export const handleGenerateAIOptions = async (
  questionIndex: number,
  getValues: UseFormGetValues<any>, // getValues for the entire form
  setValue: UseFormSetValue<any>,   // setValue for the entire form
  toast: typeof toastFnType // Pass the actual toast function
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
        toast({
          title: 'Input Required',
          description: 'For MCQ, please provide the correct answer text in its option field before generating distractors.',
          variant: 'default',
        });
        return;
      }
    } else if (questionType === QuestionType.MultipleChoiceMultipleAnswer) {
      // For MCMA, the AI flow expects one "correct answer" to generate distractors.
      // We'll try to use the first selected correct answer if available.
      const mcmaCorrectAnswers = currentCorrectAnswerField as string[];
      if (Array.isArray(mcmaCorrectAnswers) && mcmaCorrectAnswers.length > 0 && mcmaCorrectAnswers[0].trim() !== '') {
        seedCorrectAnswer = mcmaCorrectAnswers[0];
      } else {
        // If no correct answer is pre-selected for MCMA, the AI might not generate optimal distractors.
        // We'll proceed, but the AI's prompt is designed around having one.
        // An alternative would be to prompt the user for one exemplary correct answer here.
        // For now, using a placeholder if none is found.
        seedCorrectAnswer = " "; // AI might interpret an empty string differently than a space
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
        numOptions: 4, // You can adjust the number of options to generate
      });

      if ('options' in result && Array.isArray(result.options)) {
        const newOptions = result.options.map(text => ({ id: crypto.randomUUID(), text }));
        setValue(`questions.${questionIndex}.options`, newOptions, { shouldValidate: true, shouldDirty: true });

        // For MCQ, ensure the original seedCorrectAnswer is still marked as correct if it's among the new options.
        // The McqOptionsBuilder's onChange handler for option text input should help maintain this.
        // If the AI is guaranteed to include the seedCorrectAnswer, this might not be strictly necessary,
        // but it's good to be mindful.
        if (questionType === QuestionType.MCQ && seedCorrectAnswer.trim() !== '') {
            const seedInNewOptions = newOptions.some(opt => opt.text === seedCorrectAnswer);
            if (seedInNewOptions) {
                 setValue(`questions.${questionIndex}.correctAnswer`, seedCorrectAnswer, { shouldValidate: true, shouldDirty: true });
            } else {
                // If AI didn't include the seed, we might need to add it back or clear the correct answer.
                // For now, we assume the AI includes it or the user will re-select.
                toast({ title: 'Note', description: 'AI options generated. Please verify the correct answer is selected.', variant: 'default' });
            }
        }


        toast({
          title: 'Success!',
          description: 'AI-generated options have been populated.',
          variant: 'default',
        });
      } else if ('error' in result) {
        toast({
          title: 'AI Generation Failed',
          description: result.error,
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
