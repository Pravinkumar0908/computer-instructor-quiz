import { NextResponse } from "next/server";
import { getDashboardStats, addAttempt, Attempt } from "@/lib/db";

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/attempts error:", error);
    return NextResponse.json({ error: "Failed to fetch exam statistics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    const { score, totalQuestions, timeSpentSeconds, category, correctAnswersCount, quizName } = body;
    if (
      typeof score !== "number" || 
      typeof totalQuestions !== "number" || 
      typeof timeSpentSeconds !== "number" ||
      typeof correctAnswersCount !== "number" ||
      !category
    ) {
      return NextResponse.json({ error: "Invalid attempt data format" }, { status: 400 });
    }

    const payload: Omit<Attempt, "id" | "timestamp"> = {
      score,
      totalQuestions,
      timeSpentSeconds,
      category,
      correctAnswersCount,
      quizName: quizName || ""
    };

    await addAttempt(payload);
    
    // Return updated dashboard stats immediately for instant client synchronization
    const updatedStats = await getDashboardStats();
    return NextResponse.json(updatedStats, { status: 201 });
  } catch (error) {
    console.error("POST /api/attempts error:", error);
    return NextResponse.json({ error: "Failed to log exam attempt" }, { status: 500 });
  }
}
