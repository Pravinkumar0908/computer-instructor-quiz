import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  explanation?: string;
  quizName?: string;
  batchId?: string;
  createdAt?: string;
}

export interface Attempt {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  category: string;
  correctAnswersCount: number;
  quizName?: string;
  userId?: string;
}

// ================== QUESTIONS ==================

export async function getQuestions(): Promise<Question[]> {
  const questionsRef = collection(db, "questions");
  const snapshot = await getDocs(questionsRef);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Question[];
}

export async function addQuestion(question: Omit<Question, "id">): Promise<Question> {
  const questionsRef = collection(db, "questions");
  const docRef = await addDoc(questionsRef, {
    ...question,
    createdAt: new Date().toISOString(),
  });
  return {
    id: docRef.id,
    ...question,
  };
}

export async function addQuestionsBulk(questions: Omit<Question, "id">[]): Promise<Question[]> {
  const questionsRef = collection(db, "questions");
  const batch = writeBatch(db);
  const addedQuestions: Question[] = [];

  // Firestore batches max 500 ops, so chunk if needed
  const chunks = [];
  for (let i = 0; i < questions.length; i += 450) {
    chunks.push(questions.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batchInstance = writeBatch(db);
    for (const q of chunk) {
      const docRef = doc(questionsRef);
      batchInstance.set(docRef, {
        ...q,
        createdAt: new Date().toISOString(),
      });
      addedQuestions.push({
        id: docRef.id,
        ...q,
      });
    }
    await batchInstance.commit();
  }

  return addedQuestions;
}

export async function deleteQuestion(id: string): Promise<void> {
  const docRef = doc(db, "questions", id);
  await deleteDoc(docRef);
}

export async function deleteQuestionsByQuizName(quizName: string): Promise<number> {
  const questionsRef = collection(db, "questions");
  const snapshot = await getDocs(questionsRef);
  const docsToDelete = snapshot.docs.filter(docSnap => {
    const qData = docSnap.data();
    const qName = qData.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
    return qName === quizName.trim();
  });

  const chunks = [];
  for (let i = 0; i < docsToDelete.length; i += 450) {
    chunks.push(docsToDelete.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batchInstance = writeBatch(db);
    for (const docSnap of chunk) {
      batchInstance.delete(docSnap.ref);
    }
    await batchInstance.commit();
  }

  return docsToDelete.length;
}

export async function deleteQuestionsByBatchId(batchId: string): Promise<number> {
  const questionsRef = collection(db, "questions");
  const snapshot = await getDocs(questionsRef);
  const docsToDelete = snapshot.docs.filter(docSnap => {
    const qData = docSnap.data();
    return qData.batchId === batchId;
  });

  const chunks = [];
  for (let i = 0; i < docsToDelete.length; i += 450) {
    chunks.push(docsToDelete.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batchInstance = writeBatch(db);
    for (const docSnap of chunk) {
      batchInstance.delete(docSnap.ref);
    }
    await batchInstance.commit();
  }

  return docsToDelete.length;
}

export async function updateQuizNameByBatchId(batchId: string, newQuizName: string): Promise<number> {
  const questionsRef = collection(db, "questions");
  const snapshot = await getDocs(questionsRef);
  const docsToUpdate = snapshot.docs.filter(docSnap => {
    const qData = docSnap.data();
    return qData.batchId === batchId;
  });

  const chunks = [];
  for (let i = 0; i < docsToUpdate.length; i += 450) {
    chunks.push(docsToUpdate.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batchInstance = writeBatch(db);
    for (const docSnap of chunk) {
      batchInstance.update(docSnap.ref, { quizName: newQuizName });
    }
    await batchInstance.commit();
  }

  return docsToUpdate.length;
}

export async function updateQuizNameByLegacyName(oldQuizName: string, newQuizName: string): Promise<number> {
  const questionsRef = collection(db, "questions");
  const snapshot = await getDocs(questionsRef);
  const docsToUpdate = snapshot.docs.filter(docSnap => {
    const qData = docSnap.data();
    const qName = qData.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
    return qName === oldQuizName.trim();
  });

  const chunks = [];
  for (let i = 0; i < docsToUpdate.length; i += 450) {
    chunks.push(docsToUpdate.slice(i, i + 450));
  }

  for (const chunk of chunks) {
    const batchInstance = writeBatch(db);
    for (const docSnap of chunk) {
      batchInstance.update(docSnap.ref, { quizName: newQuizName });
    }
    await batchInstance.commit();
  }

  return docsToUpdate.length;
}

// ================== ATTEMPTS ==================

export async function getAttempts(userId?: string): Promise<Attempt[]> {
  const attemptsRef = collection(db, "attempts");
  let q;
  if (userId) {
    q = query(attemptsRef, where("userId", "==", userId));
  } else {
    q = query(attemptsRef);
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as Attempt[];
}

export async function addAttempt(
  attempt: Omit<Attempt, "id" | "timestamp">
): Promise<Attempt> {
  const attemptsRef = collection(db, "attempts");
  const newAttempt = {
    ...attempt,
    timestamp: new Date().toISOString(),
  };
  const docRef = await addDoc(attemptsRef, newAttempt);
  return {
    id: docRef.id,
    ...newAttempt,
  };
}

// ================== DASHBOARD ==================

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

export async function getDashboardStats(userId?: string): Promise<DashboardStats> {
  const questions = await getQuestions();
  const attempts = await getAttempts(userId);

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
