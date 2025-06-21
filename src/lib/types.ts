
export interface Option {
  id: string;
  text: string;
}

export interface TrueFalseStatement {
  id: string;
  text: string;
}

export interface Category {
  id: string;
  text: string;
}

export enum HotspotShapeType {
  Rectangle = 'rect',
  Circle = 'circle',
  Polygon = 'poly',
}

export interface HotspotArea {
  id: string;
  shape: HotspotShapeType;
  coords: string;
  label?: string;
}

export interface MatchingItem {
  id: string;
  text: string;
}

export enum QuestionType {
  MCQ = 'MCQ',
  ShortAnswer = 'ShortAnswer',
  TrueFalse = 'TrueFalse',
  MultipleChoiceMultipleAnswer = 'MultipleChoiceMultipleAnswer', // Corrected value
  MultipleTrueFalse = 'MultipleTrueFalse',                     // Corrected value
  MatrixChoice = 'MatrixChoice',
  Hotspot = 'Hotspot',
  MatchingSelect = 'MatchingSelect',
  MatchingDragAndDrop = 'MatchingDragAndDrop',
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  imageUrl?: string; // Optional image URL for the question itself
  options?: Option[];
  statements?: TrueFalseStatement[];
  categories?: Category[];
  points: number;
  hotspots?: HotspotArea[];
  multipleSelection?: boolean;
  prompts?: MatchingItem[];
  choices?: MatchingItem[];
  draggableItems?: MatchingItem[]; // Corrected type
  targetItems?: MatchingItem[];    // Corrected type
  allowShuffle?: boolean;    // New field for MatchingDragAndDrop
  explanation?: string; // Added explanation for all question types
  correctAnswer: string | string[] | Array<{ promptId: string, choiceId: string }> | Array<{ draggableItemId: string, targetItemId: string }>;
}


export interface Test {
  id:string;
  title: string;
  description?: string;
  password?: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface UserAnswer {
  questionId: string;
  answer: string;
}

export interface TestResult {
  testId: string;
  score: number;
  totalPoints: number;
  questionResults: Array<{
    questionId: string;
    questionText: string;
    questionType: QuestionType;
    imageUrl?: string; // Added for results display
    options?: Option[];
    statements?: TrueFalseStatement[];
    categories?: Category[];
    hotspots?: HotspotArea[];
    multipleSelection?: boolean;
    prompts?: MatchingItem[];
    choices?: MatchingItem[];
    draggableItems?: MatchingItem[];
    targetItems?: MatchingItem[];
    allowShuffle?: boolean;
    userAnswer: string | { [draggableIndex: number]: number }; // Update userAnswer to accommodate matching
    correctAnswer: string | string[] | Array<{ promptId: string, choiceId: string }> | Array<{ draggableItemId: string, targetItemId: string }>;
    isCorrect: boolean;
    pointsEarned: number;
    pointsPossible: number;
  }>;
  testTitle: string;
}


export interface StoredTestResult extends TestResult {
  userId: string;
  submittedAt: string;
  timeTaken?: number;
  testMode?: 'training' | 'testing' | 'race'; // Added 'race'
}
