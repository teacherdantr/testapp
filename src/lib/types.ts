
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
  MultipleChoiceMultipleAnswer = 'MCMA',
  MultipleTrueFalse = 'MTF',
  MatrixChoice = 'MatrixChoice',
  Hotspot = 'Hotspot',
  MatchingSelect = 'MatchingSelect',
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
  correctAnswer: string | string[] | Array<{ promptId: string, choiceId: string }>;
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
    userAnswer: string;
    correctAnswer: string | string[] | Array<{ promptId: string, choiceId: string }>;
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
  testMode?: 'training' | 'testing'; // Added testMode
}

