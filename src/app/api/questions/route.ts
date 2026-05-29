import { NextResponse } from "next/server";
import { getQuestions, addQuestion, Question } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

const QUESTIONS_FILE = path.join(process.cwd(), "src/data/db_questions.json");

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
    const validatedQuestions: Question[] = [];
    const timestamp = Date.now();

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
        id: `q_${timestamp}_${i}_${Math.random().toString(36).substr(2, 5)}`,
        question: q.question,
        options: q.options,
        answerIndex: q.answerIndex,
        category: q.category || "General Computer Science",
        difficulty: q.difficulty || "Medium",
        explanation: q.explanation || "",
        quizName: q.quizName || ""
      });
    }

    // 3. Read current, append new validated, and write back
    const currentQuestions = await getQuestions();
    const updatedPool = [...currentQuestions, ...validatedQuestions];
    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(updatedPool, null, 2), "utf-8");

    return NextResponse.json({
      message: `Successfully imported ${validatedQuestions.length} questions dynamically!`,
      importedCount: validatedQuestions.length,
      totalCount: updatedPool.length,
      questions: validatedQuestions
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
    if (!id) {
      return NextResponse.json({ error: "Missing question ID parameter" }, { status: 400 });
    }

    const currentQuestions = await getQuestions();
    const updatedPool = currentQuestions.filter(q => q.id !== id);
    
    if (currentQuestions.length === updatedPool.length) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    await fs.writeFile(QUESTIONS_FILE, JSON.stringify(updatedPool, null, 2), "utf-8");
    return NextResponse.json({ message: "Question successfully deleted from database", id });
  } catch (error) {
    console.error("DELETE /api/questions error:", error);
    return NextResponse.json({ error: "Failed to delete question" }, { status: 500 });
  }
}


