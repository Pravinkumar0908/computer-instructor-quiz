"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { 
  BookOpenIcon, 
  TrophyIcon, 
  TimerIcon, 
  DashboardIcon, 
  PlusIcon, 
  CheckIcon, 
  XIcon, 
  ChevronRightIcon, 
  ChevronLeftIcon, 
  ChartIcon, 
  ClockIcon, 
  InfoIcon 
} from "@/components/Icons";

interface Question {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  explanation?: string;
}

interface Attempt {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  category: string;
  correctAnswersCount: number;
}

interface DashboardStats {
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

const CATEGORIES = [
  "Database Management System",
  "Computer Fundamentals & OS",
  "Data Structures & Algorithms",
  "Programming & Web Development",
  "Computer Networks & Security",
  "Software Engineering & SAD",
  "General Knowledge (GK)",
  "Quantitative Aptitude (Math)",
  "Logical Reasoning"
];

export default function ExamPrepPortal() {
  // Database States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout View State
  // "dashboard" | "instructions" | "mock" | "results" | "practice"
  const [view, setView] = useState<"dashboard" | "instructions" | "mock" | "results" | "practice">("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Subjects");

  // Pre-Exam Instructions Portal States
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [examLanguage, setExamLanguage] = useState<"dual" | "english" | "hindi">("dual");

  // General Study Room (Practice Mode)
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<(number | null)[]>([]);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);

  // Mock Simulator States (Testbook CBT Layout)
  const [mockQuestions, setMockQuestions] = useState<Question[]>([]);
  const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<(number | null)[]>([]);
  const [mockMarked, setMockMarked] = useState<boolean[]>([]);
  const [mockVisited, setMockVisited] = useState<boolean[]>([]);
  const [mockTimeLeft, setMockTimeLeft] = useState(600); // 10 mins default
  const [mockInitialTime, setMockInitialTime] = useState(600);
  const [mockActive, setMockActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile Navigator Sidebar

  // Interactive Tools Toggles
  const [showScratchpad, setShowScratchpad] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  // Calculator States
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");
  const [calcBase, setCalcBase] = useState<"DEC" | "BIN" | "HEX">("DEC");

  // Scratchpad Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#8b5cf6");
  const [drawWidth, setDrawWidth] = useState(3);

  // Cheat Sheet Active Tab
  const [cheatTab, setCheatTab] = useState<"DBMS" | "DSA" | "Programming" | "OS">("DBMS");

  // Last Test Result State
  const [lastAttempt, setLastAttempt] = useState<{
    score: number;
    total: number;
    correctCount: number;
    timeSpent: number;
    category: string;
    questions: Question[];
    answers: (number | null)[];
  } | null>(null);

  // Admin Question Creator Form States
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [formQuestion, setFormQuestion] = useState("");
  const [formOptions, setFormOptions] = useState<string[]>(["", "", "", ""]);
  const [formAnswerIndex, setFormAnswerIndex] = useState<number>(0);
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formDifficulty, setFormDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [formExplanation, setFormExplanation] = useState("");
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Unified Admin Tab & Bulk Importer States
  const [adminTab, setAdminTab] = useState<"manual" | "bulk">("manual");
  const [jsonInput, setJsonInput] = useState("");
  const [jsonStatus, setJsonStatus] = useState<"idle" | "success" | "error">("idle");
  const [jsonParsedCount, setJsonParsedCount] = useState(0);
  const [jsonErrorMsg, setJsonErrorMsg] = useState<string | null>(null);
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Premium AI Prompt Customizer States
  const [promptLanguage, setPromptLanguage] = useState<"dual" | "english" | "hindi">("dual");
  const [promptCount, setPromptCount] = useState<number>(15);
  const [promptDifficulty, setPromptDifficulty] = useState<"high" | "balanced">("high");
  const [promptNotes, setPromptNotes] = useState("");

  // Regex dynamic translation parser to filter Hindi vs English
  const filterQuestionText = (text: string, lang: "dual" | "english" | "hindi") => {
    if (lang === "dual" || !text) return text;
    
    // Find parenthesized blocks containing Devanagari script (Hindi characters range)
    const hindiRegex = /\(([^)]*[\u0900-\u097F][^)]*)\)/g;
    
    if (lang === "english") {
      // Strip parenthesized Hindi text
      let cleaned = text.replace(hindiRegex, "").trim();
      // Remove trailing brackets or dashes
      cleaned = cleaned.replace(/\s*-\s*$/, "").trim();
      return cleaned;
    }
    
