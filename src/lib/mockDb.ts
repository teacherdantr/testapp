
import type { Test, StoredTestResult, Question, Option, TrueFalseStatement, Category } from '@/lib/types';
import fs from 'fs';
import path from 'path';

const testsDir = path.join(process.cwd(), 'src/data/tests');
// const userResultsDir = path.join(process.cwd(), 'src/data/userResults'); // For future use if desired

const ensureTestsDirExists = () => {
  if (!fs.existsSync(testsDir)) {
    fs.mkdirSync(testsDir, { recursive: true });
  }
};

export const getTests = async (): Promise<Test[]> => {
  ensureTestsDirExists();
  try {
    const files = fs.readdirSync(testsDir);
    const tests: Test[] = files
      .filter(file => file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(testsDir, file);
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(fileContent) as Test;
        } catch (parseError: any) {
          console.error(`Error parsing test file ${filePath}: ${parseError.message}`);
          throw new Error(`Failed to parse ${filePath}: ${parseError.message}`);
        }
      });
    return tests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error: any) {
    console.error(`Error reading tests directory (${testsDir}):`, error.message);
    throw new Error(`Failed to read tests from directory ${testsDir}: ${error.message}`);
  }
};

export const getTestById = async (id: string): Promise<Test | undefined> => {
  ensureTestsDirExists();
  const filePath = path.join(testsDir, `${id}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent) as Test;
    }
    return undefined;
  } catch (error: any) {
    console.error(`Error reading test file ${filePath}:`, error.message);
    // Return undefined or throw, depending on how critical this is.
    // For now, let's return undefined to match previous behavior more closely.
    // throw new Error(`Failed to read test file ${filePath}: ${error.message}`);
    return undefined;
  }
};

export const addTest = async (test: Test): Promise<Test> => {
  ensureTestsDirExists();
  const filePath = path.join(testsDir, `${test.id}.json`);
  const testWithTimestamps = {
    ...test,
    createdAt: test.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(filePath, JSON.stringify(testWithTimestamps, null, 2));
    return testWithTimestamps;
  } catch (error: any) {
    console.error(`Error writing test file ${test.id}.json: ${error.message}`);
    throw new Error(`Failed to write test file ${test.id}.json: ${error.message}`);
  }
};

export const updateTest = async (id: string, updatedTestPartialData: Partial<Test>): Promise<Test | undefined> => {
  ensureTestsDirExists();
  const filePath = path.join(testsDir, `${id}.json`);
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Attempted to update non-existent test file: ${filePath}`);
      return undefined;
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const existingTest = JSON.parse(fileContent) as Test;

    const updatedQuestions = updatedTestPartialData.questions?.map((updatedQ: Partial<Question>) => {
      const existingQ = existingTest.questions.find(q => q.id === updatedQ.id);
      const newOptions = updatedQ.options?.map((opt: Partial<Option>) => {
        const existingOpt = existingQ?.options?.find(o => o.id === opt.id);
        return { ...existingOpt, ...opt, id: opt.id || existingOpt?.id || crypto.randomUUID() } as Option;
      });
      const newStatements = updatedQ.statements?.map((stmt: Partial<TrueFalseStatement>) => {
        const existingStmt = existingQ?.statements?.find(s => s.id === stmt.id);
        return { ...existingStmt, ...stmt, id: stmt.id || existingStmt?.id || crypto.randomUUID() } as TrueFalseStatement;
      });
      const newCategories = updatedQ.categories?.map((cat: Partial<Category>) => {
        const existingCat = existingQ?.categories?.find(c => c.id === cat.id);
        return { ...existingCat, ...cat, id: cat.id || existingCat?.id || crypto.randomUUID() } as Category;
      });
      return {
        ...existingQ,
        ...updatedQ,
        id: updatedQ.id || existingQ?.id || crypto.randomUUID(),
        options: newOptions || existingQ?.options,
        statements: newStatements || existingQ?.statements,
        categories: newCategories || existingQ?.categories,
      } as Question;
    });

    const fullyUpdatedTest: Test = {
      ...existingTest,
      ...updatedTestPartialData,
      questions: updatedQuestions || existingTest.questions,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(fullyUpdatedTest, null, 2));
    return fullyUpdatedTest;
  } catch (error: any) {
    console.error(`Error updating test file ${filePath}: ${error.message}`);
    // throw new Error(`Error updating test file ${filePath}: ${error.message}`);
    return undefined;
  }
};

export const deleteTest = async (id: string): Promise<boolean> => {
  ensureTestsDirExists();
  const filePath = path.join(testsDir, `${id}.json`);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`Error deleting test file ${filePath}: ${error.message}`);
    // throw new Error(`Error deleting test file ${filePath}: ${error.message}`);
    return false;
  }
};


let userTestResults: StoredTestResult[] = [
  {
    userId: 'StudentA',
    testId: 'L6P1',
    testTitle: 'LV01 Tổng Hợp-Phần 1',
    score: 170, // Assuming each question is 10 points now
    totalPoints: 450, // Total points for all 45 questions
    questionResults: [], // Keeping this brief for mock data
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    timeTaken: 750, // 12 min 30 sec
    testMode: 'testing',
  },
  {
    userId: 'StudentB',
    testId: 'L6P1',
    testTitle: 'LV01 Tổng Hợp-Phần 1',
    score: 400,
    totalPoints: 450,
    questionResults: [],
    submittedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    timeTaken: 600, // 10 min
    testMode: 'race',
  },
  {
    userId: 'StudentC',
    testId: 'L6P1',
    testTitle: 'LV01 Tổng Hợp-Phần 1',
    score: 250,
    totalPoints: 450,
    questionResults: [],
    submittedAt: new Date().toISOString(),
    timeTaken: 880, // 14 min 40 sec
    testMode: 'training',
  },
   {
    userId: 'dhcuong94',
    testId: 'L6P1',
    testTitle: 'LV01 Tổng Hợp-Phần 1',
    score: 100,
    totalPoints: 450,
    questionResults: [],
    submittedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    timeTaken: 900, // Max time (auto-submit or finished at exact time)
    testMode: 'testing',
  },
];

export const saveUserTestResult = async (result: StoredTestResult): Promise<StoredTestResult> => {
  const newResult = JSON.parse(JSON.stringify(result));
  userTestResults.push(newResult);
  console.log('User test result saved (in-memory):', newResult.userId, newResult.testTitle, newResult.score, 'Time taken:', newResult.timeTaken, 'Mode:', newResult.testMode);
  return newResult;
};

export const getUserTestHistory = async (userId: string): Promise<StoredTestResult[]> => {
  const normalizedUserId = userId.toLowerCase();
  const history = userTestResults.filter(result => result.userId.toLowerCase() === normalizedUserId);
  return JSON.parse(JSON.stringify(history.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())));
};

export const getAllUserTestResults = async (): Promise<StoredTestResult[]> => {
  return JSON.parse(JSON.stringify(userTestResults.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())));
};

