"use client";

import { useEffect, useState, useMemo } from "react";
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
  "Software Engineering & SAD"
];

export default function ExamPrepPortal() {
  // Database States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout View State
  // "dashboard" | "practice" | "mock" | "results"
  const [view, setView] = useState<"dashboard" | "practice" | "mock" | "results">("dashboard");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Subjects");

  // Practice Mode States
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [selectedPracticeOption, setSelectedPracticeOption] = useState<number | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [hasCheckedPractice, setHasCheckedPractice] = useState(false);

  // Mock Simulator States
  const [mockQuestions, setMockQuestions] = useState<Question[]>([]);
  const [mockIndex, setMockIndex] = useState(0);
  const [mockAnswers, setMockAnswers] = useState<(number | null)[]>([]);
  const [mockMarked, setMockMarked] = useState<boolean[]>([]);
  const [mockTimeLeft, setMockTimeLeft] = useState(600); // 10 mins default
  const [mockInitialTime, setMockInitialTime] = useState(600);
  const [mockActive, setMockActive] = useState(false);

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
    "category": "One of: Database Management System, Computer Fundamentals & OS, Data Structures & Algorithms, Programming & Web Development, Computer Networks & Security, Software Engineering & SAD",
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

      // Check fields of the items to ensure correctness
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

      // Refresh database stats and question pool
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
    setSelectedPracticeOption(null);
    setHasCheckedPractice(false);
    setView("practice");
  };

  const handlePracticeSelect = (optIndex: number) => {
    if (hasCheckedPractice) return;
    setSelectedPracticeOption(optIndex);
    setHasCheckedPractice(true);
  };

  const nextPracticeQuestion = () => {
    if (practiceIndex < practiceQuestions.length - 1) {
      setPracticeIndex(prev => prev + 1);
      setSelectedPracticeOption(null);
      setHasCheckedPractice(false);
    } else {
      // Completed practice deck
      alert("🎉 You have completed this practice deck! Great job.");
      setView("dashboard");
    }
  };

  // Launch Mock Test
  const startMockTest = (category: string) => {
    setSelectedCategory(category);
    const filtered = category === "All Subjects"
      ? questions
      : questions.filter(q => q.category === category);

    if (filtered.length === 0) {
      alert(`No questions found for ${category}. Add questions to simulate a mock exam.`);
      return;
    }

    // Limit to maximum 10 random questions for simulator speed, or use all if less
    const randomized = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 10);
    setMockQuestions(randomized);
    setMockIndex(0);
    setMockAnswers(randomized.map(() => null));
    setMockMarked(randomized.map(() => false));
    
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
  };

  // Submit Mock Exam to Backend
  const handleMockSubmit = async () => {
    setMockActive(false);
    
    // Evaluate Score
    let correctCount = 0;
    mockQuestions.forEach((q, idx) => {
      if (mockAnswers[idx] === q.answerIndex) {
        correctCount++;
      }
    });

    const scorePercentage = mockQuestions.length > 0 
      ? Math.round((correctCount / mockQuestions.length) * 100) 
      : 0;

    const timeSpent = mockInitialTime - mockTimeLeft;

    setLastAttempt({
      score: scorePercentage,
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
        setStats(freshStats); // Dynamically update stats with database values
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

      // Success
      setFormSuccessMessage("🎉 Question successfully saved to Database!");
      setFormQuestion("");
      setFormOptions(["", "", "", ""]);
      setFormAnswerIndex(0);
      setFormExplanation("");

      // Refresh data dynamically from server
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
    
    // In-memory calculations if stats loading failed
    const totalQ = questions.length;
    return {
      totalQuestions: totalQ,
      totalAttempts: 0,
      averageAccuracy: 0,
      categoryStats: {},
      recentAttempts: []
    };
  }, [stats, questions]);

  // Loading Screen
  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white px-6">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          <div className="absolute h-10 w-10 bg-indigo-500/10 rounded-full animate-ping"></div>
        </div>
        <h2 className="mt-8 text-xl font-medium tracking-wide text-slate-300">
          कंप्यूटर अनुदेशक डेटाबेस लोड हो रहा है...
        </h2>
        <p className="mt-2 text-sm text-slate-500">Connecting to Dynamic Backend API...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030712] text-slate-100 overflow-hidden flex flex-col font-sans">
      
      {/* Background Glowing Vector spots */}
      <div className="glow-spot-indigo top-[-100px] left-[-50px] animate-pulse-slow"></div>
      <div className="glow-spot-emerald bottom-[-150px] right-[-50px] animate-pulse-slow"></div>
      <div className="glow-spot-rose top-[30%] right-[10%] opacity-50"></div>

      {/* Main Header / Navigation */}
      <nav className="glass sticky top-0 z-40 border-b border-white/5 py-4 px-6 md:px-12 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setView("dashboard")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <span className="text-xl font-bold text-white">CI</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                Computer Instructor Prep
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold leading-none mt-0.5">
                Dynamic Exam Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="rounded-full bg-slate-800 hover:bg-slate-700 text-xs font-semibold px-4 py-2 flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer"
            >
              <PlusIcon size={14} className="text-indigo-400" />
              <span>Add Question</span>
            </button>
            
            <button
              onClick={loadData}
              className="rounded-full bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 text-xs font-semibold px-4 py-2 border border-indigo-500/20 transition-all cursor-pointer"
            >
              Sync DB
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative z-10">
        
        {/* Dynamic Admin Question Creator Panel (Dynamic CRUD) */}
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
                    परीक्षा तैयारी पोर्टल
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
                  <span>Start Practice Room</span>
                </button>
                <button
                  onClick={() => startMockTest("All Subjects")}
                  className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm font-semibold py-3 px-6 transition-all flex items-center justify-center gap-2 text-white cursor-pointer shadow-lg shadow-indigo-500/25"
                >
                  <TimerIcon size={18} />
                  <span>Simulation Mock Test</span>
                </button>
              </div>
            </div>

            {/* Glowing Statistics Section */}
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
              
              {/* Subject Categorized Grids */}
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
                    activeCategories.map((cat) => {
                      const catStat = dashboardStats.categoryStats[cat] || { questionCount: 0, solvedCount: 0, accuracy: 0 };
                      
                      return (
                        <div 
                          key={cat}
                          className="glass rounded-2xl p-5 hover:-translate-y-1 hover:border-white/15 transition-all duration-300 relative overflow-hidden group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded-md">
                                CS Module
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
                              onClick={() => startMockTest(cat)}
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
                              {formatDate(attempt.timestamp)} • {Math.round(attempt.timeSpentSeconds / 60)}m spent
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
                {selectedCategory}
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
                  practiceQuestions[practiceIndex].difficulty === "Medium" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                  "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}>
                  {practiceQuestions[practiceIndex].difficulty}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white leading-relaxed">
                {practiceQuestions[practiceIndex].question}
              </h2>

              {/* Options Grid */}
              <div className="grid gap-3 pt-2">
                {practiceQuestions[practiceIndex].options.map((option, optIdx) => {
                  const isCorrectAnswer = optIdx === practiceQuestions[practiceIndex].answerIndex;
                  const isSelected = selectedPracticeOption === optIdx;
                  
                  let optionStyles = "border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20 hover:bg-slate-900/60";
                  
                  if (hasCheckedPractice) {
                    if (isCorrectAnswer) {
                      optionStyles = "border-emerald-500/50 bg-emerald-500/10 text-emerald-100";
                    } else if (isSelected) {
                      optionStyles = "border-rose-500/50 bg-rose-500/10 text-rose-100";
                    } else {
                      optionStyles = "border-white/5 bg-slate-950/30 text-slate-500 opacity-60";
                    }
                  } else if (isSelected) {
                    optionStyles = "border-indigo-500 bg-indigo-500/10 text-indigo-100";
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={hasCheckedPractice}
                      onClick={() => handlePracticeSelect(optIdx)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${optionStyles}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSelected ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-400"
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {hasCheckedPractice && isCorrectAnswer && (
                        <CheckIcon size={16} className="text-emerald-400" />
                      )}
                      {hasCheckedPractice && isSelected && !isCorrectAnswer && (
                        <XIcon size={16} className="text-rose-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Advanced Explanation Panel */}
              {hasCheckedPractice && (
                <div className="rounded-2xl bg-indigo-500/5 border border-indigo-500/10 p-5 mt-6 animate-slide-up space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                    <InfoIcon size={14} />
                    <span>Detailed explanation (विस्तृत व्याख्या)</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {practiceQuestions[practiceIndex].explanation || "No explanation provided for this question."}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Navigation bar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPracticeIndex(prev => Math.max(0, prev - 1))}
                disabled={practiceIndex === 0}
                className="rounded-full border border-white/10 bg-slate-900/50 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-5 py-2.5 flex items-center gap-1 transition-all text-slate-300 cursor-pointer"
              >
                <ChevronLeftIcon size={14} />
                <span>Previous</span>
              </button>

              <button
                onClick={nextPracticeQuestion}
                disabled={!hasCheckedPractice}
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold px-6 py-2.5 flex items-center gap-1.5 transition-all text-white cursor-pointer shadow-lg shadow-indigo-600/15"
              >
                <span>{practiceIndex === practiceQuestions.length - 1 ? "Finish Study" : "Next Question"}</span>
                <ChevronRightIcon size={14} />
              </button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: TIMED MOCK TEST SIMULATOR */}
        {/* ========================================================================= */}
        {view === "mock" && mockQuestions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[2.2fr_1fr] gap-8 animate-fade-in">
            
            {/* Left: Test Console */}
            <div className="space-y-6">
              
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TimerIcon size={16} className="text-rose-500 animate-pulse" />
                    Simulation Mock Exam
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Subject: {selectedCategory}</p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Timer Display */}
                  <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 px-4 py-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest">Time Left:</span>
                    <span className="text-sm font-bold font-mono text-rose-300">{formatTimer(mockTimeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Question viewer card */}
              <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-indigo-400">
                    QUESTION {mockIndex + 1} OF {mockQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 font-bold border border-white/5 uppercase">
                    {mockQuestions[mockIndex].category}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white leading-relaxed">
                  {mockQuestions[mockIndex].question}
                </h2>

                {/* Choices list */}
                <div className="grid gap-3 pt-2">
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
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Controller */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMockIndex(prev => Math.max(0, prev - 1))}
                    disabled={mockIndex === 0}
                    className="rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-4 py-2 border border-white/10 transition-all text-slate-300 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeftIcon size={14} />
                    <span>Prev</span>
                  </button>

                  <button
                    onClick={() => setMockIndex(prev => Math.min(mockQuestions.length - 1, prev + 1))}
                    disabled={mockIndex === mockQuestions.length - 1}
                    className="rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-4 py-2 border border-white/10 transition-all text-slate-300 cursor-pointer flex items-center gap-1"
                  >
                    <span>Next</span>
                    <ChevronRightIcon size={14} />
                  </button>
                </div>

                <button
                  onClick={toggleMockMarkForReview}
                  className={`rounded-full text-xs font-semibold px-5 py-2 flex items-center gap-1 border transition-all cursor-pointer ${
                    mockMarked[mockIndex]
                      ? "bg-purple-600/30 border-purple-500 text-purple-200"
                      : "bg-slate-900 hover:bg-slate-800 border-white/10 text-slate-300"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
                  <span>{mockMarked[mockIndex] ? "Marked for Review" : "Mark for Review"}</span>
                </button>

                <button
                  onClick={handleMockSubmit}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-6 py-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Submit Simulator Exam
                </button>
              </div>

            </div>

            {/* Right: Side Panel Questions Matrix */}
            <aside className="glass rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white">Questions Navigation</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Jump to any specific question index</p>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {mockQuestions.map((_, idx) => {
                  const isCurrent = idx === mockIndex;
                  const isAnswered = mockAnswers[idx] !== null;
                  const isMarked = mockMarked[idx];
                  
                  let cellStyle = "bg-white/5 border border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10";
                  
                  if (isCurrent) {
                    cellStyle = "bg-indigo-600 border border-indigo-500 text-white font-bold";
                  } else if (isMarked) {
                    cellStyle = "bg-purple-950/40 border border-purple-500/40 text-purple-300";
                  } else if (isAnswered) {
                    cellStyle = "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setMockIndex(idx)}
                      className={`h-10 w-full rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative ${cellStyle}`}
                    >
                      <span>{idx + 1}</span>
                      {isMarked && (
                        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-purple-400 rounded-full animate-ping"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/5 space-y-2 text-xs font-medium text-slate-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>Answered (हल किए गए)</span>
                  </div>
                  <span className="font-bold text-white">{mockAnswers.filter(a => a !== null).length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    <span>Review list (समीक्षा)</span>
                  </div>
                  <span className="font-bold text-white">{mockMarked.filter(m => m).length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-white/15"></span>
                    <span>Unanswered (बचे हुए)</span>
                  </div>
                  <span className="font-bold text-white">{mockAnswers.filter(a => a === null).length}</span>
                </div>
              </div>
            </aside>

          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PERFORMANCE REPORT & ANALYTICS */}
        {/* ========================================================================= */}
        {view === "results" && lastAttempt && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            
            {/* Header banner */}
            <div className="glass-premium rounded-3xl p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-3 text-center md:text-left">
                <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 uppercase">
                  Exam Simulation Finished
                </span>
                
                <h2 className="text-3xl font-extrabold text-white">
                  Simulation Report Analytics
                </h2>
                
                <p className="text-xs text-slate-400">
                  Subject Category: <span className="font-semibold text-slate-300">{lastAttempt.category}</span> • 
                  Duration: <span className="font-semibold text-slate-300">{Math.round(lastAttempt.timeSpent / 60)} minutes</span>
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 rounded-3xl border border-white/5 w-40 h-40">
                <span className={`text-4xl font-extrabold ${lastAttempt.score >= 70 ? "text-emerald-400" : "text-rose-400"}`}>
                  {lastAttempt.score}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1.5">Score</span>
                <span className="text-xs text-indigo-300 font-bold mt-0.5">
                  {lastAttempt.correctCount} / {lastAttempt.total} Correct
                </span>
              </div>
            </div>

            {/* Performance Verdict Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Verification Verdict</p>
                <h4 className="text-base font-bold text-white pt-1">
                  {lastAttempt.score >= 80 ? "🏆 Perfect Target (उत्कृष्ट)" : 
                   lastAttempt.score >= 50 ? "👍 Good Competitor (अच्छा प्रयास)" : 
                   "📚 Requires Revision (पुनरावृत्ति की आवश्यकता है)"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Compared with normal instructor cutoff metrics (65%).</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Speed Metric</p>
                <h4 className="text-base font-bold text-white pt-1">
                  {Math.round(lastAttempt.timeSpent / lastAttempt.total)} Seconds / Question
                </h4>
                <p className="text-xs text-slate-500 pt-1">Standard exams recommend &lt; 90 seconds.</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Topic Tested</p>
                <h4 className="text-base font-bold text-indigo-300 pt-1 truncate max-w-[200px]" title={lastAttempt.category}>
                  {lastAttempt.category}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Dynamic attempts loaded automatically.</p>
              </div>

            </div>

            {/* Question Breakdown and Answers Review */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
                Review Answers Sheet (प्रश्नों की समीक्षा)
              </h3>

              <div className="space-y-4">
                {lastAttempt.questions.map((question, idx) => {
                  const selectedIdx = lastAttempt.answers[idx];
                  const isCorrect = selectedIdx === question.answerIndex;

                  return (
                    <div 
                      key={question.id}
                      className="glass rounded-3xl p-6 space-y-4 relative overflow-hidden border border-white/5"
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
                          {isCorrect ? "Correct (+1)" : selectedIdx === null ? "Not Attempted" : "Incorrect (+0)"}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white leading-relaxed">
                        {question.question}
                      </h4>

                      {/* Display choices selection state */}
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
                              {isUserSelection && !isCorrectChoice && <span className="text-[9px] bg-rose-500 text-white font-bold px-2 py-0.5 rounded uppercase">Your Choice</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box */}
                      {question.explanation && (
                        <div className="bg-white/5 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed border border-white/5">
                          <p className="font-bold text-indigo-300 flex items-center gap-1 mb-1">
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

      {/* Footer Branding */}
      <footer className="glass border-t border-white/5 py-6 px-6 md:px-12 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Computer Instructor (कम्प्यूटर अनुदेशक) Preparation Portal.</p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Dynamic Full-Stack Engine</span>
            <span>•</span>
            <span>No Mocks Mode</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