    if (lang === "hindi") {
      // Return Devanagari text inside parentheses if found
      const match = text.match(/\(([^)]*[\u0900-\u097F][^)]*)\)/);
      if (match && match[1]) {
        return match[1].trim();
      }
      
      // Fallback: If no parentheses, return full text if it contains Hindi, or tell user translation is Bilingual
      const containsHindi = /[\u0900-\u097F]/.test(text);
      if (containsHindi) return text;
      return `${text} (अनुवाद उपलब्ध नहीं है)`;
    }
    return text;
  };

  // Compile the customized AI instructions dynamically
  const generateCustomPrompt = useMemo(() => {
    let langInstruction = "";
    if (promptLanguage === "dual") {
      langInstruction = "in BOTH English and Hindi (Dual Language format, e.g. 'Which protocol works at Transport layer? (ओएसआई मॉडल की ट्रांसपोर्ट लेयर पर कौन सा प्रोटोकॉल काम करता है?)' and options should also contain Hindi translations where applicable)";
    } else if (promptLanguage === "english") {
      langInstruction = "strictly in English language only";
    } else {
      langInstruction = "strictly in Hindi language only (हिंदी भाषा में)";
    }

    const difficultyText = promptDifficulty === "high" 
      ? "high difficulty level (कठिन स्तर) matching professional Rajasthan Computer Teacher / KVS PGT Computer Science / DSSSB exams. The questions must focus on deep conceptual understanding rather than simple factual trivia." 
      : "a balanced mix of Medium and Hard difficulty level questions suitable for general computer teacher assessments.";

    const notesSegment = promptNotes.trim()
      ? `\nCRITICAL SOURCE DATA:\nRead the following study notes and syllabus material carefully, and extract/generate the questions ONLY from this text. Ensure the terms are highly accurate as described in the notes:\n--- BEGIN NOTES ---\n${promptNotes.trim()}\n--- END NOTES ---\n`
      : "\nSUBJECT COVERAGE:\nFocus heavily on core Computer Science subjects: Database Management Systems (DBMS), Operating Systems (OS), Data Structures & Algorithms (DSA), Programming Concepts (C++, Java, Web Technologies), Computer Networks & Cyber Security, and Software Engineering & SAD.\n";

    return `Generate exactly ${promptCount} technical Multiple-Choice Questions (MCQ) for a Computer Instructor (कम्प्यूटर अनुदेशक) examination.

LANGUAGE REQUIREMENT:
Generate the questions ${langInstruction}.

DIFFICULTY LEVEL:
Create questions of ${difficultyText}

MIX AND SHUFFLE RULE:
Mix up the questions randomly across all different subjects. DO NOT group questions by topic or subject. Interleave DBMS, DSA, networks, OS, and programming questions arbitrarily to simulate a real, high-pressure exam simulator (real exam feel).

${notesSegment}

Return ONLY a valid, raw JSON array (NO markdown formatting, NO \`\`\`json wrappers, NO additional text) inside this exact structure:
[
  {
    "question": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "category": "One of: Database Management System, Computer Fundamentals & OS, Data Structures & Algorithms, Programming & Web Development, Computer Networks & Security, Software Engineering & SAD, General Knowledge (GK), Quantitative Aptitude (Math), Logical Reasoning",
    "difficulty": "Easy or Medium or Hard",
    "explanation": "Provide a comprehensive, high-quality explanation in dual languages (English & Hindi) describing why the selected choice is correct."
  }
]`;
  }, [promptLanguage, promptCount, promptDifficulty, promptNotes]);

  // Real-time JSON paste validator
  const validatePastedJson = (value: string) => {
    setJsonInput(value);
    if (!value.trim()) {
      setJsonStatus("idle");
      setJsonParsedCount(0);
      setJsonErrorMsg(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      let items: any[] = [];
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        items = parsed.questions;
      } else if (parsed && typeof parsed === "object") {
        items = [parsed];
      }

      if (items.length === 0) {
        setJsonStatus("error");
        setJsonErrorMsg("No questions array or object structure found in the JSON.");
        setJsonParsedCount(0);
        return;
      }

      const isValid = items.every((item) => {
        return (
          item &&
          typeof item.question === "string" &&
          Array.isArray(item.options) &&
          item.options.length >= 2 &&
          typeof item.answerIndex === "number"
        );
      });

      if (!isValid) {
        setJsonStatus("error");
        setJsonErrorMsg("Some items are missing required fields ('question' string, 'options' string array, or 'answerIndex' number).");
        setJsonParsedCount(0);
      } else {
        setJsonStatus("success");
        setJsonParsedCount(items.length);
        setJsonErrorMsg(null);
      }
    } catch (err: any) {
      setJsonStatus("error");
      setJsonErrorMsg("Invalid JSON formatting. Check for missing quotes, brackets, or commas.");
      setJsonParsedCount(0);
    }
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonStatus !== "success" || !jsonInput.trim()) {
      alert("Please paste a valid JSON block first.");
      return;
    }

    setIsImportingBulk(true);
    setBulkSuccessMsg(null);

    try {
      const parsedData = JSON.parse(jsonInput);
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import questions to database server.");
      }

      const resJson = await response.json();
      setBulkSuccessMsg(`🎉 Successfully imported ${resJson.importedCount} questions dynamically to the Live Database!`);
      setJsonInput("");
      setJsonStatus("idle");
      setJsonParsedCount(0);

      await loadData();
      
      setTimeout(() => setBulkSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || "An error occurred during bulk import.");
    } finally {
      setIsImportingBulk(false);
    }
  };

  // Fetch initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const qRes = await fetch("/api/questions");
      if (!qRes.ok) throw new Error("Failed to load questions pool");
      const questionsData = await qRes.json();
      setQuestions(questionsData);

      const sRes = await fetch("/api/attempts");
      if (!sRes.ok) throw new Error("Failed to load dashboard metrics");
      const statsData = await sRes.json();
      setStats(statsData);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong while loading portal data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer effect for live mock test
  useEffect(() => {
    if (!mockActive || view !== "mock") return;
    if (mockTimeLeft <= 0) {
      handleMockSubmit();
      return;
    }

    const interval = setInterval(() => {
      setMockTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [mockActive, mockTimeLeft, view]);

  // Expose active visited question status tracker
  useEffect(() => {
    if (view === "mock" && mockQuestions.length > 0) {
      setMockVisited((prev) => {
        const copy = [...prev];
        copy[mockIndex] = true;
        return copy;
      });
    }
  }, [mockIndex, view, mockQuestions]);

  // Format seconds to MM:SS
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // Format ISO Date
  const formatDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Recently";
    }
  };

  // Launch Practice Session
  const startPractice = (category: string) => {
    setSelectedCategory(category);
    const filtered = category === "All Subjects" 
      ? questions 
      : questions.filter(q => q.category === category);
      
    if (filtered.length === 0) {
      alert(`No questions added yet for ${category}. Feel free to add some using the creator tool below!`);
      return;
    }

    setPracticeQuestions(filtered);
    setPracticeIndex(0);
    setPracticeAnswers(filtered.map(() => null));
    setPracticeSubmitted(false);
    setView("practice");
  };

  const selectPracticeOption = (optIndex: number) => {
    setPracticeAnswers(prev => {
      const copy = [...prev];
      copy[practiceIndex] = optIndex;
      return copy;
    });
  };

  const handlePracticeSubmit = async () => {
    setPracticeSubmitted(true);
    let correctCount = 0;
    practiceQuestions.forEach((q, idx) => {
      if (practiceAnswers[idx] === q.answerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = practiceQuestions.length > 0 
      ? Math.round((correctCount / practiceQuestions.length) * 100) 
      : 0;

    setLastAttempt({
      score: scorePercentage,
      total: practiceQuestions.length,
      correctCount,
      timeSpent: 0,
      category: selectedCategory,
      questions: practiceQuestions,
      answers: practiceAnswers
    });

    setView("results");

    // Save dynamically to backend
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scorePercentage,
          totalQuestions: practiceQuestions.length,
          timeSpentSeconds: 0,
          category: selectedCategory,
          correctAnswersCount: correctCount
        })
      });

      if (response.ok) {
        const freshStats = await response.json();
        setStats(freshStats);
      }
    } catch (err) {
      console.error("Failed to sync attempt", err);
    }
  };

  // Transition to TCS iON Instructions Page
  const transitionToInstructions = (category: string) => {
    setSelectedCategory(category);
    const filtered = category === "All Subjects"
      ? questions
      : questions.filter(q => q.category === category);

    if (filtered.length === 0) {
      alert(`No questions found for ${category}. Add questions to simulate a mock exam.`);
      return;
    }

    setDisclaimerChecked(false);
    setView("instructions");
  };

  // Launch Mock Test (TCS iON CBT Layout)
  const startMockTest = () => {
    const filtered = selectedCategory === "All Subjects"
      ? questions
      : questions.filter(q => q.category === selectedCategory);

    // Limit to maximum 10 random questions, mixed/shuffled for authentic exam feel
    const randomized = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 10);
    setMockQuestions(randomized);
    setMockIndex(0);
    setMockAnswers(randomized.map(() => null));
    setMockMarked(randomized.map(() => false));
    setMockVisited(randomized.map((_, idx) => idx === 0)); // Initialize unvisited array
    
    const calculatedTime = randomized.length * 60; // 60 seconds per question
    setMockTimeLeft(calculatedTime);
    setMockInitialTime(calculatedTime);
    setMockActive(true);
    setView("mock");
  };

  const selectMockOption = (optIndex: number) => {
    setMockAnswers(prev => {
      const copy = [...prev];
      copy[mockIndex] = optIndex;
      return copy;
    });
  };

  const toggleMockMarkForReview = () => {
    setMockMarked(prev => {
      const copy = [...prev];
      copy[mockIndex] = !copy[mockIndex];
      return copy;
    });
    // Hops forward dynamically
    if (mockIndex < mockQuestions.length - 1) {
      setMockIndex(prev => prev + 1);
    }
  };

  const saveAndNextMock = () => {
    // Advance index
    if (mockIndex < mockQuestions.length - 1) {
      setMockIndex(prev => prev + 1);
    }
  };

  const clearMockResponse = () => {
    setMockAnswers(prev => {
      const copy = [...prev];
      copy[mockIndex] = null;
      return copy;
    });
  };

  // Submit Mock Exam to Backend
  const handleMockSubmit = async () => {
    setMockActive(false);
    
    // Evaluate Score incorporating standard 1/3 negative markings
    let correctCount = 0;
    let incorrectCount = 0;

    mockQuestions.forEach((q, idx) => {
      const userAns = mockAnswers[idx];
      if (userAns !== null) {
        if (userAns === q.answerIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    });

    // Score = correct - (incorrect * 0.33)
    const rawScore = correctCount - (incorrectCount * 0.33);
    const scorePercentage = mockQuestions.length > 0 
      ? Math.max(0, Math.round((rawScore / mockQuestions.length) * 100))
      : 0;

    const timeSpent = mockInitialTime - mockTimeLeft;

    setLastAttempt({
      score: scorePercentage, // calculated dynamically with negative markings
      total: mockQuestions.length,
      correctCount,
      timeSpent,
      category: selectedCategory,
      questions: mockQuestions,
      answers: mockAnswers
    });

    setView("results");

    // Save dynamic attempt to backend Database
    try {
      const response = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          score: scorePercentage,
          totalQuestions: mockQuestions.length,
          timeSpentSeconds: timeSpent,
          category: selectedCategory,
          correctAnswersCount: correctCount
        })
      });

      if (response.ok) {
        const freshStats = await response.json();
        setStats(freshStats);
      }
    } catch (err) {
      console.error("Failed to sync attempt to backend database", err);
    }
  };

  // Dynamic Question Creator Submission
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuestion.trim() || formOptions.some(o => !o.trim())) {
      alert("Please fill in the question and all 4 options.");
      return;
    }

    setIsAddingQuestion(true);
    setFormSuccessMessage(null);

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formQuestion,
          options: formOptions,
          answerIndex: formAnswerIndex,
          category: formCategory,
          difficulty: formDifficulty,
          explanation: formExplanation
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add question to database server.");
      }

      setFormSuccessMessage("🎉 Question successfully saved to Database!");
      setFormQuestion("");
      setFormOptions(["", "", "", ""]);
      setFormAnswerIndex(0);
      setFormExplanation("");

      await loadData();
      
      setTimeout(() => setFormSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "An error occurred while creating question.");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    setFormOptions(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this question?")) return;
    try {
      const response = await fetch(`/api/questions?id=${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete question from database.");
      }
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete question.");
    }
  };

  // Dynamic active categories derived from questions present in database
  const activeCategories = useMemo(() => {
    const catsSet = new Set<string>();
    questions.forEach(q => {
      if (q.category) catsSet.add(q.category);
    });
    return Array.from(catsSet);
  }, [questions]);

  // Stats computation helper (fallback if stats null)
  const dashboardStats = useMemo(() => {
    if (stats) return stats;
    
    const totalQ = questions.length;
    return {
      totalQuestions: totalQ,
      totalAttempts: 0,
      averageAccuracy: 0,
      categoryStats: {},
      recentAttempts: []
    };
  }, [stats, questions]);

  // Canvas Drawing Handlers for Scratchpad
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Calculator Logic Handlers
  const handleCalcBtn = (val: string) => {
    if (val === "C") {
      setCalcInput("");
      setCalcResult("");
    } else if (val === "=") {
      try {
        const sanitized = calcInput.replace(/[^0-9+\-*/().]/g, "");
        const evalResult = Function(`"use strict"; return (${sanitized})`)();
        setCalcResult(evalResult.toString());
      } catch {
        setCalcResult("Error");
      }
    } else if (val === "BIN") {
      try {
        const num = parseInt(calcResult || calcInput);
        if (isNaN(num)) throw new Error();
        setCalcResult(num.toString(2));
        setCalcBase("BIN");
      } catch {
        setCalcResult("Error");
      }
    } else if (val === "HEX") {
      try {
        const num = parseInt(calcResult || calcInput);
        if (isNaN(num)) throw new Error();
        setCalcResult(num.toString(16).toUpperCase());
        setCalcBase("HEX");
      } catch {
        setCalcResult("Error");
      }
    } else if (val === "DEC") {
      setCalcBase("DEC");
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  // Calculator helper keys mapping
  const calcBtns = ["DEC", "BIN", "HEX", "C", "(", ")", "/", "*", "7", "8", "9", "-", "4", "5", "6", "+", "1", "2", "3", "="];

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 overflow-hidden flex flex-col font-sans">
      
      {/* Background Glowing Spots */}
      <div className="glow-spot-indigo top-[-100px] left-[-50px] animate-pulse-slow"></div>
      <div className="glow-spot-emerald bottom-[-150px] right-[-50px] animate-pulse-slow"></div>
      <div className="glow-spot-rose top-[30%] right-[10%] opacity-40 animate-pulse-slow"></div>

      {/* Main Header */}
      <nav className="glass sticky top-0 z-40 border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setView("dashboard")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl font-bold text-white">TCS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Govt Exam CBT Suite
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold leading-none mt-0.5">
                TCS iON & Testbook Simulator
              </p>
            </div>
          </div>

          {/* Quick study aids drawer toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScratchpad(!showScratchpad)}
              className={`rounded-full text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                showScratchpad ? "bg-indigo-600/30 border-indigo-500 text-indigo-200" : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              📝 Draft
            </button>
            <button
              onClick={() => setShowCheatSheet(!showCheatSheet)}
              className={`rounded-full text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                showCheatSheet ? "bg-indigo-600/30 border-indigo-500 text-indigo-200" : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Notes
            </button>
            <button
              onClick={() => setShowCalculator(!showCalculator)}
              className={`rounded-full text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                showCalculator ? "bg-indigo-600/30 border-indigo-500 text-indigo-200" : "bg-slate-900 border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              🧮 Calc
            </button>
            
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="hidden sm:flex rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold px-4 py-2 items-center gap-1 border border-white/10 transition-all cursor-pointer"
            >
              <PlusIcon size={14} className="text-indigo-400" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative z-10">
        
        {/* Dynamic Admin Question Creator Panel (Manual vs AI Importer Tabs) */}
        {showAdminPanel && (
          <div className="mb-8 glass-premium p-6 md:p-8 rounded-3xl animate-fade-in border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>
            
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/10">
                <PlusIcon size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Database Management & AI Compiler</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  डेटाबेस में नए कंप्यूटर अनुदेशक प्रश्नों को जोड़ें (मैनुअल या बल्क AI JSON आयात द्वारा)
                </p>
              </div>
            </div>

            {/* Tab Toggles */}
            <div className="flex border-b border-white/5 mb-6 gap-2">
              <button
                onClick={() => setAdminTab("manual")}
                className={`py-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                  adminTab === "manual" ? "text-indigo-400 font-extrabold border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Single Question Wizard (मैनुअल जोड़ें)
              </button>
              <button
                onClick={() => setAdminTab("bulk")}
                className={`py-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  adminTab === "bulk" ? "text-indigo-400 font-extrabold border-b-2 border-indigo-500" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping"></span>
                <span>AI Bulk JSON Importer (बल्क आयातक)</span>
              </button>
            </div>

            {/* Tab Content 1: Manual Wizard Form */}
            {adminTab === "manual" && (
              <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Question Text (English + Hindi recommended)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="e.g. What is the complexity of Binary Search? (बाइनरी सर्च की जटिलता क्या है?)"
                    className="w-full rounded-xl p-3 text-sm glass-input text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formOptions.map((option, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Option {idx + 1}
                      </label>
                      <input
                        type="text"
                        required
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Enter option ${idx + 1}`}
                        className="w-full rounded-xl p-3 text-sm glass-input text-white outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Correct Option Index
                    </label>
                    <select
                      value={formAnswerIndex}
                      onChange={(e) => setFormAnswerIndex(parseInt(e.target.value))}
                      className="w-full rounded-xl p-3 text-sm bg-slate-900 border border-white/10 text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={0}>Option 1 (पहला विकल्प)</option>
                      <option value={1}>Option 2 (दूसरा विकल्प)</option>
                      <option value={2}>Option 3 (तीसरा विकल्प)</option>
                      <option value={3}>Option 4 (चौथा विकल्प)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Syllabus Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-xl p-3 text-sm bg-slate-900 border border-white/10 text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="w-full rounded-xl p-3 text-sm bg-slate-900 border border-white/10 text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Easy">Easy (आसान)</option>
                      <option value="Medium">Medium (सामान्य)</option>
                      <option value="Hard">Hard (कठिन)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Detailed Explanation (Hindi/English)
                  </label>
                  <textarea
                    rows={2}
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    placeholder="Explain why this choice is correct..."
                    className="w-full rounded-xl p-3 text-sm glass-input text-white outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {formSuccessMessage ? (
                    <span className="text-sm font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-500/20 animate-pulse">
                      <CheckIcon size={16} />
                      {formSuccessMessage}
                    </span>
                  ) : (
                    <span></span>
                  )}

                  <button
                    type="submit"
                    disabled={isAddingQuestion}
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm font-semibold px-6 py-2.5 shadow-lg shadow-indigo-500/25 transition-all text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingQuestion ? "Saving..." : "Add to Database"}
                  </button>
                </div>
              </form>
            )}

            {/* Tab Content 2: Bulk AI JSON Importer */}
            {adminTab === "bulk" && (
              <form onSubmit={handleBulkImportSubmit} className="space-y-5 animate-fade-in">
                
                {/* Premium AI Command Center & Prompt Customizer Dashboard */}
                <div className="rounded-2xl bg-indigo-950/15 border border-indigo-500/10 p-5 md:p-6 space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">
                      AI Command Center & Prompt Builder (प्रॉम्प्ट जनरेटर)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Left: Customizer Filters */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Language (भाषा)
                          </label>
                          <select
                            value={promptLanguage}
                            onChange={(e) => setPromptLanguage(e.target.value as any)}
                            className="w-full rounded-xl p-2.5 text-xs bg-slate-900 border border-white/5 text-white outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="dual">Dual (हिन्दी + Eng)</option>
                            <option value="english">Strictly English</option>
                            <option value="hindi">Strictly Hindi</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Question Size
                          </label>
                          <select
                            value={promptCount}
                            onChange={(e) => setPromptCount(parseInt(e.target.value))}
                            className="w-full rounded-xl p-2.5 text-xs bg-slate-900 border border-white/5 text-white outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                            <option value={20}>20 Questions</option>
                            <option value={30}>30 Questions</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Paper Level
                          </label>
                          <select
                            value={promptDifficulty}
                            onChange={(e) => setPromptDifficulty(e.target.value as any)}
                            className="w-full rounded-xl p-2.5 text-xs bg-slate-900 border border-white/5 text-white outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="high">High / Hard Level</option>
                            <option value="balanced">Balanced Mix</option>
                          </select>
                        </div>

                      </div>

                      <div className="text-[10px] text-slate-400 space-y-1 bg-slate-900/50 p-3 rounded-xl border border-white/5">
                        <p className="flex items-center gap-1.5">
                          <CheckIcon size={10} className="text-emerald-400" />
                          <span>Strictly shuffles and mixes subjects for real exam simulations.</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <CheckIcon size={10} className="text-emerald-400" />
                          <span>Asks the AI to write rich, bilingual explanations.</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Notes Paster */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                        <span>Optional: Paste Study Notes / Syllabus Page here</span>
                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">EXTRACTOR ACTIVE</span>
                      </label>
                      <textarea
                        rows={3}
                        value={promptNotes}
                        onChange={(e) => setPromptNotes(e.target.value)}
                        placeholder="Paste text from your study notes or computer science textbook... The AI will extract premium questions directly from your content!"
                        className="w-full rounded-xl p-3 text-xs glass-input text-slate-300 placeholder-slate-600 outline-none"
                      />
                    </div>

                  </div>

                  {/* Actions & Preview Collapsible */}
                  <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[10px] text-slate-400 text-center sm:text-left">
                      💡 Click below to copy the compiled prompt, then paste it into **Gemini** or **ChatGPT**!
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <details className="group w-full sm:w-auto">
                        <summary className="rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-semibold py-2 px-3 transition-all cursor-pointer text-center list-none outline-none">
                          Preview Prompt Structure
                        </summary>
                        <div className="absolute left-6 right-6 mt-2 max-h-48 overflow-y-auto glass p-4 rounded-xl text-[10px] font-mono text-slate-400 whitespace-pre-wrap select-all border border-white/10 shadow-2xl z-30">
                          {generateCustomPrompt}
                        </div>
                      </details>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generateCustomPrompt);
                          alert("📋 Customized AI Prompt Copied! Paste it directly into Gemini or ChatGPT.");
                        }}
                        className="flex-1 sm:flex-initial rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold py-2 px-4 text-white cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                      >
                        <BookOpenIcon size={12} />
                        <span>Copy Customized AI Prompt</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Textarea container */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Paste JSON Questions Block (यहाँ अपना JSON पेस्ट करें)
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => validatePastedJson(e.target.value)}
                    placeholder={`Paste JSON here...\nExample structure:\n[\n  {\n    "question": "What is the size of IPv6? (IPv6 का साइज क्या है?)",\n    "options": ["32 bits", "64 bits", "128 bits", "256 bits"],\n    "answerIndex": 2,\n    "category": "Computer Networks & Security",\n    "difficulty": "Easy",\n    "explanation": "IPv6 addresses are 128-bits long."\n  }\n]`}
                    className="w-full rounded-2xl p-4 text-xs font-mono bg-slate-950/60 border border-white/10 text-slate-300 placeholder-slate-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Validation Status Rows */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  
                  {/* Dynamic Status Badge */}
                  <div>
                    {jsonStatus === "idle" && (
                      <span className="text-xs font-semibold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
                        ⚪ Waiting for JSON input (इनपुट की प्रतीक्षा है)
                      </span>
                    )}
                    {jsonStatus === "error" && (
                      <div className="text-xs font-semibold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20 max-w-lg leading-relaxed">
                        ⚠️ <strong>Parsing Error:</strong> {jsonErrorMsg}
                      </div>
                    )}
                    {jsonStatus === "success" && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1 animate-pulse">
                        <CheckIcon size={14} />
                        <span>Validated: Ready to inject {jsonParsedCount} Computer Science questions!</span>
                      </span>
                    )}
                  </div>

                  {/* Submit and message */}
                  <div className="flex items-center gap-3">
                    {bulkSuccessMsg && (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                        {bulkSuccessMsg}
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isImportingBulk || jsonStatus !== "success"}
                      className="rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold px-6 py-3 shadow-lg shadow-indigo-500/25 transition-all text-white cursor-pointer"
                    >
                      {isImportingBulk ? "Injecting into Server DB..." : `Inject ${jsonParsedCount} Questions to Database`}
                    </button>
                  </div>

                </div>

              </form>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: HERO DASHBOARD HUB */}
        {/* ========================================================================= */}
        {view === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Header Hero Banner */}
            <div className="glass-premium rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="space-y-3 max-w-2xl text-center md:text-left">
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-semibold tracking-wider text-indigo-300 uppercase">
                  Rajasthan, DSSSB & KVS Computer Instructor Syllabus
                </span>
                <h2 className="text-3xl font-extrabold md:text-4xl text-white tracking-tight leading-tight">
                  कम्प्यूटर अनुदेशक <br className="hidden sm:inline" /> 
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
                    CBT परीक्षा तैयारी पोर्टल
                  </span>
                </h2>
                <p className="text-sm text-slate-300 max-w-xl">
                  असीमित प्रैक्टिस सेशन और आधिकारिक स्तर के समय-बद्ध मॉक टेस्ट के साथ अपने कंप्यूटर विज्ञान कौशल को सुधारें। आपका डेटा 100% डायनेमिक है।
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => startPractice("All Subjects")}
                  className="rounded-full bg-slate-800 hover:bg-slate-700 text-sm font-semibold py-3 px-6 border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/30"
                >
                  <BookOpenIcon size={18} className="text-indigo-400" />
                  <span>Start Practice Session</span>
                </button>
                <button
                  onClick={() => transitionToInstructions("All Subjects")}
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2 text-white cursor-pointer shadow-lg shadow-indigo-500/25"
                >
                  <TimerIcon size={18} />
                  <span>Launch CBT Simulation</span>
                </button>
              </div>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BookOpenIcon size={48} className="text-indigo-400" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total CS Questions</p>
                <p className="text-3xl font-extrabold mt-2 text-white">{dashboardStats.totalQuestions}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-400">
                  <span>Dynamic server database active</span>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrophyIcon size={48} className="text-purple-400" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed Simulations</p>
                <p className="text-3xl font-extrabold mt-2 text-white">{dashboardStats.totalAttempts}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-400">
                  <span>Attempts logged dynamically</span>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <ChartIcon size={48} className="text-emerald-400" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Average Accuracy</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-extrabold text-white">{dashboardStats.averageAccuracy}%</p>
                </div>
                <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5">
                  <div 
                    className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${dashboardStats.averageAccuracy}%` }}
                  ></div>
                </div>
              </div>

              <div className="glass rounded-3xl p-6 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TimerIcon size={48} className="text-amber-400" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Preparation Progress</p>
                <p className="text-3xl font-extrabold mt-2 text-white">
                  {Math.min(100, Math.round((dashboardStats.totalQuestions / 40) * 100))}%
                </p>
                <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
                  <span>Goal: 40+ Core Questions</span>
                </div>
              </div>

            </div>

            {/* Main Content Grid: Categories & History */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-8">
              
              {/* Subject Categorized Grids (100% Dynamically Detected categories!) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Syllabus Subject Modules (विषय मॉड्यूल)
                  </h3>
                  <span className="text-xs text-slate-400">Select any subject to practice</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeCategories.length === 0 ? (
                    <div className="col-span-1 sm:col-span-2 glass rounded-3xl p-8 text-center border border-dashed border-indigo-500/20 bg-indigo-950/5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl"></div>
                      <BookOpenIcon size={44} className="mx-auto text-indigo-400/60 mb-3 animate-float" />
                      <h4 className="text-base font-bold text-white mb-2">डेटाबेस खाली है (Database is Empty)</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        कम्प्यूटर अनुदेशक के लिए अभी तक कोई प्रश्न लोड नहीं किया गया है। प्रश्न जोड़ने के लिए ऊपर <strong>Add Question</strong> बटन पर क्लिक करें और AI से जनरेटेड JSON इनपुट करें!
                      </p>
                    </div>
                  ) : (
                    activeCategories.map((cat, idx) => {
                      const catStat = dashboardStats.categoryStats[cat] || { questionCount: 0, solvedCount: 0, accuracy: 0 };
                      
                      // Dynamic gradient styling borders based on card indices
                      const borderGlows = [
                        "hover:border-indigo-500/30",
                        "hover:border-purple-500/30",
                        "hover:border-emerald-500/30",
                        "hover:border-amber-500/30",
                        "hover:border-rose-500/30",
                        "hover:border-cyan-500/30"
                      ];
                      const borderGlow = borderGlows[idx % borderGlows.length];

                      return (
                        <div 
                          key={cat}
                          className={`glass rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between border border-white/5 ${borderGlow}`}
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md">
                                Dynamic Category
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                {catStat.questionCount} Questions
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-bold text-white mt-3 group-hover:text-indigo-300 transition-colors">
                              {cat}
                            </h4>
                            
                            {/* Accuracy Tracker if attempted */}
                            {catStat.solvedCount > 0 && (
                              <div className="mt-3 space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-slate-400">
                                  <span>Subject Accuracy</span>
                                  <span className="font-semibold text-emerald-400">{catStat.accuracy}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1">
                                  <div 
                                    className="bg-emerald-400 h-1 rounded-full"
                                    style={{ width: `${catStat.accuracy}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-6">
                            <button
                              onClick={() => startPractice(cat)}
                              className="flex-1 rounded-full bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-semibold py-2 px-3 border border-white/5 transition-all cursor-pointer text-slate-300 text-center"
                            >
                              Study Deck
                            </button>
                            <button
                              onClick={() => transitionToInstructions(cat)}
                              className="rounded-full bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold p-2 border border-indigo-500/20 transition-all cursor-pointer flex items-center justify-center"
                              title="Start Mock Exam"
                            >
                              <TimerIcon size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Sidebar Recent Attempts */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ClockIcon size={18} className="text-indigo-400" />
                  Recent Mock Logs (हाल के प्रयास)
                </h3>

                {dashboardStats.recentAttempts.length === 0 ? (
                  <div className="glass rounded-3xl p-8 text-center text-slate-500 border border-dashed border-white/10">
                    <TrophyIcon size={40} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-sm font-medium">No tests simulated yet</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Start a mock simulator test to log your scores.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats.recentAttempts.map((attempt) => {
                      const isGood = attempt.score >= 70;
                      return (
                        <div 
                          key={attempt.id}
                          className="glass rounded-2xl p-4 flex items-center justify-between border-l-2 hover:border-white/20 transition-colors"
                          style={{ borderLeftColor: isGood ? "#10b981" : "#f43f5e" }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-white truncate max-w-[180px]">
                              {attempt.category}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatDate(attempt.timestamp)} • {attempt.timeSpentSeconds > 0 ? `${Math.round(attempt.timeSpentSeconds / 60)}m spent` : "Practice Mode"}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className={`text-base font-bold ${isGood ? "text-emerald-400" : "text-rose-400"}`}>
                              {attempt.score}%
                            </span>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                              {attempt.correctAnswersCount}/{attempt.totalQuestions} Right
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Active Question Library Section */}
            <div className="pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Active Question Database (सक्रिय प्रश्न डेटाबेस)
                </h3>
                <span className="text-xs text-slate-400 font-semibold bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                  {questions.length} Active Questions
                </span>
              </div>

              {questions.length === 0 ? (
                <div className="glass rounded-3xl p-10 text-center border border-dashed border-white/10 text-slate-500">
                  <BookOpenIcon size={40} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-sm font-semibold">No custom questions in database.</p>
                  <p className="text-xs text-slate-600 mt-1">
                    Use the compiler tabs above to add manual questions or paste AI generated question lists!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {questions.map((q, idx) => (
                    <div 
                      key={q.id}
                      className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {q.category}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                              q.difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              q.difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                              "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            }`}>
                              {q.difficulty}
                            </span>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                              title="Delete Question"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-white leading-relaxed mt-3">
                          {idx + 1}. {q.question}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                        <span>{q.options.length} options</span>
                        <span className="text-emerald-400 font-semibold">
                          Ans: {String.fromCharCode(65 + q.answerIndex)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1.5: TCS iON PRE-EXAM INSTRUCTIONS PORTAL */}
        {/* ========================================================================= */}
        {view === "instructions" && (
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            
            {/* Nav Back Header */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setView("dashboard")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeftIcon size={16} />
                <span>Exit Exam Portal</span>
              </button>
              
              <span className="text-xs font-bold text-slate-400 bg-slate-900 border border-white/10 px-3 py-1 rounded-full">
                Test Room: {selectedCategory}
              </span>
            </div>

            {/* Split Page Instructions layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
              
              {/* Left Column: Official CBT Instructions */}
              <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                
                <div>
                  <h2 className="text-xl font-extrabold text-white">परीक्षा निर्देश (Candidate Exam Instructions)</h2>
                  <p className="text-xs text-slate-400 mt-1">Please read the following instructions carefully before starting the exam.</p>
                </div>

                {/* Instructions Text list */}
                <div className="space-y-4 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-300">1. General Instructions (सामान्य निर्देश):</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                      <li>The total duration of this examination is 10 minutes (600 seconds).</li>
                      <li>The clock will be set at the server. The countdown timer at the top of screen will show remaining time.</li>
                      <li>This examination consists of 10 Multiple-Choice Questions.</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-300">2. Evaluation & Negative Marking (मूल्यांकन और नकारात्मक अंकन):</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                      <li>Each correct answer will award <strong className="text-emerald-400">+1.00 mark</strong>.</li>
                      <li>Each incorrect answer will attract a penalty of <strong className="text-rose-400">-0.33 marks</strong> (1/3 negative marking).</li>
                      <li>Unanswered/skipped questions will receive <strong className="text-slate-400">0.00 marks</strong>.</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-300">3. Navigation Symbols Legend (नेविगेशन प्रतीक):</h4>
                    <p className="text-slate-400 mb-2">You can see the following colored symbols in your sidebar matrix panel:</p>
                    <div className="grid grid-cols-2 gap-2 pl-2 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">1</span>
                        <span>Answered (हल किया गया)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold">2</span>
                        <span>Marked for Review (समीक्षा के लिए)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center text-[9px] font-bold">3</span>
                        <span>Not Answered (प्रयास नहीं किया)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-slate-900 border border-white/10 text-slate-400 flex items-center justify-center text-[9px] font-bold">4</span>
                        <span>Not Visited (अभी तक नहीं देखा)</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Default Language Selector Form */}
                <div className="pt-4 border-t border-white/5 space-y-2">
                  <label className="block text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    Choose Your Default Exam Viewing Language (परीक्षा की भाषा चुनें):
                  </label>
                  <select
                    value={examLanguage}
                    onChange={(e) => setExamLanguage(e.target.value as any)}
                    className="w-full sm:w-64 rounded-xl p-3 text-xs bg-slate-900 border border-white/10 text-white outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="dual">Bilingual (Hindi + English दोनों)</option>
                    <option value="english">Strictly English (केवल अंग्रेजी)</option>
                    <option value="hindi">Strictly Hindi (केवल हिंदी)</option>
                  </select>
                  <p className="text-[10px] text-slate-500">Note: You can read the questions in your chosen language during the simulator.</p>
                </div>

              </div>

              {/* Right Column: Candidate Profile Box */}
              <div className="glass rounded-3xl p-6 border border-white/5 space-y-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-lg pointer-events-none"></div>
                
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-white/5 pb-3">
                  Candidate Dashboard
                </h3>

                {/* Initial Silhouette Profile photo */}
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
                  <span className="text-3xl font-bold text-white font-mono">PK</span>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 animate-ping"></div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Candidate Name:</p>
                  <p className="text-sm font-bold text-white tracking-tight">pravinkumarverma</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Roll Number:</p>
                  <p className="text-xs font-mono font-bold text-slate-300 tracking-wider">202605290035</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Exam Subject:</p>
                  <p className="text-xs font-bold text-indigo-300">{selectedCategory}</p>
                </div>

                <div className="pt-3 border-t border-white/5 text-[10px] text-slate-500">
                  <p>System Terminal: Term-01</p>
                  <p>Server Connection: Connected (🟢)</p>
                </div>

              </div>

            </div>

            {/* Bottom Disclaimer Checklist bar */}
            <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <label className="flex items-start gap-3 cursor-pointer select-none max-w-2xl">
                <input
                  type="checkbox"
                  checked={disclaimerChecked}
                  onChange={(e) => setDisclaimerChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-300 leading-normal font-semibold">
                  मैंने निर्देशों को पढ़ और समझ लिया है। मैं घोषणा करता हूँ कि मेरे पास कोई मोबाइल या वर्जित उपकरण नहीं है। मैं सभी नियमों का पालन करने के लिए सहमत हूँ। (I have read and understood the instructions and agree to comply with them).
                </span>
              </label>

              <button
                onClick={startMockTest}
                disabled={!disclaimerChecked}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-extrabold px-8 py-3 text-white shadow-lg shadow-indigo-600/10 transition-all cursor-pointer whitespace-nowrap"
              >
                I am ready to begin (परीक्षा शुरू करें)
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: INTERACTIVE PRACTICE / STUDY ROOM */}
        {/* ========================================================================= */}
        {view === "practice" && practiceQuestions.length > 0 && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            
            {/* Header navigator */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setView("dashboard")}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeftIcon size={16} />
                <span>Quit Practice Room</span>
              </button>
              
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider bg-slate-800 px-3 py-1 rounded-full border border-white/5">
                {selectedCategory} (Practice Mode)
              </span>
            </div>

            {/* Main Question Card */}
            <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-indigo-400">
                  QUESTION {practiceIndex + 1} OF {practiceQuestions.length}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  practiceQuestions[practiceIndex].difficulty === "Easy" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  practiceQuestions[practiceIndex].difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {practiceQuestions[practiceIndex].difficulty}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white leading-relaxed">
                {practiceQuestions[practiceIndex].question}
              </h2>

              {/* Options Grid (Practice Mode) */}
              <div className="grid gap-3 pt-2">
                {practiceQuestions[practiceIndex].options.map((option, optIdx) => {
                  const isSelected = practiceAnswers[practiceIndex] === optIdx;
                  
                  return (
                    <button
                      key={optIdx}
                      onClick={() => selectPracticeOption(optIdx)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        isSelected 
                          ? "border-indigo-500 bg-indigo-500/15 text-indigo-200" 
                          : "border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20 hover:bg-slate-900/60"
                      }`}
                    >
                      <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400"
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Navigation Bar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => setPracticeIndex(prev => Math.max(0, prev - 1))}
                disabled={practiceIndex === 0}
                className="rounded-full border border-white/10 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-5 py-2.5 flex items-center gap-1 transition-all text-slate-300 cursor-pointer"
              >
                <ChevronLeftIcon size={14} />
                <span>Previous</span>
              </button>

              <button
                onClick={handlePracticeSubmit}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-6 py-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Submit Practice Exam
              </button>

              <button
                onClick={() => {
                  if (practiceIndex < practiceQuestions.length - 1) {
                    setPracticeIndex(prev => prev + 1);
                  }
                }}
                disabled={practiceIndex === practiceQuestions.length - 1}
                className="rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-5 py-2.5 flex items-center gap-1.5 transition-all text-slate-300 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRightIcon size={14} />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: TIMED MOCK TEST SIMULATOR (TESTBOOK / SSC CGL HIGH FIDELITY LAYOUT) */}
        {/* ========================================================================= */}
        {view === "mock" && mockQuestions.length > 0 && (
          <div className="flex flex-col gap-6 animate-fade-in min-h-[calc(100vh-140px)]">
            
            {/* Testbook Header Toolbar */}
            <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                    SSC CGL / KVS Computer Instructor Core Exam
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Section: {selectedCategory} CBT Practice</p>
                </div>
              </div>

              {/* Middle Clock */}
              <div className="flex items-center gap-6">
                <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-2 flex items-center gap-2">
                  <TimerIcon size={16} className="text-rose-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Time Left:</span>
                  <span className="text-sm font-extrabold font-mono text-rose-300">{formatTimer(mockTimeLeft)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2 border border-white/5 transition-all cursor-pointer"
                >
                  {mobileMenuOpen ? "Hide Grid" : "Show Grid"}
                </button>
                <button
                  onClick={handleMockSubmit}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-5 py-2.5 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
                >
                  Submit Test
                </button>
              </div>
            </div>

            {/* Split Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-6 flex-1 items-start relative">
              
              {/* Left Pane: Question Board & SSC CBT Action Row */}
              <div className="space-y-6">
                
                {/* Active Question Box */}
                <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 min-h-[320px] flex flex-col justify-between border border-white/5 relative">
                  
                  {/* Category and Index Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                      <span className="font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                        Question {mockIndex + 1}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-800 px-2.5 py-0.5 rounded-full border border-white/5">
                        {mockQuestions[mockIndex].category}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-white leading-relaxed">
                      {/* Regex dynamic translation filter for custom exam language view! */}
                      {filterQuestionText(mockQuestions[mockIndex].question, examLanguage)}
                    </h2>
                  </div>

                  {/* Options List (Silent Choice Mode + dynamic language filters!) */}
                  <div className="grid gap-3 pt-4">
                    {mockQuestions[mockIndex].options.map((option, optIdx) => {
                      const isSelected = mockAnswers[mockIndex] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => selectMockOption(optIdx)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${
                            isSelected 
                              ? "border-indigo-500 bg-indigo-500/15 text-indigo-200" 
                              : "border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20 hover:bg-slate-900/60"
                          }`}
                        >
                          <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isSelected ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400"
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{filterQuestionText(option, examLanguage)}</span>
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* SSC Action Row Console */}
                <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 border border-white/5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMockMarkForReview}
                      className="rounded-xl bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 text-xs font-bold px-4 py-2.5 border border-purple-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                      <span>Mark for Review & Next</span>
                    </button>

                    <button
                      onClick={clearMockResponse}
                      className="rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2.5 border border-white/5 transition-all cursor-pointer text-slate-300"
                    >
                      Clear Response
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMockIndex(prev => Math.max(0, prev - 1))}
                      disabled={mockIndex === 0}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold px-4 py-2.5 border border-white/5 transition-all text-slate-300 cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeftIcon size={14} />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={saveAndNextMock}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Save & Next</span>
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Sidebar: Testbook Sticky Navigator Matrix */}
              <aside className={`glass rounded-3xl p-5 space-y-6 lg:block border border-white/5 ${
                mobileMenuOpen ? "block absolute inset-x-0 top-0 z-30 shadow-2xl glass-premium animate-fade-in" : "hidden"
              }`}>
                <div>
                  <h3 className="text-sm font-bold text-white">Questions Panel</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Click any number to jump directly</p>
                </div>

                {/* Grid Numbers styled according to visited state */}
                <div className="grid grid-cols-5 gap-2.5">
                  {mockQuestions.map((_, idx) => {
                    const isCurrent = idx === mockIndex;
                    const isAnswered = mockAnswers[idx] !== null;
                    const isMarked = mockMarked[idx];
                    const isVisited = mockVisited[idx];
                    
                    let indicatorClass = "cbt-unvisited";
                    
                    if (isCurrent) {
                      indicatorClass = "border border-indigo-400 bg-indigo-500/20 text-indigo-100 font-extrabold ring-1 ring-indigo-500/30 scale-105 shadow-md shadow-indigo-500/10";
                    } else if (isMarked) {
                      indicatorClass = "cbt-review";
                    } else if (isAnswered) {
                      indicatorClass = "cbt-answered";
                    } else if (isVisited) {
                      indicatorClass = "cbt-unanswered";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setMockIndex(idx);
                          setMobileMenuOpen(false);
                        }}
                        className={`h-10 w-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative ${indicatorClass}`}
                      >
                        <span>{idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Legend explanation matrix */}
                <div className="pt-5 border-t border-white/5 space-y-3 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-answered text-[10px] font-bold">1</span>
                      <span>Answered (उत्तर दिया)</span>
                    </div>
                    <span className="font-bold text-white">{mockAnswers.filter(a => a !== null).length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-review text-[10px] font-bold">1</span>
                      <span>Marked for Review (समीक्षा)</span>
                    </div>
                    <span className="font-bold text-white">{mockMarked.filter(m => m).length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-unanswered text-[10px] font-bold">1</span>
                      <span>Not Answered (बचे हुए)</span>
                    </div>
                    <span className="font-bold text-white">{mockAnswers.filter((a, idx) => a === null && mockVisited[idx]).length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-unvisited text-[10px] font-bold">1</span>
                      <span>Not Visited (अभी तक नहीं देखा)</span>
                    </div>
                    <span className="font-bold text-white">{mockAnswers.filter((_, idx) => !mockVisited[idx]).length}</span>
                  </div>
                </div>
              </aside>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PERFORMANCE REPORT & TCS iON SOLUTIONS ANALYTICS */}
        {/* ========================================================================= */}
        {view === "results" && lastAttempt && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            
            {/* Scorecard Header */}
            <div className="glass-premium rounded-3xl p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-3 text-center md:text-left">
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 uppercase">
                  Exam Completed Successfully
                </span>
                
                <h2 className="text-3xl font-extrabold text-white">
                  Official CBT Result Card
                </h2>
                
                <p className="text-xs text-slate-400">
                  Subject Tested: <span className="font-semibold text-slate-300">{lastAttempt.category}</span> • 
                  Exam Date: <span className="font-semibold text-slate-300">{formatDate(new Date().toISOString())}</span>
                </p>
              </div>

              {/* Accuracy Meter Ring displaying exact final mark count incorporating negative markings! */}
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-3xl border border-white/5 w-40 h-40">
                <span className={`text-4xl font-extrabold ${lastAttempt.score >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                  {lastAttempt.score}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Marks Scored</span>
                <span className="text-xs text-indigo-300 font-bold mt-0.5">
                  {/* Score = correct - (incorrect * 0.33) */}
                  {Math.max(0, lastAttempt.correctCount - ((lastAttempt.total - lastAttempt.correctCount - lastAttempt.answers.filter(a => a === null).length) * 0.33)).toFixed(2)} / {lastAttempt.total}.00 Marks
                </span>
              </div>
            </div>

            {/* Performance Verdict Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">CBT Assessment Status</p>
                <h4 className={`text-base font-bold pt-1 ${lastAttempt.score >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                  {lastAttempt.score >= 50 ? "✅ QUALIFIED (सफल)" : "❌ REQUIRES REVISION (पुनः प्रयास)"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Cutoff rating evaluated at 50% standard.</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">CBT Pace Velocity</p>
                <h4 className="text-base font-bold text-white pt-1">
                  {lastAttempt.timeSpent > 0 ? `${Math.round(lastAttempt.timeSpent / lastAttempt.total)} s / Question` : "Practice Mode"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Recommended target: &lt; 90 seconds.</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Total Time Taken</p>
                <h4 className="text-base font-bold text-indigo-300 pt-1">
                  {lastAttempt.timeSpent > 0 ? `${formatTimer(lastAttempt.timeSpent)} minutes` : "Practice Session"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Penalty marking of 0.33 applied to wrong answers.</p>
              </div>

            </div>

            {/* Dynamic Category Accuracy Stacked Progress Bar Grid */}
            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Category-wise Analytics (विषयवार विश्लेषण)</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Proportion of correct, incorrect, and skipped questions per category</p>
              </div>

              <div className="space-y-4">
                {activeCategories.map(cat => {
                  // Compute stats for this category inside this specific test
                  const catQuestions = lastAttempt.questions.filter(q => q.category === cat);
                  if (catQuestions.length === 0) return null;

                  let right = 0;
                  let wrong = 0;
                  let skipped = 0;

                  lastAttempt.questions.forEach((q, idx) => {
                    if (q.category === cat) {
                      const userAns = lastAttempt.answers[idx];
                      if (userAns === null) {
                        skipped++;
                      } else if (userAns === q.answerIndex) {
                        right++;
                      } else {
                        wrong++;
                      }
                    }
                  });

                  const totalCat = catQuestions.length;
                  const rightPct = Math.round((right / totalCat) * 100);
                  const wrongPct = Math.round((wrong / totalCat) * 100);
                  const skippedPct = 100 - rightPct - wrongPct;

                  return (
                    <div key={cat} className="space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-300">
                        <span>{cat}</span>
                        <span className="text-[10px] text-slate-400">
                          {right} Right • {wrong} Wrong • {skipped} Skipped
                        </span>
                      </div>

                      {/* Stacked Progress Bar Grid */}
                      <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden flex border border-white/5">
                        {right > 0 && (
                          <div 
                            className="bg-emerald-500 h-full flex items-center justify-center text-[9px] text-slate-950 font-bold"
                            style={{ width: `${rightPct}%` }}
                            title={`${rightPct}% Correct`}
                          >
                            {rightPct}%
                          </div>
                        )}
                        {wrong > 0 && (
                          <div 
                            className="bg-rose-500 h-full flex items-center justify-center text-[9px] text-white font-bold"
                            style={{ width: `${wrongPct}%` }}
                            title={`${wrongPct}% Incorrect`}
                          >
                            {wrongPct}%
                          </div>
                        )}
                        {skipped > 0 && (
                          <div 
                            className="bg-slate-700 h-full flex items-center justify-center text-[9px] text-slate-300 font-bold"
                            style={{ width: `${skippedPct}%` }}
                            title={`${skippedPct}% Skipped`}
                          >
                            {skippedPct}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Solutions reviewing list */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="h-2 w-2 bg-indigo-400 rounded-full animate-ping"></span>
                Official Solution Review Grid (प्रश्नों की समीक्षा)
              </h3>

              <div className="space-y-4">
                {lastAttempt.questions.map((question, idx) => {
                  const selectedIdx = lastAttempt.answers[idx];
                  const isCorrect = selectedIdx === question.answerIndex;

                  return (
                    <div 
                      key={question.id}
                      className="glass rounded-3xl p-6 space-y-4 border border-white/5 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-indigo-400 font-bold">
                          Question {idx + 1}
                        </span>
                        
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          isCorrect 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {isCorrect ? "Correct (+1.00)" : selectedIdx === null ? "Skipped (0.00)" : "Incorrect (-0.33)"}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-relaxed">
                        {question.question}
                      </h4>

                      {/* Display choices state */}
                      <div className="grid gap-2 text-xs">
                        {question.options.map((option, optIdx) => {
                          const isCorrectChoice = optIdx === question.answerIndex;
                          const isUserSelection = optIdx === selectedIdx;
                          
                          let badgeStyle = "bg-white/5 border border-white/5 text-slate-400";
                          if (isCorrectChoice) {
                            badgeStyle = "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold";
                          } else if (isUserSelection) {
                            badgeStyle = "bg-rose-500/10 border border-rose-500/30 text-rose-300";
                          }

                          return (
                            <div 
                              key={optIdx} 
                              className={`p-3 rounded-xl flex items-center justify-between border ${badgeStyle}`}
                            >
                              <span>{option}</span>
                              {isCorrectChoice && <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded uppercase">Correct Answer</span>}
                              {isUserSelection && !isCorrectChoice && <span className="text-[9px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded uppercase">Your Answer</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanations reveals only here */}
                      {question.explanation && (
                        <div className="bg-indigo-500/5 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed border border-indigo-500/10">
                          <p className="font-bold text-indigo-300 flex items-center gap-1 mb-1.5 uppercase tracking-wider">
                            <InfoIcon size={12} />
                            Explanation (व्याख्या)
                          </p>
                          <p>{question.explanation}</p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Back button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setView("dashboard")}
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm px-8 py-3 transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Back to Dashboard Hub
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================================= */}
      {/* EXTRAS PANEL: INTERACTIVE STUDIES SIDE DRAWERS */}
      {/* ========================================================================= */}

      {/* 1. HTML5 Canvas Scratchpad (कच्चा काम/रफ़ बोर्ड) */}
      {showScratchpad && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-slate-950 border-l border-white/10 shadow-2xl p-5 flex flex-col justify-between drawer-transition animate-slide-left">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">📝</span>
                <h3 className="text-sm font-bold text-white">Virtual Scratchpad (रफ़ काम)</h3>
              </div>
              <button 
                onClick={() => setShowScratchpad(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
              पॉइंटर/टच का उपयोग करके यहाँ चित्र बनाएं या गणितीय गणना का रफ़ काम करें।
            </p>

            {/* Canvas Drawing Area */}
            <div className="relative border border-white/10 rounded-2xl overflow-hidden bg-slate-900">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-[380px] bg-slate-900 cursor-crosshair touch-none"
              />
            </div>

            {/* Colors and brush controller */}
            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-1.5">
                {["#8b5cf6", "#ef4444", "#10b981", "#fbbf24"].map(col => (
                  <button
                    key={col}
                    onClick={() => setDrawColor(col)}
                    className="h-6 w-6 rounded-full border border-white/20 cursor-pointer flex items-center justify-center"
                    style={{ backgroundColor: col }}
                  >
                    {drawColor === col && <CheckIcon size={12} className="text-white" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={drawWidth}
                  onChange={(e) => setDrawWidth(parseInt(e.target.value))}
                  className="rounded bg-slate-900 border border-white/10 text-xs p-1 text-slate-300"
                >
                  <option value={2}>Thin brush</option>
                  <option value={4}>Medium brush</option>
                  <option value={6}>Thick brush</option>
                </select>

                <button
                  onClick={clearCanvas}
                  className="rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3 py-1 font-semibold cursor-pointer"
                >
                  Clear Board
                </button>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center border-t border-white/5 pt-4">
            Interactive blackboard vector drawing tool active.
          </div>
        </div>
      )}

      {/* 2. Core CS Cheat Sheet (शॉर्ट नोट्स) */}
      {showCheatSheet && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-950 border-l border-white/10 shadow-2xl p-5 flex flex-col justify-between drawer-transition animate-slide-left">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-400">⚡</span>
                <h3 className="text-sm font-bold text-white">CS Quick Revision Sheets</h3>
              </div>
              <button 
                onClick={() => setShowCheatSheet(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 border-b border-white/5 mb-4 text-[10px] font-bold text-slate-400">
              {["DBMS", "DSA", "Programming", "OS"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCheatTab(tab as any)}
                  className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                    cheatTab === tab ? "text-amber-400 border-b-2 border-amber-500" : "hover:text-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Scrollable Reference Deck */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {cheatTab === "DBMS" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-amber-300">Normalization Forms (नॉर्मलाइजेशन)</h4>
                    <p><strong>1NF:</strong> Attributes must be atomic (no arrays/multivalued values).</p>
                    <p><strong>2NF:</strong> 1NF + No partial dependencies (No non-prime attribute dependent on a part of candidate key).</p>
                    <p><strong>3NF:</strong> 2NF + No transitive dependencies (No non-prime dependent on non-prime).</p>
                    <p><strong>BCNF:</strong> For X ➔ Y, X must be a Super Key.</p>
                    <p><strong>4NF:</strong> Eliminates non-trivial Multi-valued dependencies.</p>
                  </div>
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-amber-300">ACID Properties</h4>
                    <p><strong>Atomicity:</strong> All or nothing transaction execution.</p>
                    <p><strong>Consistency:</strong> Database constraints remain preserved.</p>
                    <p><strong>Isolation:</strong> Transactions run independently without race states.</p>
                    <p><strong>Durability:</strong> Changes are permanently written to non-volatile disk.</p>
                  </div>
                </div>
              )}

              {cheatTab === "DSA" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4">
                    <h4 className="font-bold text-amber-300 mb-2">Algorithmic Complexities (जटिलता)</h4>
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                          <th className="pb-1.5">Algorithm</th>
                          <th className="pb-1.5">Average</th>
                          <th className="pb-1.5">Worst</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-slate-300">
                        <tr>
                          <td className="py-1.5">Quick Sort</td>
                          <td>O(n log n)</td>
                          <td className="text-rose-400">O(n²)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5">Merge Sort</td>
                          <td>O(n log n)</td>
                          <td>O(n log n)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5">Binary Search</td>
                          <td>O(log n)</td>
                          <td>O(log n)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5">Red-Black BST</td>
                          <td>O(log n)</td>
                          <td>O(log n)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1">
                    <h4 className="font-bold text-amber-300">Traversal Models</h4>
                    <p><strong>In-order (L-Root-R):</strong> BST traversal yields sorted ascending numbers.</p>
                    <p><strong>Pre-order (Root-L-R):</strong> Copies BST structure.</p>
                    <p><strong>BFS:</strong> Queue matrix logic (level-by-level search).</p>
                    <p><strong>DFS:</strong> Stack logic (depth first search).</p>
                  </div>
                </div>
              )}

              {cheatTab === "Programming" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-amber-300">C++ OOP Rules</h4>
                    <p><strong>final Class:</strong> Prevent inheritance (`class Derived final : base {}`).</p>
                    <p><strong>virtual override:</strong> Prevent overriding with `final` virtual function.</p>
                    <p><strong>friend function:</strong> External function allowed to query private attributes.</p>
                  </div>
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-amber-300">Web CSS parameters</h4>
                    <p><strong>display: flex:</strong> Convert container element to dynamic Flex layout.</p>
                    <p><strong>flex-direction:</strong> row, row-reverse, column, column-reverse.</p>
                  </div>
                </div>
              )}

              {cheatTab === "OS" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-amber-300">Page Replacement</h4>
                    <p><strong>Belady's Anomaly:</strong> Increasing frames leads to MORE page faults. Exclusively affects FIFO algorithm.</p>
                    <p><strong>LRU:</strong> Replaces page least recently requested by processes.</p>
                  </div>
                  <div className="bg-slate-900 border border-white/5 rounded-xl p-4 space-y-1.5">
                    <h4 className="font-bold text-amber-300">Process Scheduling</h4>
                    <p><strong>Starvation:</strong> Shortest Job First (SJF) and Priority (without aging) causes low priority processes to wait indefinitely.</p>
                    <p><strong>Round Robin:</strong> FCFS with time slice (quantum). No starvation.</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center border-t border-white/5 pt-4">
            Bilingual CS formula note sheets loaded.
          </div>
        </div>
      )}

      {/* 3. Draggable Programmer Calculator Popup (गणना यंत्र) */}
      {showCalculator && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-slate-950 border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-slide-up">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
              <span>🧮</span>
              <span>Scientific & Base Calculator</span>
            </div>
            <button 
              onClick={() => setShowCalculator(false)}
              className="p-0.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Calculator Screen */}
          <div className="rounded-xl bg-black/40 border border-white/5 p-3 text-right">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Base Mode: {calcBase}</span>
            <div className="text-xs text-slate-400 font-mono h-4 overflow-hidden truncate">{calcInput || "0"}</div>
            <div className="text-lg font-bold font-mono text-indigo-300 truncate mt-1">{calcResult || "0"}</div>
          </div>

          {/* Keypads */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
            {calcBtns.map(btn => (
              <button
                key={btn}
                onClick={() => handleCalcBtn(btn)}
                className={`py-2 rounded-lg cursor-pointer transition-colors ${
                  btn === "=" ? "bg-indigo-600 hover:bg-indigo-500 text-white col-span-2" :
                  ["DEC", "BIN", "HEX", "C"].includes(btn) ? "bg-slate-800 hover:bg-slate-700 text-indigo-400" :
                  "bg-slate-900 hover:bg-slate-800 text-slate-300"
                }`}
              >
                {btn === "=" && calcResult ? "Solve" : btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="glass border-t border-white/5 py-6 px-6 md:px-12 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Computer Instructor CBT preparation portal. Designed like Testbook CBT series.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Dynamic CBT Mode</span>
            <span>•</span>
            <span>Smartphone Responsive Spec</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
