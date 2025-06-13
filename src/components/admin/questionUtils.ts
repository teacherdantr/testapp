// src/components/admin/questionUtils.ts
import { UseFormGetValues, UseFormSetValue } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import { generateAnswerOptionsAI } from '@/ai/genkit';
import { QuestionType } from '@/lib/types';

/**
 * Generates answer options using AI based on the question type and question text.
 *
 * @param getValues - The getValues function from react-hook-form to access form values.
 * @param setValue - The setValue function from react-hook-form to set form values.
 */
export const handleGenerateAIOptions = async (
  getValues: UseFormGetValues<any>,
  setValue: UseFormSetValue<any>
) => {
  const questionType = getValues('type') as QuestionType;
  const questionText = getValues('text') as string;

  if (!questionText) {
    toast({
      title: 'Error',
      description: 'Please enter the question text first.',
      variant: 'destructive',
    });
    return;
  }

  let prompt = '';
  switch (questionType) {
    case QuestionType.MCQ:
      prompt = `Generate 4 distinct multiple-choice options for the following question. Provide only the options as a JSON array of strings:\n\n"${questionText}"`;
      break;
    case QuestionType.MCMA:
      prompt = `Generate 4 distinct multiple-choice options for the following question, where multiple answers can be correct. Provide only the options as a JSON array of strings:\n\n"${questionText}"`;
      break;
    case QuestionType.TrueFalse:
      setValue('options', ['True', 'False']);
      toast({
        title: 'Options Generated',
        description: 'True/False options have been set.',
      });
      return;
    case QuestionType.MatchingSelect:
    case QuestionType.MatchingDragAndDrop:
      prompt = `Generate 4 pairs of matching items for the following context. Provide only the items as a JSON array of objects with 'id', 'text', and 'match' properties. The 'id' should be a unique string, 'text' is the item text, and 'match' is the corresponding match text:\n\n"${questionText}"`;
      break;
    default:
      toast({
        title: 'Info',
        description: 'AI option generation is not available for this question type.',
      });
      return;
  }

  toast({
    title: 'Generating Options',
    description: 'Please wait while AI generates the options...',
  });

  try {
    const generatedOptions = await generateAnswerOptionsAI(prompt);

    if (generatedOptions) {
      if (questionType === QuestionType.MatchingSelect || questionType === QuestionType.MatchingDragAndDrop) {
        // Assuming the AI returns an array of { text: string, match: string }
        const matchingItems = generatedOptions.map((item: any, index: number) => ({
          id: `item-${index}-${Date.now()}`, // Simple unique ID generation
          text: item.text,
          match: item.match,
        }));
        setValue('matchingItems', matchingItems);
      } else {
        setValue('options', generatedOptions);
      }

      toast({
        title: 'Success',
        description: 'AI options generated successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to generate options. Please try again.',
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('Error generating AI options:', error);
    toast({
      title: 'Error',
      description: 'An error occurred while generating options.',
      variant: 'destructive',
    });
  }
};