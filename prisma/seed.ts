
import { PrismaClient, QuestionType, HotspotShapeType } from '@prisma/client';;
// Adjust the path based on your project structure.
// If seed.ts is in prisma/ and L6P1.json is in src/data/tests/
import L6P1Data from '../src/data/tests/L6P1.json';

const prisma = new PrismaClient();

// Helper function to map JSON question type string to Prisma Enum
function mapQuestionType(jsonType: string): QuestionType {
  if (!QuestionType) {
    throw new Error("Prisma enum 'QuestionType' is not available. Did you run 'npx prisma generate'?");
  }
  switch (jsonType.toUpperCase()) {
    case 'MCQ': return QuestionType.MCQ;
    case 'MCMA': return QuestionType.MultipleChoiceMultipleAnswer; // Matches your L6P1.json
    case 'MATRIXCHOICE': return QuestionType.MatrixChoice;
    case 'HOTSPOT': return QuestionType.Hotspot;
    case 'MATCHINGSELECT': return QuestionType.MatchingSelect;
    case 'MTF': return QuestionType.MultipleTrueFalse; // Matches your L6P1.json
    case 'TRUEFALSE': return QuestionType.TrueFalse;
    case 'SHORTANSWER': return QuestionType.ShortAnswer;
    default:
      throw new Error(`Unknown question type from JSON: ${jsonType}`);
  }
}

// Helper function to map JSON hotspot shape string to Prisma Enum
function mapHotspotShapeType(shapeType: string): HotspotShapeType {
  switch (shapeType) {
    case 'Rectangle':
      return "Rectangle" as HotspotShapeType;
    case 'circle': return HotspotShapeType.Circle;
    case 'Polygon': return HotspotShapeType.Polygon;
    default:
      throw new Error(`Unknown hotspot shape type: ${shapeType}`);
  }
}

async function main() {
  console.log(`Start seeding ...`);

  // Delete existing L6P1 test to make seeding idempotent
  try {
    // Prisma requires deleting related records (questions) before deleting the parent (test)
    // if there's a required relation.
    await prisma.question.deleteMany({ where: { testId: L6P1Data.id } }); // Corrected: test_id to testId
    await prisma.test.delete({ where: { id: L6P1Data.id } });
    console.log(`Deleted existing test with ID: ${L6P1Data.id} and its questions.`);
  } catch (error: any) {
    // P2025 is the error code for "Record to delete does not exist"
    if (error.code === 'P2025') {
      console.log(`Test with ID ${L6P1Data.id} not found or already deleted, proceeding to create.`);
    } else {
      // For other errors, log it. You might want to halt seeding if it's critical.
      console.error(`Error deleting existing test ${L6P1Data.id} (or its questions):`, error.message);
    }
  }

  const createdTest = await prisma.test.create({
    data: {
      id: L6P1Data.id, // Use the ID from JSON
      title: L6P1Data.title,
      description: L6P1Data.description,
      password: L6P1Data.password,
      // createdAt and updatedAt will be handled by Prisma's @default(now()) and @updatedAt
      questions: {
        create: L6P1Data.questions.map((q: any) => {
          const questionType = mapQuestionType(q.type);
          
          // Construct the questionData JSON object based on question type
          const questionDataObject: any = {
            // Store correctAnswer as provided in JSON, assuming its format matches expectations
            // For MTF, ensure correctAnswer is an array of strings like ["true", "false"]
            correctAnswer: (questionType === QuestionType.MultipleTrueFalse && Array.isArray(q.correctAnswer))
                            ? q.correctAnswer.map((ans: any) => String(ans).toLowerCase())
                            : q.correctAnswer,
          };

          if (q.options) questionDataObject.options = q.options;
          if (q.statements) questionDataObject.statements = q.statements;
          if (q.categories) questionDataObject.categories = q.categories;
          
          if (questionType === QuestionType.Hotspot) {
            questionDataObject.hotspots = q.hotspots?.map((hs: any) => ({
              ...hs, // id, coords, label from JSON
              shape: mapHotspotShapeType(hs.shape), // Mapped enum value
            })) || [];
            questionDataObject.multipleSelection = !!q.multipleSelection;
          } else {
            // Explicitly set multipleSelection to undefined if not a Hotspot question,
            // as the field is optional in Prisma schema (Boolean?)
            questionDataObject.multipleSelection = undefined; 
          }

          if (q.prompts) questionDataObject.prompts = q.prompts;
          if (q.choices) questionDataObject.choices = q.choices;
          
          return {
            id: q.id, // Use ID from JSON for the question
            text: q.text,
            type: questionType,
            imageUrl: q.imageUrl || null, // Use null if imageUrl is empty/undefined
            points: q.points,
            questionData: questionDataObject, // This is the JSONB field
          };
        }),
      },
    },
    include: {
      questions: true, // Optionally include created questions in the result
    },
  });

  console.log(`Created test "${createdTest.title}" (ID: ${createdTest.id}) with ${createdTest.questions.length} questions.`);
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

