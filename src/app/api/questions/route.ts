export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getQuestions, addQuestion, addQuestionsBulk, deleteQuestion, deleteQuestionsByQuizName, deleteQuestionsByBatchId, updateQuizNameByBatchId, updateQuizNameByLegacyName, Question } from "@/lib/db";

export async function GET() {
  try {
    const questions = await getQuestions();
    return NextResponse.json(questions);
  } catch (error) {
    console.error("GET /api/questions error:", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let questionsToAdd: Omit<Question, "id">[] = [];

    // 1. Determine the format of the payload
    if (Array.isArray(body)) {
      // Direct array of questions
      questionsToAdd = body;
    } else if (body && Array.isArray(body.questions)) {
      // Wrapped quiz structure: { title, questions: [...] }
      questionsToAdd = body.questions;
    } else if (body && typeof body === "object") {
      // Single question
      questionsToAdd = [body];
    } else {
      return NextResponse.json({ error: "Invalid JSON format. Expected object or array." }, { status: 400 });
    }

    if (questionsToAdd.length === 0) {
      return NextResponse.json({ error: "No questions found in payload." }, { status: 400 });
    }

    // 2. Validate all questions in the list
    const validatedQuestions: Omit<Question, "id">[] = [];
    const batchId = "batch_" + Date.now();
    const createdAt = new Date().toISOString();

    for (let i = 0; i < questionsToAdd.length; i++) {
      const q = questionsToAdd[i];
      if (!q.question || !Array.isArray(q.options) || q.options.length < 2 || typeof q.answerIndex !== "number") {
        return NextResponse.json({ 
          error: `Question at index ${i} is invalid. Make sure it has 'question', 'options' array, and 'answerIndex'.` 
        }, { status: 400 });
      }

      if (q.answerIndex < 0 || q.answerIndex >= q.options.length) {
        return NextResponse.json({ 
          error: `Question at index ${i} has answerIndex out of bounds.` 
        }, { status: 400 });
      }

      validatedQuestions.push({
        question: q.question,
        options: q.options,
        answerIndex: q.answerIndex,
        category: q.category || "General Computer Science",
        difficulty: q.difficulty || "Medium",
        explanation: q.explanation || "",
        quizName: q.quizName || "",
        batchId: q.batchId || batchId,
        createdAt: q.createdAt || createdAt
      });
    }

    // 3. Bulk insert to Firestore
    const insertedQuestions = await addQuestionsBulk(validatedQuestions);
    const totalCount = (await getQuestions()).length;

    return NextResponse.json({
      message: `Successfully imported ${insertedQuestions.length} questions dynamically!`,
      importedCount: insertedQuestions.length,
      totalCount,
      questions: insertedQuestions
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/questions error:", error);
    return NextResponse.json({ error: "Failed to process question database update" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const quizName = searchParams.get("quizName");
    const batchId = searchParams.get("batchId");

    if (batchId) {
      const deletedCount = await deleteQuestionsByBatchId(batchId);
      return NextResponse.json({ 
        message: `Successfully deleted ${deletedCount} questions for batch "${batchId}"`, 
        batchId,
        deletedCount
      });
    }

    if (quizName) {
      const deletedCount = await deleteQuestionsByQuizName(quizName);
      return NextResponse.json({ 
        message: `Successfully deleted ${deletedCount} questions for quiz "${quizName}"`, 
        quizName,
        deletedCount
      });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing question ID, batchId, or quizName parameter" }, { status: 400 });
    }

    await deleteQuestion(id);
    return NextResponse.json({ message: "Question successfully deleted from database", id });
  } catch (error) {
    console.error("DELETE /api/questions error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { batchId, quizName, newQuizName } = body;

    if (!newQuizName || !newQuizName.trim()) {
      return NextResponse.json({ error: "Missing newQuizName parameter" }, { status: 400 });
    }

    if (batchId) {
      const updatedCount = await updateQuizNameByBatchId(batchId, newQuizName.trim());
      return NextResponse.json({ 
        message: `Successfully renamed ${updatedCount} questions to "${newQuizName}"`, 
        batchId,
        newQuizName,
        updatedCount
      });
    }

    if (quizName) {
      const updatedCount = await updateQuizNameByLegacyName(quizName, newQuizName.trim());
      return NextResponse.json({ 
        message: `Successfully renamed ${updatedCount} questions to "${newQuizName}"`, 
        quizName,
        newQuizName,
        updatedCount
      });
    }

    return NextResponse.json({ error: "Missing batchId or quizName parameter" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/questions error:", error);
    return NextResponse.json({ error: "Failed to update quiz name" }, { status: 500 });
  }
}
