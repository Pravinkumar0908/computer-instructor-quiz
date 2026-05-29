import fs from "fs/promises";
import path from "path";

export interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  explanation?: string;
}

export interface Attempt {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  category: string; // "All" or specific subject
  correctAnswersCount: number;
}

const QUESTIONS_FILE = path.join(process.cwd(), "src/data/db_questions.json");
const ATTEMPTS_FILE = path.join(process.cwd(), "src/data/db_attempts.json");

// Helper to safely read JSON
async function readJsonFile<T>(filePath: string, defaultData: T): Promise<T> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    // If file doesn't exist, write default and return
    try {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), "utf-8");
    } catch (writeErr) {
      console.error(`Failed to initialize file at ${filePath}`, writeErr);
    }
    return defaultData;
  }
}

// Helper to safely write JSON
async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function getQuestions(): Promise<Question[]> {
  return readJsonFile<Question[]>(QUESTIONS_FILE, []);
}

export async function addQuestion(question: Omit<Question, "id">): Promise<Question> {
  const questions = await getQuestions();
  const newQuestion: Question = {
    ...question,
    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  };
  questions.push(newQuestion);
  await writeJsonFile(QUESTIONS_FILE, questions);
  return newQuestion;
}

export async function getAttempts(): Promise<Attempt[]> {
  return readJsonFile<Attempt[]>(ATTEMPTS_FILE, []);
}

export async function addAttempt(attempt: Omit<Attempt, "id" | "timestamp">): Promise<Attempt> {
  const attempts = await getAttempts();
  const newAttempt: Attempt = {
    ...attempt,
    id: `attempt_${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  attempts.push(newAttempt);
  await writeJsonFile(ATTEMPTS_FILE, attempts);
  return newAttempt;
}

export interface DashboardStats {
  totalQuestions: number;
  totalAttempts: number;
  averageAccuracy: number;
  categoryStats: Record<
    string,
    {
      questionCount: number;
      solvedCount: number;
      accuracy: number;
    }
  >;
  recentAttempts: Attempt[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const questions = await getQuestions();
  const attempts = await getAttempts();

  const totalQuestions = questions.length;
  const totalAttempts = attempts.length;

  let totalCorrect = 0;
  let totalAnsweredQuestions = 0;
  attempts.forEach((a) => {
    totalCorrect += a.correctAnswersCount;
    totalAnsweredQuestions += a.totalQuestions;
  });

  const averageAccuracy =
    totalAnsweredQuestions > 0 ? Math.round((totalCorrect / totalAnsweredQuestions) * 100) : 0;

  // Initialize category map
  const categoryMap: DashboardStats["categoryStats"] = {};

  // Group questions by category
  questions.forEach((q) => {
    if (!categoryMap[q.category]) {
      categoryMap[q.category] = { questionCount: 0, solvedCount: 0, accuracy: 0 };
    }
    categoryMap[q.category].questionCount++;
  });

  // Calculate solved counts and accuracy per category from attempts
  attempts.forEach((a) => {
    const cat = a.category;
    if (cat !== "All" && categoryMap[cat]) {
      categoryMap[cat].solvedCount += a.totalQuestions;
      // We estimate accuracy by weighted sum of attempts in that category
      // Add a running log
    }
  });

  // For categories, let's detail the metrics based on questions answered
  const categoryAttempts: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((a) => {
    const cat = a.category;
    if (!categoryAttempts[cat]) {
      categoryAttempts[cat] = { correct: 0, total: 0 };
    }
    categoryAttempts[cat].correct += a.correctAnswersCount;
    categoryAttempts[cat].total += a.totalQuestions;
  });

  Object.keys(categoryMap).forEach((cat) => {
    const solved = categoryAttempts[cat] || categoryAttempts["All"] || { correct: 0, total: 0 };
    // Let's count solved count as number of questions attempted
    categoryMap[cat].solvedCount = solved.total;
    categoryMap[cat].accuracy = solved.total > 0 ? Math.round((solved.correct / solved.total) * 100) : 0;
  });

  // Get 5 most recent attempts
  const recentAttempts = [...attempts]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return {
    totalQuestions,
    totalAttempts,
    averageAccuracy,
    categoryStats: categoryMap,
    recentAttempts,
  };
}
