"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
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
  quizName?: string;
  batchId?: string;
  createdAt?: string;
}

interface Attempt {
  id: string;
  timestamp: string;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  category: string;
  correctAnswersCount: number;
  quizName?: string;
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

const SYLLABUS_DATA = {
  paper1: [
    {
      title: "राजस्थान कला एवं संस्कृति (Art & Culture)",
      emoji: "🎨",
      topics: [
        "स्थापत्य कला — किले, महल, मंदिर, बावड़ी, छतरियाँ, हवेलियाँ",
        "लोक देवता एवं देवियाँ",
        "संत संप्रदाय",
        "लोक नृत्य",
        "लोकगीत",
        "लोकनाट्य",
        "चित्रकला",
        "हस्तकला एवं लोककला",
        "मेले एवं त्योहार",
        "रीति-रिवाज",
        "वेशभूषा एवं आभूषण",
        "भाषा, बोलियाँ एवं साहित्य"
      ]
    },
    {
      title: "राजस्थान का इतिहास (History)",
      emoji: "🏰",
      topics: [
        "राजस्थान की प्राचीन सभ्यताएं",
        "राजस्थान के प्रमुख राजवंश",
        "1857 की क्रांति",
        "राजनीतिक जागरूकता",
        "प्रजामंडल आंदोलन",
        "जनजातीय आंदोलन",
        "किसान आंदोलन",
        "राजस्थान का एकीकरण",
        "प्रमुख व्यक्तित्व"
      ]
    },
    {
      title: "राजस्थान का भूगोल (Geography)",
      emoji: "🗺️",
      topics: [
        "स्थिति एवं विस्तार",
        "भौतिक प्रदेश",
        "अपवाह तंत्र",
        "मृदा",
        "जलवायु",
        "वन्यजीव",
        "कृषि",
        "पशु सम्पदा",
        "सिंचाई परियोजना",
        "जनसंख्या",
        "खनिज",
        "ऊर्जा",
        "मरुस्थलीकरण"
      ]
    },
    {
      title: "सामान्य विज्ञान (General Science)",
      emoji: "🔬",
      topics: [
        "कोशिका",
        "नियंत्रण एवं समन्वय",
        "मानव कंकाल एवं पेशी तंत्र",
        "पाचन तंत्र",
        "मानव नेत्र",
        "परिसंचरण तंत्र",
        "मानव रोग तथा उपचार",
        "मानव पोषण एवं संतुलित आहार",
        "पौधों एवं जंतुओं का आर्थिक महत्व",
        "बल एवं गति",
        "कार्य, ऊर्जा एवं शक्ति",
        "प्रकाश",
        "तरंग एवं ध्वनि",
        "स्थिर विद्युत एवं विद्युत धारा",
        "परमाणु एवं अणु",
        "अम्ल, क्षार एवं लवण",
        "धातु एवं अधातु",
        "कार्बन तथा उसके यौगिक",
        "बहुलक अपमार्जक"
      ]
    },
    {
      title: "रीजनिंग (Reasoning)",
      emoji: "🧠",
      topics: [
        "वर्णमाला परीक्षण (Alphabet Test)",
        "संख्या एवं अक्षर शृंखला (Number and Alphabet Series)",
        "सादृश्यता (Analogy)",
        "वर्गीकरण (Classification)",
        "क्रम परीक्षण (Ranking Test)",
        "कोडिंग-डिकोडिंग (Coding-Decoding)",
        "दिशा परीक्षण (Direction)",
        "रक्त संबंध (Blood Relation)",
        "पासा (Dice)",
        "घन और घनाभ (Cube and Cuboid)",
        "घड़ी (Clock)",
        "कैलेंडर (Calendar)",
        "वेन आरेख (Venn-diagram)",
        "न्याय-वाक्य (Syllogism)",
        "लुप्त संख्या (Missing Number)",
        "शब्दों का तार्किक क्रम (Logical Order of Words)",
        "गणितीय संक्रियाएँ (Mathematical Operations)",
        "पानी और दर्पण प्रतिबिंब (Water & Mirror Image)",
        "बैठक व्यवस्था (Seating Arrangement)",
        "डेटा पर्याप्तता (Data Sufficiency)",
        "आकृतियों की गणना (Counting Figure)",
        "आकृतियों को पूर्ण करें (Figure Completion)",
        "कथन और निष्कर्ष (Statement & Conclusion)",
        "कथन एवं पूर्वधारणा (Statement & Assumptions)",
        "कथन एवं तर्क (Statement & Argument)",
        "विविध (Miscellaneous)"
      ]
    },
    {
      title: "गणित (Mathematics)",
      emoji: "➗",
      topics: [
        "संख्या पद्धति (Number System)",
        "घात, घातांक एवं करणी (Power, Surds and Indices)",
        "सरलीकरण (Simplification)",
        "औसत (Average)",
        "प्रतिशत (Percentage)",
        "अनुपात – समानुपात (Ratio and Proportion)",
        "ल.स.प. एवं म.स.प. (L.C.M. and H.C.F.)",
        "आयु (Age)",
        "समय, चाल एवं दूरी (Time, Speed and Distance)",
        "द्विघात समीकरण (Quadratic Equation)",
        "निर्देशांक ज्यामिति (Co-ordinate Geometry)",
        "आँकड़ों का विश्लेषण (D.I.)",
        "क्षेत्रमिति (Mensuration)"
      ]
    }
  ],
  paper2: [
    {
      title: "पेडगोजी (Pedagogy)",
      emoji: "📚",
      topics: [
        "शिक्षा शास्त्र का अर्थ, महत्त्व एवं विकास",
        "शिक्षण अधिगम प्रक्रिया, व्यूह रचना एवं शिक्षण उपागम",
        "अधिगम-प्रक्रिया, सहगामी अधिगम एवं निर्मितवाद आधारित अधिगम",
        "शिक्षण प्रतिमान",
        "अभिक्रमित अनुदेशन",
        "शिक्षण सहायक सामग्री",
        "एड्यूसेट (कृत्रिम शैक्षिक उपग्रह)",
        "सूक्ष्म शिक्षण",
        "सूचना एवं संप्रेषण तकनीकी"
      ]
    },
    {
      title: "बौद्धिक योग्यता (Intellectual Ability)",
      emoji: "🧩",
      topics: [
        "Decision Making & Problem Solving",
        "Data Interpretation",
        "Data Sufficiency",
        "Logical Reasoning & Analytical Ability",
        "Major Developments in the Field of Information Technology"
      ]
    },
    {
      title: "Fundamentals of Computer",
      emoji: "💻",
      topics: [
        "Overview of Computer System including Input-Output Devices",
        "Pointing Devices & Scanner",
        "Representation of Data (Digital vs Analog, Number System — Decimal, Binary & Hexadecimal)",
        "Introduction to Data Processing",
        "Concept of Files & Its Types"
      ]
    },
    {
      title: "Data Processing",
      emoji: "📊",
      topics: [
        "Word Processing (MS-Word)",
        "Spreadsheet Software (MS-Excel)",
        "Presentation Software (MS-PowerPoint)",
        "DBMS Software (MS-Access)"
      ]
    },
    {
      title: "Programming Fundamentals",
      emoji: "🖥️",
      topics: [
        "Introduction to C, C++, Java, .NET",
        "Artificial Intelligence (AI), Machine Learning",
        "Python & Blockchain",
        "Principles & Programming Techniques",
        "Introduction to Object Oriented Programming (OOP) Concepts",
        "Introduction to Integrated Development Environment (IDE) & Its Advantages"
      ]
    },
    {
      title: "Data Structures & Algorithm",
      emoji: "🗂️",
      topics: [
        "Algorithm for Problem Solving",
        "Abstract Data Types",
        "Arrays as Data Structure",
        "Linked List vs Array for Storage",
        "Stack & Stack Operations",
        "Queues",
        "Binary Trees, Binary Search Trees",
        "Graphs & Their Representation",
        "Sorting & Searching",
        "Symbol Table",
        "Data Structures using C & C++"
      ]
    },
    {
      title: "Computer Organization & Operating System",
      emoji: "🖱️",
      topics: [
        "Basic Structure of Computer",
        "Computer Arithmetic Operations",
        "Central Processing Unit & Instructions",
        "Memory Organization",
        "I/O Organization",
        "Operating System Overview",
        "Process Management",
        "Finding & Processing Files"
      ]
    },
    {
      title: "Communication & Network Concepts",
      emoji: "🌐",
      topics: [
        "Introduction to Computer Networks",
        "Network Layers/Models",
        "Networking Devices",
        "Fundamentals of Mobile Communication"
      ]
    },
    {
      title: "Network Security",
      emoji: "🔒",
      topics: [
        "Protecting Computer Systems from Viruses & Malicious Attacks",
        "Introduction to Firewall & Its Utility",
        "Backup & Restoring Data",
        "Networking (LAN & WAN)",
        "Security",
        "Ethical Hacking"
      ]
    },
    {
      title: "Database Management System (DBMS)",
      emoji: "🗃️",
      topics: [
        "Overview of Database Management",
        "Architecture of Database System",
        "Relational Database Management System (RDBMS)",
        "Database Design",
        "Manipulating Data",
        "NoSQL Database Technologies",
        "Selecting Right Database"
      ]
    },
    {
      title: "System Analysis & Design",
      emoji: "🔧",
      topics: [
        "Introduction to System Analysis & Design",
        "Requirement Gathering & Feasibility Analysis",
        "Structured Analysis",
        "Structured Design",
        "Object-Oriented Modeling using UML",
        "Testing",
        "System Implementation & Maintenance",
        "Other Software Development Approaches"
      ]
    },
    {
      title: "Internet of Things (IoT) & Its Applications",
      emoji: "🌍",
      topics: [
        "Introduction to Internet Technology & Protocols",
        "LAN, MAN, WAN",
        "Search Services/Engines",
        "Introduction to Online & Offline Messaging",
        "World Wide Web Browser",
        "Web Publishing",
        "Basic Knowledge of HTML, XML & Scripts",
        "Creation & Maintenance of Websites",
        "HTML Interactivity Tools",
        "Multimedia & Graphics",
        "Voice Mail & Video Conferencing",
        "Introduction to E-Commerce"
      ]
    }
  ]
};

export default function ExamPrepPortal() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  // Database States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout View State
  // "dashboard" | "instructions" | "mock" | "results" | "practice"
  const [view, setView] = useState<"dashboard" | "instructions" | "mock" | "results" | "practice" | "syllabus">("dashboard");
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
  const [mockQuestionLimit, setMockQuestionLimit] = useState<number>(15);
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
  const [formQuizName, setFormQuizName] = useState("Rajasthan Computer Instructor CBT Mock 1");
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
  const [importQuizName, setImportQuizName] = useState("Rajasthan Computer Instructor CBT Mock 1");
  const [selectedQuizName, setSelectedQuizName] = useState<string>("All Quizzes");
  const [activeQuizName, setActiveQuizName] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("All");
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  const [activeSyllabusTab, setActiveSyllabusTab] = useState<"overview" | "cutoff" | "paper1" | "paper2">("overview");
  const [syllabusSearch, setSyllabusSearch] = useState("");
  const [universalSearch, setUniversalSearch] = useState("");
  const [completedTopics, setCompletedTopics] = useState<string[]>([]);
  
  // SC Target Score Calculator States
  const [calcCorrectP1, setCalcCorrectP1] = useState<number>(70);
  const [calcCorrectP2, setCalcCorrectP2] = useState<number>(70);
  const [calcWrong, setCalcWrong] = useState<number>(15);

  // Load completed syllabus topics from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("completed_syllabus_topics");
      if (stored) {
        setCompletedTopics(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleTopicCompletion = (topicName: string) => {
    setCompletedTopics(prev => {
      const updated = prev.includes(topicName)
        ? prev.filter(t => t !== topicName)
        : [...prev, topicName];
      try {
        localStorage.setItem("completed_syllabus_topics", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const selectAllTopics = (topics: string[]) => {
    setCompletedTopics(prev => {
      const filtered = prev.filter(t => !topics.includes(t));
      const updated = [...filtered, ...topics];
      try {
        localStorage.setItem("completed_syllabus_topics", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const clearAllTopics = (topics: string[]) => {
    setCompletedTopics(prev => {
      const updated = prev.filter(t => !topics.includes(t));
      try {
        localStorage.setItem("completed_syllabus_topics", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  const completedPaper1Count = useMemo(() => {
    let count = 0;
    SYLLABUS_DATA.paper1.forEach(sub => {
      sub.topics.forEach(t => {
        if (completedTopics.includes(t)) {
          count++;
        }
      });
    });
    return count;
  }, [completedTopics]);

  const completedPaper2Count = useMemo(() => {
    let count = 0;
    SYLLABUS_DATA.paper2.forEach(sub => {
      sub.topics.forEach(t => {
        if (completedTopics.includes(t)) {
          count++;
        }
      });
    });
    return count;
  }, [completedTopics]);

  const totalPaper1Topics = useMemo(() => {
    return SYLLABUS_DATA.paper1.reduce((acc, sub) => acc + sub.topics.length, 0);
  }, []);

  const totalPaper2Topics = useMemo(() => {
    return SYLLABUS_DATA.paper2.reduce((acc, sub) => acc + sub.topics.length, 0);
  }, []);

  const totalTopics = totalPaper1Topics + totalPaper2Topics;
  const completedTotalCount = completedPaper1Count + completedPaper2Count;

  const filteredPaper1 = useMemo(() => {
    if (!syllabusSearch.trim()) return SYLLABUS_DATA.paper1;
    const query = syllabusSearch.toLowerCase();
    return SYLLABUS_DATA.paper1.map(sub => {
      const matchingTopics = sub.topics.filter(t => t.toLowerCase().includes(query));
      if (sub.title.toLowerCase().includes(query) || matchingTopics.length > 0) {
        return { ...sub, topics: matchingTopics.length > 0 ? matchingTopics : sub.topics };
      }
      return null;
    }).filter(Boolean) as typeof SYLLABUS_DATA.paper1;
  }, [syllabusSearch]);

  const filteredPaper2 = useMemo(() => {
    if (!syllabusSearch.trim()) return SYLLABUS_DATA.paper2;
    const query = syllabusSearch.toLowerCase();
    return SYLLABUS_DATA.paper2.map(sub => {
      const matchingTopics = sub.topics.filter(t => t.toLowerCase().includes(query));
      if (sub.title.toLowerCase().includes(query) || matchingTopics.length > 0) {
        return { ...sub, topics: matchingTopics.length > 0 ? matchingTopics : sub.topics };
      }
      return null;
    }).filter(Boolean) as typeof SYLLABUS_DATA.paper2;
  }, [syllabusSearch]);

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
      let payloadToSubmit = parsedData;
      const quizTitleToUse = importQuizName.trim() || "Rajasthan Computer Instructor CBT Mock 1";

      if (Array.isArray(parsedData)) {
        payloadToSubmit = parsedData.map(q => ({
          ...q,
          quizName: quizTitleToUse // Force all questions under ONE quiz card
        }));
      } else if (parsedData && Array.isArray(parsedData.questions)) {
        const finalTitle = parsedData.title || quizTitleToUse;
        payloadToSubmit = {
          title: finalTitle,
          questions: parsedData.questions.map((q: any) => ({
            ...q,
            quizName: finalTitle // Force all questions under ONE quiz card
          }))
        };
      } else if (parsedData && typeof parsedData === "object") {
        payloadToSubmit = {
          ...parsedData,
          quizName: quizTitleToUse
        };
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToSubmit)
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Fetch initial data
  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      
      const qRes = await fetch("/api/questions");
      if (!qRes.ok) throw new Error("Failed to load questions pool");
      const questionsData = await qRes.json();
      setQuestions(questionsData);

      const sRes = await fetch(`/api/attempts?userId=${user.uid}`);
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
    if (user) loadData();
  }, [user]);

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
  const startPractice = (category: string, quizName?: string, batchId?: string) => {
    const qName = quizName || selectedQuizName;
    const bId = batchId || selectedBatchId;
    if (quizName) {
      setSelectedQuizName(quizName);
      setActiveQuizName(quizName);
    }
    if (batchId) {
      setSelectedBatchId(batchId);
      setActiveBatchId(batchId);
    } else if (quizName) {
      setSelectedBatchId(quizName);
      setActiveBatchId(quizName);
    }
    setSelectedCategory(category);

    let filtered = questions;
    if (bId && bId !== "All") {
      filtered = filtered.filter(q => {
        const qBatchId = q.batchId || q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
        return qBatchId === bId;
      });
    } else if (qName && qName !== "All Quizzes") {
      filtered = filtered.filter(q => (q.quizName || "Rajasthan Computer Instructor CBT Mock 1") === qName);
    }
    if (category !== "All Subjects") {
      filtered = filtered.filter(q => q.category === category);
    }
      
    if (filtered.length === 0) {
      alert(`No questions found matching criteria.`);
      return;
    }

    // Shuffling practice questions for mixed/random practice feel
    const randomized = [...filtered].sort(() => 0.5 - Math.random());

    // Map 5th option "Not Attempted" on-the-fly if question has only 4 options
    const processed = randomized.map(q => {
      const opts = [...q.options];
      if (opts.length === 4) {
        opts.push("Question Not Attempted / अनुत्तरित प्रश्न");
      }
      return {
        ...q,
        options: opts
      };
    });

    setPracticeQuestions(processed);
    setPracticeIndex(0);
    setPracticeAnswers(randomized.map(() => null));
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
    let incorrectCount = 0;
    let optionECount = 0;
    let blankCount = 0;

    practiceQuestions.forEach((q, idx) => {
      const userAns = practiceAnswers[idx];
      if (userAns === 4) {
        optionECount++;
      } else if (userAns !== null) {
        if (userAns === q.answerIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      } else {
        blankCount++;
        incorrectCount++; // Rajasthan OMR Rule: Penalty for completely blank answer
      }
    });

    const rawScore = correctCount - (incorrectCount * 0.33);
    const scorePercentage = practiceQuestions.length > 0 
      ? Math.max(0, Math.round((rawScore / practiceQuestions.length) * 100)) 
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
          correctAnswersCount: correctCount,
          quizName: activeQuizName || "Rajasthan Computer Instructor CBT Mock 1",
          userId: user?.uid || ""
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
  const transitionToInstructions = (category: string, quizName?: string, batchId?: string) => {
    const qName = quizName || selectedQuizName;
    const bId = batchId || selectedBatchId;
    if (quizName) {
      setSelectedQuizName(quizName);
      setActiveQuizName(quizName);
    }
    if (batchId) {
      setSelectedBatchId(batchId);
      setActiveBatchId(batchId);
    } else if (quizName) {
      setSelectedBatchId(quizName);
      setActiveBatchId(quizName);
    }
    setSelectedCategory(category);

    let filtered = questions;
    if (bId && bId !== "All") {
      filtered = filtered.filter(q => {
        const qBatchId = q.batchId || q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
        return qBatchId === bId;
      });
    } else if (qName && qName !== "All Quizzes") {
      filtered = filtered.filter(q => (q.quizName || "Rajasthan Computer Instructor CBT Mock 1") === qName);
    }
    if (category !== "All Subjects") {
      filtered = filtered.filter(q => q.category === category);
    }

    if (filtered.length === 0) {
      alert(`No questions found matching criteria.`);
      return;
    }

    setDisclaimerChecked(false);
    setView("instructions");
  };

  // Launch Mock Test (TCS iON CBT Layout)
  const startMockTest = () => {
    let filtered = questions;
    if (selectedBatchId && selectedBatchId !== "All") {
      filtered = filtered.filter(q => {
        const qBatchId = q.batchId || q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
        return qBatchId === selectedBatchId;
      });
    } else if (selectedQuizName && selectedQuizName !== "All Quizzes") {
      filtered = filtered.filter(q => (q.quizName || "Rajasthan Computer Instructor CBT Mock 1") === selectedQuizName);
    }
    if (selectedCategory !== "All Subjects") {
      filtered = filtered.filter(q => q.category === selectedCategory);
    }

    if (filtered.length === 0) {
      alert("No questions found matching criteria.");
      return;
    }

    // Limit and strictly shuffle/mix all questions for authentic exam feel
    const randomized = [...filtered].sort(() => 0.5 - Math.random());
    
    // Choose length (either all questions or limited by mockQuestionLimit)
    const limit = mockQuestionLimit === -1 ? randomized.length : Math.min(randomized.length, mockQuestionLimit);
    const sliced = randomized.slice(0, limit);

    // Map 5th option "Not Attempted" on-the-fly if question has only 4 options
    const processed = sliced.map(q => {
      const opts = [...q.options];
      if (opts.length === 4) {
        opts.push("Question Not Attempted / अनुत्तरित प्रश्न");
      }
      return {
        ...q,
        options: opts
      };
    });

    setMockQuestions(processed);
    setMockIndex(0);
    setMockAnswers(processed.map(() => null));
    setMockMarked(processed.map(() => false));
    setMockVisited(processed.map((_, idx) => idx === 0)); // Initialize unvisited array
    
    const calculatedTime = processed.length * 60; // 60 seconds per question
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
      copy[mockIndex] = true;
      return copy;
    });
    // Hops forward dynamically
    if (mockIndex < mockQuestions.length - 1) {
      setMockIndex(prev => prev + 1);
    }
  };

  const saveAndNextMock = () => {
    // Clear marked for review since the candidate explicitly clicked Save & Next
    setMockMarked(prev => {
      const copy = [...prev];
      copy[mockIndex] = false;
      return copy;
    });
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
    setMockMarked(prev => {
      const copy = [...prev];
      copy[mockIndex] = false;
      return copy;
    });
  };

  // Submit Mock Exam to Backend
  const handleMockSubmit = async () => {
    setMockActive(false);
    
    // Evaluate Score incorporating Rajasthan 5-option OMR negative markings
    let correctCount = 0;
    let incorrectCount = 0;
    let optionECount = 0;
    let blankCount = 0;

    mockQuestions.forEach((q, idx) => {
      const userAns = mockAnswers[idx];
      if (userAns === 4) {
        optionECount++;
      } else if (userAns !== null) {
        if (userAns === q.answerIndex) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      } else {
        blankCount++;
        incorrectCount++; // Rajasthan OMR Rule: Penalty for completely blank answer without bubbled E
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
          correctAnswersCount: correctCount,
          quizName: activeQuizName || "Rajasthan Computer Instructor CBT Mock 1",
          userId: user?.uid || ""
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
          explanation: formExplanation,
          quizName: formQuizName.trim() || "Rajasthan Computer Instructor CBT Mock 1"
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

  const handleDeleteQuiz = async (quizName: string, batchId?: string) => {
    const isBatch = batchId && batchId.startsWith("batch_");
    const confirmMsg = isBatch
      ? `⚠️ WARNING: Are you sure you want to permanently delete all questions in this specific upload batch ("${quizName}")? This action will erase it completely and cannot be undone.`
      : `⚠️ WARNING: Are you sure you want to permanently delete all questions in "${quizName}"? This action will erase it completely and cannot be undone.`;

    if (!confirm(confirmMsg)) {
      return;
    }
    try {
      const url = isBatch
        ? `/api/questions?batchId=${encodeURIComponent(batchId)}`
        : `/api/questions?quizName=${encodeURIComponent(quizName)}`;

      const response = await fetch(url, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Failed to delete batch from database.");
      }
      const data = await response.json();
      alert(`🗑️ ${data.message || "Successfully deleted the batch."}`);
      
      if (selectedQuizName === quizName) {
        setSelectedQuizName("All Quizzes");
      }
      if (activeQuizName === quizName) {
        setActiveQuizName(null);
      }
      
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to delete quiz.");
    }
  };

  const handleRenameQuiz = async (quizName: string, batchId: string) => {
    if (!editingName.trim()) {
      alert("Please enter a valid name.");
      return;
    }

    if (editingName.trim() === quizName) {
      setEditingBatchId(null);
      return;
    }

    try {
      setLoading(true);
      const isBatch = batchId && batchId.startsWith("batch_");
      const payload = isBatch
        ? { batchId, newQuizName: editingName.trim() }
        : { quizName, newQuizName: editingName.trim() };

      const response = await fetch("/api/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to rename quiz.");
      }

      const data = await response.json();
      alert(`✏️ ${data.message || "Successfully renamed the quiz."}`);

      if (selectedQuizName === quizName) {
        setSelectedQuizName(editingName.trim());
      }
      if (activeQuizName === quizName) {
        setActiveQuizName(editingName.trim());
      }

      setEditingBatchId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Failed to rename quiz.");
    } finally {
      setLoading(false);
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

  // Group questions by Quiz Name and Batch (Unified Quiz Cards)
  const quizzes = useMemo(() => {
    const quizMap: Record<string, {
      name: string;
      batchId: string;
      createdAt?: string;
      questions: Question[];
      categoryCounts: Record<string, number>;
      difficulties: Set<string>;
    }> = {};

    questions.forEach(q => {
      const qBatchId = q.batchId || q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
      const qName = q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1";
      if (!quizMap[qBatchId]) {
        quizMap[qBatchId] = {
          name: qName,
          batchId: qBatchId,
          createdAt: q.createdAt,
          questions: [],
          categoryCounts: {},
          difficulties: new Set()
        };
      }
      quizMap[qBatchId].questions.push(q);
      quizMap[qBatchId].categoryCounts[q.category] = (quizMap[qBatchId].categoryCounts[q.category] || 0) + 1;
      quizMap[qBatchId].difficulties.add(q.difficulty);
    });

    return Object.values(quizMap);
  }, [questions]);

  const filteredQuizzes = useMemo(() => {
    if (!universalSearch.trim()) return quizzes;
    const query = universalSearch.toLowerCase();
    return quizzes.filter(quiz => {
      if (quiz.name.toLowerCase().includes(query)) return true;
      if (quiz.batchId.toLowerCase().includes(query)) return true;
      const categories = Object.keys(quiz.categoryCounts);
      if (categories.some(cat => cat.toLowerCase().includes(query))) return true;
      if (quiz.questions.some(q => q.question.toLowerCase().includes(query) || q.options.some(o => o.toLowerCase().includes(query)))) return true;
      return false;
    });
  }, [quizzes, universalSearch]);

  // Stats computation helper (segmenting stats by activeQuizName dynamically to prevent mixups)
  const dashboardStats = useMemo(() => {
    // Extract raw attempts array from stats or fallback to empty
    const allAttempts = stats?.recentAttempts || [];
    
    // Filter questions and attempts if inside a specific Quiz Hub
    const activeQuestions = activeBatchId && activeBatchId !== "All"
      ? questions.filter(q => (q.batchId || q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1") === activeBatchId)
      : activeQuizName
      ? questions.filter(q => (q.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1") === activeQuizName)
      : questions;

    const activeAttempts = activeQuizName
      ? allAttempts.filter(a => (a.quizName?.trim() || "Rajasthan Computer Instructor CBT Mock 1") === activeQuizName)
      : allAttempts;

    const totalQ = activeQuestions.length;
    const totalA = activeAttempts.length;

    let totalCorrect = 0;
    let totalAnsweredQ = 0;
    activeAttempts.forEach(a => {
      totalCorrect += a.correctAnswersCount;
      totalAnsweredQ += a.totalQuestions;
    });

    const avgAccuracy = totalAnsweredQ > 0 ? Math.round((totalCorrect / totalAnsweredQ) * 100) : 0;

    // Build categoryStats specifically for this segmented list
    const catStats: Record<string, { questionCount: number; solvedCount: number; accuracy: number }> = {};
    activeQuestions.forEach(q => {
      if (!catStats[q.category]) {
        catStats[q.category] = { questionCount: 0, solvedCount: 0, accuracy: 0 };
      }
      catStats[q.category].questionCount++;
    });

    // Populate category solved counts and accuracy
    const catAttempts: Record<string, { correct: number; total: number }> = {};
    activeAttempts.forEach(a => {
      const cat = a.category;
      if (!catAttempts[cat]) {
        catAttempts[cat] = { correct: 0, total: 0 };
      }
      catAttempts[cat].correct += a.correctAnswersCount;
      catAttempts[cat].total += a.totalQuestions;
    });

    Object.keys(catStats).forEach(cat => {
      const solved = catAttempts[cat] || { correct: 0, total: 0 };
      catStats[cat].solvedCount = solved.total;
      catStats[cat].accuracy = solved.total > 0 ? Math.round((solved.correct / solved.total) * 100) : 0;
    });

    return {
      totalQuestions: totalQ,
      totalAttempts: totalA,
      averageAccuracy: avgAccuracy,
      categoryStats: catStats,
      recentAttempts: activeAttempts.slice(0, 5) // Return 5 most recent attempts for this quiz
    };
  }, [stats, questions, activeQuizName, activeBatchId]);

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

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading SSC Exam Portal...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render (redirect will happen)
  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] text-gray-900 overflow-hidden flex flex-col font-sans">
      
      {/* Background Glowing Spots */}
      <div className="glow-spot-indigo top-[-100px] left-[-50px] animate-pulse-slow"></div>
      <div className="glow-spot-emerald bottom-[-150px] right-[-50px] animate-pulse-slow"></div>
      <div className="glow-spot-rose top-[30%] right-[10%] opacity-40 animate-pulse-slow"></div>

      {/* SSC Exam Header */}
      <nav className="ssc-nav sticky top-0 z-40 py-3 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            onClick={() => setView("dashboard")} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <span className="text-lg font-extrabold text-yellow-400">SSC</span>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                CBT Exam Portal
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-blue-200 font-semibold leading-none mt-0.5">
                Staff Selection Commission Simulator
              </p>
            </div>
          </div>

          {/* Quick study aids drawer toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setView(view === "syllabus" ? "dashboard" : "syllabus");
                setShowScratchpad(false);
                setShowCheatSheet(false);
                setShowCalculator(false);
              }}
              className={`rounded-lg text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                view === "syllabus" ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              📋 Syllabus
            </button>
            <button
              onClick={() => {
                setShowScratchpad(!showScratchpad);
                if (view === "syllabus") setView("dashboard");
              }}
              className={`rounded-lg text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                showScratchpad ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              📝 Draft
            </button>
            <button
              onClick={() => {
                setShowCheatSheet(!showCheatSheet);
                if (view === "syllabus") setView("dashboard");
              }}
              className={`rounded-lg text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                showCheatSheet ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              ⚡ Notes
            </button>
            <button
              onClick={() => {
                setShowCalculator(!showCalculator);
                if (view === "syllabus") setView("dashboard");
              }}
              className={`rounded-lg text-xs font-semibold px-3 py-1.5 border transition-all cursor-pointer ${
                showCalculator ? "bg-white/20 border-white/30 text-white" : "bg-white/5 border-white/10 text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              🧮 Calc
            </button>
            
            <button
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="hidden sm:flex rounded-lg bg-yellow-400 hover:bg-yellow-300 text-xs font-bold px-4 py-2 items-center gap-1 text-gray-900 transition-all cursor-pointer shadow-sm"
            >
              <PlusIcon size={14} />
              <span>Add Question</span>
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-white/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold text-gray-900">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:inline text-xs text-blue-100 max-w-[120px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                id="logout-btn"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                }}
                className="rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 border border-white/20 transition-all cursor-pointer"
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 relative z-10">
        
        {/* Dynamic Admin Question Creator Panel (Manual vs AI Importer Tabs) */}
        {showAdminPanel && (
          <div className="mb-8 glass-premium p-6 md:p-8 rounded-3xl animate-fade-in border border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
              <button 
                onClick={() => setShowAdminPanel(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
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
                <h2 className="text-xl font-bold tracking-tight text-slate-800">Database Management & AI Compiler</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  डेटाबेस में नए कंप्यूटर अनुदेशक प्रश्नों को जोड़ें (मैनुअल या बल्क AI JSON आयात द्वारा)
                </p>
              </div>
            </div>

            {/* Tab Toggles */}
            <div className="flex border-b border-gray-200 mb-6 gap-2">
              <button
                onClick={() => setAdminTab("manual")}
                className={`py-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
                  adminTab === "manual" ? "text-indigo-600 font-extrabold border-b-2 border-indigo-600" : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                Single Question Wizard (मैनुअल जोड़ें)
              </button>
              <button
                onClick={() => setAdminTab("bulk")}
                className={`py-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
                  adminTab === "bulk" ? "text-indigo-600 font-extrabold border-b-2 border-indigo-600" : "text-slate-500 hover:text-indigo-600"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
                <span>AI Bulk JSON Importer (बल्क आयातक)</span>
              </button>
            </div>

            {/* Tab Content 1: Manual Wizard Form */}
            {adminTab === "manual" && (
              <form onSubmit={handleCreateQuestionSubmit} className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Question Text (English + Hindi recommended)
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formQuestion}
                    onChange={(e) => setFormQuestion(e.target.value)}
                    placeholder="e.g. What is the complexity of Binary Search? (बाइनरी सर्च की जटिलता क्या है?)"
                    className="w-full rounded-xl p-3 text-sm glass-input outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formOptions.map((option, idx) => (
                    <div key={idx}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Option {idx + 1}
                      </label>
                      <input
                        type="text"
                        required
                        value={option}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Enter option ${idx + 1}`}
                        className="w-full rounded-xl p-3 text-sm glass-input outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Quiz Name / Paper Title (क्विज / परीक्षा पत्र का नाम)
                  </label>
                  <input
                    type="text"
                    required
                    value={formQuizName}
                    onChange={(e) => setFormQuizName(e.target.value)}
                    placeholder="E.g. Rajasthan Computer Instructor CBT Mock 1"
                    className="w-full rounded-xl p-3 text-sm glass-input outline-none focus:border-indigo-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Correct Option Index
                    </label>
                    <select
                      value={formAnswerIndex}
                      onChange={(e) => setFormAnswerIndex(parseInt(e.target.value))}
                      className="w-full rounded-xl p-3 text-sm bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={0}>Option 1 (पहला विकल्प)</option>
                      <option value={1}>Option 2 (दूसरा विकल्प)</option>
                      <option value={2}>Option 3 (तीसरा विकल्प)</option>
                      <option value={3}>Option 4 (चौथा विकल्प)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Syllabus Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-xl p-3 text-sm bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Difficulty Level
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value as any)}
                      className="w-full rounded-xl p-3 text-sm bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Easy">Easy (आसान)</option>
                      <option value="Medium">Medium (सामान्य)</option>
                      <option value="Hard">Hard (कठिन)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Detailed Explanation (Hindi/English)
                  </label>
                  <textarea
                    rows={2}
                    value={formExplanation}
                    onChange={(e) => setFormExplanation(e.target.value)}
                    placeholder="Explain why this choice is correct..."
                    className="w-full rounded-xl p-3 text-sm glass-input outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {formSuccessMessage ? (
                    <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-1.5 border border-emerald-200 animate-pulse">
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
                <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-5 md:p-6 space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest">
                      AI Command Center & Prompt Builder (प्रॉम्प्ट जनरेटर)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Left: Customizer Filters */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Language (भाषा)
                          </label>
                          <select
                            value={promptLanguage}
                            onChange={(e) => setPromptLanguage(e.target.value as any)}
                            className="w-full rounded-xl p-2.5 text-xs bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="dual">Dual (हिन्दी + Eng)</option>
                            <option value="english">Strictly English</option>
                            <option value="hindi">Strictly Hindi</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Question Size
                          </label>
                          <select
                            value={promptCount}
                            onChange={(e) => setPromptCount(parseInt(e.target.value))}
                            className="w-full rounded-xl p-2.5 text-xs bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value={5}>5 Questions</option>
                            <option value={10}>10 Questions</option>
                            <option value={15}>15 Questions</option>
                            <option value={20}>20 Questions</option>
                            <option value={30}>30 Questions</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Paper Level
                          </label>
                          <select
                            value={promptDifficulty}
                            onChange={(e) => setPromptDifficulty(e.target.value as any)}
                            className="w-full rounded-xl p-2.5 text-xs bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="high">High / Hard Level</option>
                            <option value="balanced">Balanced Mix</option>
                          </select>
                        </div>

                      </div>

                      <div className="text-[10px] text-slate-600 space-y-1 bg-white/80 p-3 rounded-xl border border-gray-200 shadow-sm">
                        <p className="flex items-center gap-1.5">
                          <CheckIcon size={10} className="text-emerald-600" />
                          <span>Strictly shuffles and mixes subjects for real exam simulations.</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <CheckIcon size={10} className="text-emerald-600" />
                          <span>Asks the AI to write rich, bilingual explanations.</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Notes Paster */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <span>Optional: Paste Study Notes / Syllabus Page here</span>
                        <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono font-bold">EXTRACTOR ACTIVE</span>
                      </label>
                      <textarea
                        rows={3}
                        value={promptNotes}
                        onChange={(e) => setPromptNotes(e.target.value)}
                        placeholder="Paste text from your study notes or computer science textbook... The AI will extract premium questions directly from your content!"
                        className="w-full rounded-xl p-3 text-xs glass-input outline-none"
                      />
                    </div>

                  </div>

                  {/* Actions & Preview Collapsible */}
                  <div className="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[10px] text-slate-500 text-center sm:text-left font-medium">
                      💡 Click below to copy the compiled prompt, then paste it into **Gemini** or **ChatGPT**!
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <details className="group w-full sm:w-auto">
                        <summary className="rounded-xl border border-gray-200 hover:bg-gray-50 text-[10px] font-bold py-2 px-3 transition-all cursor-pointer text-center list-none outline-none text-slate-700">
                          Preview Prompt Structure
                        </summary>
                        <div className="absolute left-6 right-6 mt-2 max-h-48 overflow-y-auto glass p-4 rounded-xl text-[10px] font-mono text-slate-600 whitespace-pre-wrap select-all border border-gray-200 shadow-xl z-30">
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

                {/* Quiz Name Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                    Quiz Name / Paper Title (क्विज / परीक्षा पत्र का शीर्षक):
                  </label>
                  <input
                    type="text"
                    required
                    value={importQuizName}
                    onChange={(e) => setImportQuizName(e.target.value)}
                    placeholder="E.g. Rajasthan Computer Instructor CBT Mock 1"
                    className="w-full rounded-2xl p-3.5 text-xs glass-input outline-none focus:border-indigo-500/50"
                  />
                </div>

                {/* Textarea container */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Paste JSON Questions Block (यहाँ अपना JSON पेस्ट करें)
                  </label>
                  <textarea
                    required
                    rows={8}
                    value={jsonInput}
                    onChange={(e) => validatePastedJson(e.target.value)}
                    placeholder={`Paste JSON here...\nExample structure:\n[\n  {\n    "question": "What is the size of IPv6? (IPv6 का साइज क्या है?)",\n    "options": ["32 bits", "64 bits", "128 bits", "256 bits"],\n    "answerIndex": 2,\n    "category": "Computer Networks & Security",\n    "difficulty": "Easy",\n    "explanation": "IPv6 addresses are 128-bits long."\n  }\n]`}
                    className="w-full rounded-2xl p-4 text-xs font-mono glass-input outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Validation Status Rows */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  
                  {/* Dynamic Status Badge */}
                  <div>
                    {jsonStatus === "idle" && (
                      <span className="text-xs font-semibold text-slate-500 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                        ⚪ Waiting for JSON input (इनपुट की प्रतीक्षा है)
                      </span>
                    )}
                    {jsonStatus === "error" && (
                      <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 max-w-lg leading-relaxed">
                        ⚠️ <strong>Parsing Error:</strong> {jsonErrorMsg}
                      </div>
                    )}
                    {jsonStatus === "success" && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-pulse">
                        <CheckIcon size={14} />
                        <span>Validated: Ready to inject {jsonParsedCount} Computer Science questions!</span>
                      </span>
                    )}
                  </div>

                  {/* Submit and message */}
                  <div className="flex items-center gap-3">
                    {bulkSuccessMsg && (
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
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

        {view === "dashboard" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* SSC Dashboard Hero */}
            <div className="glass-premium rounded-2xl p-6 md:p-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 border border-blue-200 uppercase tracking-wider">
                      SSC / RSMSSB / KVS
                    </span>
                    <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700 border border-green-200">
                      🟢 Online
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                    Computer Instructor CBT Practice
                  </h2>
                  <p className="text-sm text-gray-500 max-w-xl">
                    कम्प्यूटर अनुदेशक परीक्षा की तैयारी करें — {questions.length} प्रश्न डेटाबेस में उपलब्ध हैं
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    onClick={() => setView("syllabus")}
                    className="rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 text-xs font-bold px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <span>📋 Syllabus</span>
                  </button>
                  <button
                    onClick={() => startPractice("All Subjects")}
                    className="ssc-btn-secondary flex items-center justify-center gap-2"
                  >
                    <BookOpenIcon size={16} />
                    <span>Practice Mode</span>
                  </button>
                  <button
                    onClick={() => transitionToInstructions("All Subjects")}
                    className="ssc-btn-primary flex items-center justify-center gap-2"
                  >
                    <TimerIcon size={16} />
                    <span>Start Mock CBT</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Questions</p>
                  <BookOpenIcon size={20} className="text-blue-500" />
                </div>
                <p className="text-3xl font-extrabold mt-2 text-gray-900">{dashboardStats.totalQuestions}</p>
                <p className="text-xs text-gray-400 mt-1">Active in database</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attempts</p>
                  <TrophyIcon size={20} className="text-purple-500" />
                </div>
                <p className="text-3xl font-extrabold mt-2 text-gray-900">{dashboardStats.totalAttempts}</p>
                <p className="text-xs text-gray-400 mt-1">Tests completed</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Accuracy</p>
                  <ChartIcon size={20} className="text-green-500" />
                </div>
                <p className="text-3xl font-extrabold mt-2 text-gray-900">{dashboardStats.averageAccuracy}%</p>
                <p className="text-xs text-gray-400 mt-1">Average score</p>
              </div>

              <div className="stat-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Categories</p>
                  <DashboardIcon size={20} className="text-orange-500" />
                </div>
                <p className="text-3xl font-extrabold mt-2 text-gray-900">{Object.keys(dashboardStats.categoryStats).length}</p>
                <p className="text-xs text-gray-400 mt-1">Subject areas</p>
              </div>
            </div>

            {/* Available Mock Test Papers (Unified Quiz Cards) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrophyIcon size={20} className="text-indigo-600 animate-pulse" />
                    Available Mock Test Papers (उपलब्ध मॉक टेस्ट पेपर्स)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select an uploaded question paper to practice, launch in timed CBT mode, or delete a specific batch.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-gray-400">
                      🔍
                    </div>
                    <input
                      type="text"
                      placeholder="पेपर, विषय या प्रश्न खोजें (Universal Search)..."
                      value={universalSearch}
                      onChange={(e) => setUniversalSearch(e.target.value)}
                      className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 text-gray-800"
                    />
                    {universalSearch && (
                      <button
                        onClick={() => setUniversalSearch("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full shadow-sm shrink-0">
                    {filteredQuizzes.length} Papers
                  </span>
                </div>
              </div>

              {quizzes.length === 0 ? (
                <div className="glass-premium rounded-2xl p-10 text-center text-gray-400 border border-dashed border-gray-200 bg-gray-50/50">
                  <BookOpenIcon size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-semibold text-gray-600">No question papers found in the database.</p>
                  <p className="text-xs text-gray-400 mt-1">Use the Database panel above to manually add or upload via AI Bulk JSON Importer.</p>
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="glass-premium rounded-2xl p-8 text-center text-gray-500 border border-indigo-100 bg-indigo-50/10">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-semibold text-gray-700">कोई मैचिंग पेपर या प्रश्न नहीं मिला</p>
                  <p className="text-xs text-gray-400 mt-1">आपकी खोज "{universalSearch}" के लिए कोई परिणाम नहीं मिला। कृपया दूसरा शब्द खोजें।</p>
                  <button
                    onClick={() => setUniversalSearch("")}
                    className="mt-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm shadow-indigo-500/20"
                  >
                    खोज साफ़ करें (Clear Search)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQuizzes.map((quiz) => {
                    const categoriesList = Object.keys(quiz.categoryCounts);
                    
                    return (
                      <div 
                        key={quiz.batchId} 
                        className="glass-premium rounded-2xl p-5 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between border border-indigo-50/50 bg-gradient-to-b from-white to-indigo-50/5 relative overflow-hidden group"
                      >
                        <div className="space-y-3">
                          {/* Top Section */}
                          <div className="flex justify-between items-start gap-2">
                            {editingBatchId === quiz.batchId ? (
                              <div className="flex-1 space-y-1.5 mr-2">
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="w-full text-xs font-bold p-1 px-2 rounded-lg border border-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500/50"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameQuiz(quiz.name, quiz.batchId);
                                    if (e.key === "Escape") setEditingBatchId(null);
                                  }}
                                />
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => handleRenameQuiz(quiz.name, quiz.batchId)}
                                    className="text-[9px] font-bold px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingBatchId(null)}
                                    className="text-[9px] font-bold px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 group/title relative pr-6">
                                <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:text-indigo-700 transition-colors">
                                  {quiz.name}
                                </h4>
                                {quiz.createdAt && (
                                  <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                                    📅 Uploaded: {formatDate(quiz.createdAt)}
                                  </p>
                                )}
                                {/* Inline Pencil Edit Button */}
                                <button
                                  onClick={() => {
                                    setEditingBatchId(quiz.batchId);
                                    setEditingName(quiz.name);
                                  }}
                                  title="Edit quiz title"
                                  className="absolute right-0 top-0.5 opacity-0 group-hover/title:opacity-100 p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition-all cursor-pointer"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                </button>
                              </div>
                            )}
                            <span className="shrink-0 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-extrabold text-indigo-700 border border-indigo-100/50 shadow-sm">
                              {quiz.questions.length} Qs
                            </span>
                          </div>

                          {/* Subject tags */}
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Subjects Covered</p>
                            <div className="flex flex-wrap gap-1">
                              {categoriesList.slice(0, 3).map((cat) => (
                                <span 
                                  key={cat} 
                                  className="text-[9px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium truncate max-w-[120px]"
                                  title={cat}
                                >
                                  {cat.split(' & ')[0]}
                                </span>
                              ))}
                              {categoriesList.length > 3 && (
                                <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-semibold">
                                  +{categoriesList.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              onClick={() => startPractice("All Subjects", quiz.name, quiz.batchId)}
                              className="text-[10px] font-extrabold px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex-1 text-center"
                            >
                              Practice
                            </button>
                            <button
                              onClick={() => transitionToInstructions("All Subjects", quiz.name, quiz.batchId)}
                              className="text-[10px] font-extrabold px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/15 cursor-pointer flex-1 text-center"
                            >
                              Launch CBT
                            </button>
                          </div>
                          
                          {/* Rename/Edit Button */}
                          <button
                            onClick={() => {
                              setEditingBatchId(quiz.batchId);
                              setEditingName(quiz.name);
                            }}
                            title={`Rename "${quiz.name}"`}
                            className="p-2 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-xl transition-colors cursor-pointer border border-indigo-100 shadow-sm shrink-0"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>

                          {/* Delete Paper Button */}
                          <button
                            onClick={() => handleDeleteQuiz(quiz.name, quiz.batchId)}
                            title={`Delete "${quiz.name}" batch`}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-colors cursor-pointer border border-rose-100 shadow-sm shrink-0"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="14" 
                              height="14" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2.5" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Exam Config + Subject-wise Practice */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
              
              {/* Left: Quick Exam Launcher */}
              <div className="glass-premium rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TimerIcon size={20} className="text-blue-600" />
                    Quick Exam Launcher
                  </h3>
                  <span className="text-xs text-gray-400">Configure & Start</span>
                </div>

                {/* Exam Config */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Questions Count */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Questions</label>
                    <select
                      value={mockQuestionLimit}
                      onChange={(e) => setMockQuestionLimit(Number(e.target.value))}
                      className="w-full rounded-lg p-2.5 text-sm glass-input"
                    >
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions</option>
                      <option value={25}>25 Questions</option>
                      <option value={50}>50 Questions</option>
                      <option value={100}>100 Questions</option>
                      <option value={-1}>All Questions</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-lg p-2.5 text-sm glass-input"
                    >
                      <option value="All Subjects">All Subjects (Mixed)</option>
                      {activeCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Language</label>
                    <select
                      value={examLanguage}
                      onChange={(e) => setExamLanguage(e.target.value as any)}
                      className="w-full rounded-lg p-2.5 text-sm glass-input"
                    >
                      <option value="dual">Dual (English + Hindi)</option>
                      <option value="english">English Only</option>
                      <option value="hindi">Hindi Only</option>
                    </select>
                  </div>
                </div>

                {/* Launch Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => startPractice(selectedCategory)}
                    className="ssc-btn-secondary flex-1 flex items-center justify-center gap-2"
                  >
                    <BookOpenIcon size={16} />
                    Study / Practice (No Timer)
                  </button>
                  <button
                    onClick={() => transitionToInstructions(selectedCategory)}
                    className="ssc-btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <TimerIcon size={16} />
                    Start Timed Mock CBT
                  </button>
                </div>

                {/* Subject-wise Cards */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Subject-wise Practice</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(dashboardStats.categoryStats).map(([catName, catData]) => (
                      <div 
                        key={catName}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group cursor-pointer"
                        onClick={() => startPractice(catName)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{catName}</p>
                          <p className="text-xs text-gray-400">{catData.questionCount} questions</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {catData.accuracy > 0 && (
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              catData.accuracy >= 70 ? "bg-green-50 text-green-600" : 
                              catData.accuracy >= 40 ? "bg-yellow-50 text-yellow-600" : 
                              "bg-red-50 text-red-600"
                            }`}>
                              {catData.accuracy}%
                            </span>
                          )}
                          <ChevronRightIcon size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Recent Attempts */}
              <div className="glass-premium rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900">
                  <ClockIcon size={18} className="text-blue-600" />
                  Recent Attempts
                </h3>

                {dashboardStats.recentAttempts.length === 0 ? (
                  <div className="rounded-2xl p-8 text-center text-gray-400 border border-dashed border-gray-200 bg-gray-50">
                    <TrophyIcon size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">No attempts yet</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Take a mock test to see your results here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboardStats.recentAttempts.map((attempt) => {
                      const isGood = attempt.score >= 70;
                      return (
                        <div 
                          key={attempt.id}
                          className="rounded-xl p-4 flex items-center justify-between border-l-4 bg-white border border-gray-100 hover:shadow-sm transition-all"
                          style={{ borderLeftColor: isGood ? "#22c55e" : "#ef4444" }}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">{attempt.category}</p>
                            <p className="text-[10px] text-gray-400 flex items-center gap-1">
                              <ClockIcon size={10} />
                              <span>{formatDate(attempt.timestamp)}</span>
                            </p>
                          </div>

                          <div className="text-right">
                            <p className={`text-sm font-extrabold ${isGood ? "text-green-600" : "text-red-500"}`}>{attempt.score}%</p>
                            <p className="text-[9px] text-gray-400">
                              {attempt.correctAnswersCount}/{attempt.totalQuestions} Correct
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}


        {/* ========================================================================= */}
        {/* VIEW 1.45: INTERACTIVE SYLLABUS CHECKLIST & TRACKER */}
        {/* ========================================================================= */}
        {view === "syllabus" && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
            
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <button 
                  onClick={() => setView("dashboard")}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer mb-2"
                >
                  <ChevronLeftIcon size={16} />
                  <span>Dashboard पर वापस जाएँ</span>
                </button>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <span>बेसिक कम्प्यूटर अनुदेशक पाठ्यक्रम</span>
                  <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    Syllabus Tracker
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  RSMSSB Basic Computer Instructor (CBT Exam) Detailed Syllabus & Progress Checklist
                </p>
              </div>

              {/* Utility Tools */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm animate-pulse-slow"
                >
                  🖨️ Print / Save PDF
                </button>
                <button
                  onClick={() => {
                    if (confirm("क्या आप अपनी पूरी प्रोग्रेस को रीसेट करना चाहते हैं?")) {
                      setCompletedTopics([]);
                      localStorage.removeItem("completed_syllabus_topics");
                    }
                  }}
                  className="rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2.5 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  🔄 Reset Progress
                </button>
              </div>
            </div>

            {/* Quick Metrics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Overall Progress */}
              <div className="glass-premium rounded-2xl p-5 border border-indigo-100/50 shadow-indigo-100/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">कुल प्रगति (Overall Progress)</span>
                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {totalTopics > 0 ? Math.round((completedTotalCount / totalTopics) * 100) : 0}%
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {completedTotalCount} <span className="text-sm font-medium text-slate-400">/ {totalTopics} sub-topics</span>
                  </h3>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${totalTopics > 0 ? (completedTotalCount / totalTopics) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Paper 1 Progress */}
              <div className="glass-premium rounded-2xl p-5 border border-emerald-100/50 shadow-emerald-100/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Paper I Progress</span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {totalPaper1Topics > 0 ? Math.round((completedPaper1Count / totalPaper1Topics) * 100) : 0}%
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {completedPaper1Count} <span className="text-sm font-medium text-slate-400">/ {totalPaper1Topics} sub-topics</span>
                  </h3>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${totalPaper1Topics > 0 ? (completedPaper1Count / totalPaper1Topics) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Paper 2 Progress */}
              <div className="glass-premium rounded-2xl p-5 border border-sky-100/50 shadow-sky-100/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-600">Paper II Progress</span>
                    <span className="text-xs font-extrabold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full">
                      {totalPaper2Topics > 0 ? Math.round((completedPaper2Count / totalPaper2Topics) * 100) : 0}%
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {completedPaper2Count} <span className="text-sm font-medium text-slate-400">/ {totalPaper2Topics} sub-topics</span>
                  </h3>
                </div>
                <div className="mt-4">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${totalPaper2Topics > 0 ? (completedPaper2Count / totalPaper2Topics) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Main Tabs & Search Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-3">
              <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl w-full md:w-auto">
                <button
                  onClick={() => setActiveSyllabusTab("overview")}
                  className={`flex-1 md:flex-initial text-center text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeSyllabusTab === "overview" 
                      ? "bg-white text-indigo-750 shadow-sm border border-slate-200/40" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  📋 Exam Plan & Summary
                </button>
                <button
                  onClick={() => setActiveSyllabusTab("cutoff")}
                  className={`flex-1 md:flex-initial text-center text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeSyllabusTab === "cutoff" 
                      ? "bg-white text-indigo-750 shadow-sm border border-slate-200/40" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  🎯 Predicted Cutoff 2026
                </button>
                <button
                  onClick={() => setActiveSyllabusTab("paper1")}
                  className={`flex-1 md:flex-initial text-center text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeSyllabusTab === "paper1" 
                      ? "bg-white text-indigo-750 shadow-sm border border-slate-200/40" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  📄 Paper I (General)
                </button>
                <button
                  onClick={() => setActiveSyllabusTab("paper2")}
                  className={`flex-1 md:flex-initial text-center text-xs font-bold px-4 py-2.5 rounded-lg transition-all cursor-pointer ${
                    activeSyllabusTab === "paper2" 
                      ? "bg-white text-indigo-750 shadow-sm border border-slate-200/40" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  💻 Paper II (Technical)
                </button>
              </div>

              {/* Search Bar - Hidden on Overview & Cutoff tabs */}
              {activeSyllabusTab !== "overview" && activeSyllabusTab !== "cutoff" && (
                <div className="relative w-full md:w-80">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs text-gray-400">
                    🔍
                  </div>
                  <input
                    type="text"
                    placeholder="विषय या टॉपिक खोजें (e.g. DBMS, C++)..."
                    value={syllabusSearch}
                    onChange={(e) => setSyllabusSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 text-gray-800"
                  />
                  {syllabusSearch && (
                    <button
                      onClick={() => setSyllabusSearch("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* TAB CONTENT: 1. OVERVIEW */}
            {activeSyllabusTab === "overview" && (
              <div className="space-y-6">
                
                {/* Exam Plan details Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-slate-800 to-indigo-900 px-6 py-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>📋 CBT परीक्षा योजना (Computer Based Test Exam Plan)</span>
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">प्रश्न-पत्र</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">मुख्य विषय</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">कुल प्रश्न</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">कुल अंक</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">समय अवधि</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-800 whitespace-nowrap">Paper I</td>
                          <td className="px-6 py-4 text-xs text-slate-600 max-w-md">
                            राजस्थान कला, संस्कृति, इतिहास, भूगोल, सामान्य विज्ञान, समसामयिक मामले (Current Affairs), रीजनिंग (Reasoning), गणित (Mathematics)
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">100 प्रश्न</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">100 अंक</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">2 घंटे (120 मिनट)</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-bold text-slate-800 whitespace-nowrap">Paper II</td>
                          <td className="px-6 py-4 text-xs text-slate-600 max-w-md">
                            शिक्षा शास्त्र (Pedagogy), बौद्धिक योग्यता (Intellectual Ability), Computer Fundamentals, Data Processing, Programming, Data Structures, OS, Networking, Security, DBMS, System Analysis, IoT & Web Tech
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">100 प्रश्न</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">100 अंक</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-700 text-center">2 घंटे (120 मिनट)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-amber-50/70 border-t border-amber-100 p-4 flex gap-2.5 items-start">
                    <span className="text-base">⚠️</span>
                    <div>
                      <p className="text-xs font-semibold text-amber-800">महत्वपूर्ण नोट (Negative Marking):</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        सभी प्रश्न बहुविकल्पी (MCQs) होंगे। प्रत्येक गलत उत्तर के लिए <strong>1/3 (एक-तिहाई) अंक</strong> काटे जाएंगे। परीक्षा उत्तीर्ण करने के लिए न्यूनतम अर्हक अंक (Qualifying Marks) 40% है।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Subject Summary Progress Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">विषयवार प्रगति (Subject-wise Summary)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Paper 1 Subjects list */}
                    <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h5 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                          <span>📄 Paper I Subjects</span>
                        </h5>
                        <button 
                          onClick={() => setActiveSyllabusTab("paper1")}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                        >
                          विस्तार से देखें →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {SYLLABUS_DATA.paper1.map((sub, idx) => {
                          const subDone = sub.topics.filter(t => completedTopics.includes(t)).length;
                          const pct = sub.topics.length > 0 ? Math.round((subDone / sub.topics.length) * 100) : 0;
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                setActiveSyllabusTab("paper1");
                                setTimeout(() => {
                                  const el = document.getElementById(`sub-paper1-${idx}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                              }}
                              className="group flex flex-col p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 flex items-center gap-1.5">
                                  <span>{sub.emoji}</span>
                                  <span>{sub.title}</span>
                                </span>
                                <span className="font-extrabold text-slate-500 group-hover:text-slate-700">
                                  {subDone}/{sub.topics.length} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Paper 2 Subjects list */}
                    <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h5 className="text-xs font-bold text-sky-800 uppercase tracking-wide flex items-center gap-1.5">
                          <span>💻 Paper II Subjects</span>
                        </h5>
                        <button 
                          onClick={() => setActiveSyllabusTab("paper2")}
                          className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline cursor-pointer"
                        >
                          विस्तार से देखें →
                        </button>
                      </div>
                      <div className="space-y-3">
                        {SYLLABUS_DATA.paper2.map((sub, idx) => {
                          const subDone = sub.topics.filter(t => completedTopics.includes(t)).length;
                          const pct = sub.topics.length > 0 ? Math.round((subDone / sub.topics.length) * 100) : 0;
                          return (
                            <div 
                              key={idx}
                              onClick={() => {
                                setActiveSyllabusTab("paper2");
                                setTimeout(() => {
                                  const el = document.getElementById(`sub-paper2-${idx}`);
                                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }, 100);
                              }}
                              className="group flex flex-col p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-700 group-hover:text-indigo-600 flex items-center gap-1.5">
                                  <span>{sub.emoji}</span>
                                  <span>{sub.title}</span>
                                </span>
                                <span className="font-extrabold text-slate-500 group-hover:text-slate-700">
                                  {subDone}/{sub.topics.length} ({pct}%)
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div 
                                  className="bg-sky-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 1.5. PREDICTED CUTOFF 2026 */}
            {activeSyllabusTab === "cutoff" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Intro Card */}
                <div className="glass-premium rounded-2xl p-6 border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">SC Category — Predicted Cutoff 2026</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      कम्प्यूटर अनुदेशक 2026 की परीक्षा (22 अगस्त 2026) के लिए अनुसूचित जाति (SC) श्रेणी का अपेक्षित कट-ऑफ एवं विश्लेषण। रिक्तियों की संख्या में लगभग 60% की कमी के कारण इस वर्ष कट-ऑफ में वृद्धि की प्रबल संभावना है।
                    </p>
                  </div>
                </div>

                {/* Grid layout for Comparison & Expected Cutoffs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left: Comparison Card */}
                  <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <span>📊 Comparison: 2022 vs 2026</span>
                    </h4>
                    
                    <div className="space-y-4">
                      {/* BCI Vacancies */}
                      <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-700">BCI Vacancies (कुल पद)</p>
                          <p className="text-[10px] text-rose-500 font-semibold mt-0.5">📉 60% Seats Decreased</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 line-through">9,862 (2022)</span>
                          <span className="text-sm font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg">3,629 (2026)</span>
                        </div>
                      </div>

                      {/* Exam Date */}
                      <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Exam Date (परीक्षा तिथि)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400">18 Jun 2022</span>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">22 Aug 2026</span>
                        </div>
                      </div>

                      {/* Competition */}
                      <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Competition Level (प्रतिस्पर्धा)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 font-medium">कम</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">उच्च (High)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-xl">
                      <p className="text-[10px] leading-relaxed text-blue-700">
                        <strong>💡 मुख्य प्रभाव:</strong> रिक्तियों में भारी गिरावट और 2022 के साल्व्ड पेपर्स उपलब्ध होने के कारण अभ्यर्थियों के पास तैयारी के लिए बेहतर सामग्री है, जिससे औसत स्कोर बढ़ेगा।
                      </p>
                    </div>
                  </div>

                  {/* Right: Predicted Cutoff Card */}
                  <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                      <span>🎯 Expected SC Cutoff 2026 (out of 200)</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* Non-TSP */}
                      <div className="p-4 bg-gradient-to-br from-indigo-50/30 to-indigo-100/10 border border-indigo-100/50 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Non-TSP Area</span>
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 font-extrabold px-1.5 py-0.5 rounded">सामान्य</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">SC Male:</span>
                            <span className="font-extrabold text-indigo-850">128 – 138 Marks</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">SC Female:</span>
                            <span className="font-extrabold text-indigo-850">122 – 132 Marks</span>
                          </div>
                        </div>
                      </div>

                      {/* TSP */}
                      <div className="p-4 bg-gradient-to-br from-emerald-50/30 to-emerald-100/10 border border-emerald-100/50 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">TSP Area</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded">अनुसूचित</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">SC Male:</span>
                            <span className="font-extrabold text-emerald-850">110 – 120 Marks</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500 font-semibold">SC Female:</span>
                            <span className="font-extrabold text-emerald-850">105 – 115 Marks</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">SC Safe Score (सुरक्षित स्कोर):</span>
                      <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                        140+ Selection Packka
                      </span>
                    </div>

                  </div>

                </div>

                {/* Middle: Reason Cards */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">📈 कट-ऑफ बढ़ने के 3 मुख्य कारण</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-2">
                      <div className="text-xl">📉</div>
                      <h5 className="text-xs font-bold text-slate-800">1. Vacancies में ~60% गिरावट</h5>
                      <p className="text-[11px] leading-normal text-slate-500 font-semibold">
                        2022 में रिक्तियों की संख्या 9,862 थी, जो अब 2026 में घटकर केवल 3,629 रह गई है। सीट घटने से सीधा स्पर्धा गुणांक बढ़ जाता है।
                      </p>
                    </div>

                    <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-2">
                      <div className="text-xl">📖</div>
                      <h5 className="text-xs font-bold text-slate-800">2. बढ़ा हुआ तैयारी स्तर</h5>
                      <p className="text-[11px] leading-normal text-slate-500 font-semibold">
                        2022 का वास्तविक प्रश्न-पत्र उपलब्ध है। अभ्यर्थियों को परीक्षा के पैटर्न और कठिनाई स्तर का पूरा अनुभव है, जिससे सब योजनाबद्ध तरीके से पढ़ रहे हैं।
                      </p>
                    </div>

                    <div className="glass-premium rounded-2xl p-5 border border-slate-100 space-y-2">
                      <div className="text-xl">🔥</div>
                      <h5 className="text-xs font-bold text-slate-800">3. उच्चतर प्रतिस्पर्धा</h5>
                      <p className="text-[11px] leading-normal text-slate-500 font-semibold">
                        कंप्यूटर अनुदेशक क्षेत्र में सरकारी नौकरी के लिए अधिक आईटी और कंप्यूटर साइंस ग्रेजुएट्स इस परीक्षा में भाग ले रहे हैं।
                      </p>
                    </div>

                  </div>
                </div>

                {/* Bottom: Interactive Target Score Calculator */}
                <div className="glass-premium rounded-2xl p-6 border border-slate-100 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-805 flex items-center gap-2">
                      <span className="text-sm font-bold">🧮 Interactive SC Score Predictor (स्कोर कैलकुलेटर)</span>
                      <span className="text-[10px] font-normal text-slate-400">(नकारात्मक अंक 1/3 के साथ)</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      अपने अनुमानित सही और गलत उत्तरों को एडजस्ट करें और देखें कि क्या आप अनुसूचित जाति (SC) श्रेणी की कट-ऑफ और सुरक्षित स्कोर (Safe Score) को पार कर रहे हैं।
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8">
                    
                    {/* Sliders Input Area */}
                    <div className="space-y-5">
                      
                      {/* Paper I Correct */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">Paper I Correct Answers (पेपर 1 सही उत्तर):</span>
                          <span className="font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">{calcCorrectP1} / 100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={calcCorrectP1}
                          onChange={(e) => setCalcCorrectP1(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                        />
                      </div>

                      {/* Paper II Correct */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">Paper II Correct Answers (पेपर 2 सही उत्तर):</span>
                          <span className="font-extrabold text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-0.5 rounded-md">{calcCorrectP2} / 100</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={calcCorrectP2}
                          onChange={(e) => setCalcCorrectP2(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-655"
                        />
                      </div>

                      {/* Wrong Answers */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700">Total Wrong Answers (कुल गलत उत्तर):</span>
                          <span className="font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-md">{calcWrong} / 200</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={calcWrong}
                          onChange={(e) => setCalcWrong(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-550"
                        />
                        <p className="text-[10px] text-slate-400">
                          * <strong>1/3 Negative Marking Penalty:</strong> प्रत्येक गलत उत्तर के लिए 0.33 अंक काटा जाएगा। (गलत उत्तर 20 से कम रखें)
                        </p>
                      </div>

                    </div>

                    {/* Result Visualizer Area */}
                    <div className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-200/60 rounded-2xl relative overflow-hidden">
                      
                      {/* Math Summary */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Net Predicted Score</p>
                          <p className="text-4xl font-black text-slate-800 mt-1">
                            {((calcCorrectP1 + calcCorrectP2) - (calcWrong / 3)).toFixed(2)}
                            <span className="text-xs font-semibold text-slate-400"> / 200</span>
                          </p>
                        </div>

                        <div className="border-t border-slate-200 my-4 pt-3 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>कुल सही उत्तर (Correct):</span>
                            <span className="font-bold text-slate-800">{calcCorrectP1 + calcCorrectP2} Qs</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>ऋणात्मक कटौती (Penalty):</span>
                            <span className="font-bold text-rose-500">-{(calcWrong / 3).toFixed(2)} Marks</span>
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-4">
                        {((calcCorrectP1 + calcCorrectP2) - (calcWrong / 3)) >= 140 ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
                            <p className="text-xs font-bold text-green-700">🟢 Safe Zone (चयन पक्का!)</p>
                            <p className="text-[10px] text-green-600 mt-0.5">आपका स्कोर Non-TSP में सुरक्षित स्कोर 140+ से अधिक है।</p>
                          </div>
                        ) : ((calcCorrectP1 + calcCorrectP2) - (calcWrong / 3)) >= 128 ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                            <p className="text-xs font-bold text-amber-700">🟡 Target / Border Zone</p>
                            <p className="text-[10px] text-amber-600 mt-0.5">अपेक्षित कट-ऑफ (128-138) के भीतर है। चयन की अच्छी संभावना है।</p>
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-center">
                            <p className="text-xs font-bold text-rose-700">🔴 Need Improvement (मेहनत करें)</p>
                            <p className="text-[10px] text-rose-600 mt-0.5">कट-ऑफ 128+ तक पहुँचने के लिए और सही उत्तर दें तथा गलतियाँ कम करें।</p>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: 2. PAPER I (GENERAL) */}
            {activeSyllabusTab === "paper1" && (
              <div>
                {filteredPaper1.length === 0 ? (
                  <div className="text-center py-12 glass-premium rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">खोजे गए टॉपिक के लिए कोई विषय नहीं मिला।</p>
                    <button
                      onClick={() => setSyllabusSearch("")}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      खोज साफ़ करें
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPaper1.map((sub, idx) => {
                      const doneCount = sub.topics.filter(t => completedTopics.includes(t)).length;
                      const totalCount = sub.topics.length;
                      const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                      
                      return (
                        <div 
                          key={idx}
                          id={`sub-paper1-${idx}`}
                          className="glass-premium rounded-2xl p-5 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            
                            {/* Subject Header */}
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="text-base">{sub.emoji}</span>
                                  <span>{sub.title}</span>
                                </h4>
                                <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-1.5 inline-block">
                                  {doneCount} of {totalCount} completed ({percent}%)
                                </p>
                              </div>

                              {/* Batch Selection Utility */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => selectAllTopics(sub.topics)}
                                  className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  सभी चुनें
                                </button>
                                <button
                                  onClick={() => clearAllTopics(sub.topics)}
                                  className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-105 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  साफ़ करें
                                </button>
                              </div>
                            </div>

                            {/* Subject Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            {/* Subtopics Checklist */}
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                              {sub.topics.map((topic, tIdx) => {
                                const isChecked = completedTopics.includes(topic);
                                return (
                                  <label 
                                    key={tIdx}
                                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-all border border-transparent ${
                                      isChecked ? "bg-indigo-50/10 border-indigo-50" : ""
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleTopicCompletion(topic)}
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
                                    />
                                    <span className={`text-xs leading-normal ${
                                      isChecked ? "line-through text-slate-400 font-medium" : "text-slate-700 font-semibold"
                                    }`}>
                                      {topic}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 3. PAPER II (TECHNICAL) */}
            {activeSyllabusTab === "paper2" && (
              <div>
                {filteredPaper2.length === 0 ? (
                  <div className="text-center py-12 glass-premium rounded-2xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-500">खोजे गए टॉपिक के लिए कोई विषय नहीं मिला।</p>
                    <button
                      onClick={() => setSyllabusSearch("")}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      खोज साफ़ करें
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPaper2.map((sub, idx) => {
                      const doneCount = sub.topics.filter(t => completedTopics.includes(t)).length;
                      const totalCount = sub.topics.length;
                      const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                      
                      return (
                        <div 
                          key={idx}
                          id={`sub-paper2-${idx}`}
                          className="glass-premium rounded-2xl p-5 border border-slate-100 hover:border-indigo-100 hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            
                            {/* Subject Header */}
                            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                              <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="text-base">{sub.emoji}</span>
                                  <span>{sub.title}</span>
                                </h4>
                                <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 mt-1.5 inline-block">
                                  {doneCount} of {totalCount} completed ({percent}%)
                                </p>
                              </div>

                              {/* Batch Selection Utility */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => selectAllTopics(sub.topics)}
                                  className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  सभी चुनें
                                </button>
                                <button
                                  onClick={() => clearAllTopics(sub.topics)}
                                  className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 hover:bg-slate-105 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                                >
                                  साफ़ करें
                                </button>
                              </div>
                            </div>

                            {/* Subject Progress Bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>

                            {/* Subtopics Checklist */}
                            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                              {sub.topics.map((topic, tIdx) => {
                                const isChecked = completedTopics.includes(topic);
                                return (
                                  <label 
                                    key={tIdx}
                                    className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-all border border-transparent ${
                                      isChecked ? "bg-indigo-50/10 border-indigo-50" : ""
                                    }`}
                                  >
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleTopicCompletion(topic)}
                                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20 focus:outline-none cursor-pointer"
                                    />
                                    <span className={`text-xs leading-normal ${
                                      isChecked ? "line-through text-slate-400 font-medium" : "text-slate-700 font-semibold"
                                    }`}>
                                      {topic}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>

                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

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
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon size={16} />
                <span>Exit Exam Portal</span>
              </button>
              
              <span className="text-xs font-bold text-slate-700 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">
                Test Room: {selectedCategory}
              </span>
            </div>

            {/* Split Page Instructions layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
              
              {/* Left Column: Official CBT Instructions */}
              <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800">परीक्षा निर्देश (Candidate Exam Instructions)</h2>
                  <p className="text-xs text-slate-500 mt-1">Please read the following instructions carefully before starting the exam.</p>
                </div>

                {/* Instructions Text list */}
                <div className="space-y-4 text-xs text-slate-700 leading-relaxed border-t border-gray-100 pt-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-700">1. General Instructions (सामान्य निर्देश):</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                      <li>The total duration of this examination is 10 minutes (600 seconds).</li>
                      <li>The clock will be set at the server. The countdown timer at the top of screen will show remaining time.</li>
                      <li>This examination consists of 10 Multiple-Choice Questions.</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-700">2. Evaluation & Negative Marking (मूल्यांकन और 5-विकल्प नकारात्मक अंकन):</h4>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-2">
                      <li>Each correct answer will award <strong className="text-emerald-600 font-bold">+1.00 mark</strong>.</li>
                      <li>Selecting any wrong option (A, B, C, D) attracts <strong className="text-rose-600 font-bold">-0.33 marks</strong> penalty (1/3 negative).</li>
                      <li>If you do not want to attempt, you **MUST select Option E (Question Not Attempted / अनुत्तरित प्रश्न)** to receive **0.00 marks** (no penalty).</li>
                      <li>Rajasthan Board Penalty: Leaving a question **completely blank** (not choosing A, B, C, D, OR E) will attract <strong className="text-rose-600 font-bold">-0.33 marks</strong> penalty!</li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-indigo-700">3. Navigation Symbols Legend (नेविगेशन प्रतीक):</h4>
                    <p className="text-slate-600 mb-2">You can see the following colored symbols in your sidebar matrix panel:</p>
                    <div className="grid grid-cols-2 gap-2 pl-2 text-[10px] text-slate-600 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold">1</span>
                        <span>Answered (हल किया गया)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center text-white text-[9px] font-bold">2</span>
                        <span>Marked for Review (समीक्षा के लिए)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-[9px] font-bold">3</span>
                        <span>Not Answered (प्रयास नहीं किया)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center text-[9px] font-bold">4</span>
                        <span>Not Visited (अभी तक नहीं देखा)</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Default Language & Length Selector Forms */}
                <div className="pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Language Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Exam Viewing Language (परीक्षा की भाषा):
                    </label>
                    <select
                      value={examLanguage}
                      onChange={(e) => setExamLanguage(e.target.value as any)}
                      className="w-full rounded-xl p-3 text-xs bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="dual">Bilingual (Hindi + English दोनों)</option>
                      <option value="english">Strictly English (केवल अंग्रेजी)</option>
                      <option value="hindi">Strictly Hindi (केवल हिंदी)</option>
                    </select>
                  </div>

                  {/* Question Count Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Number of Questions (प्रश्नों की संख्या):
                    </label>
                    <select
                      value={mockQuestionLimit}
                      onChange={(e) => setMockQuestionLimit(Number(e.target.value))}
                      className="w-full rounded-xl p-3 text-xs bg-white border border-gray-200 text-gray-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value={10}>10 Questions</option>
                      <option value={15}>15 Questions (Default)</option>
                      <option value={20}>20 Questions</option>
                      <option value={30}>30 Questions</option>
                      <option value={50}>50 Questions</option>
                      <option value={-1}>All Available Questions</option>
                    </select>
                  </div>

                </div>
                <p className="text-[10px] text-slate-500">💡 Note: The simulator will completely mix up and shuffle the questions across all selected subjects for an authentic high-pressure exam feel!</p>

              </div>

              {/* Right Column: Candidate Profile Box */}
              <div className="glass rounded-3xl p-6 space-y-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-lg pointer-events-none"></div>
                
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest border-b border-gray-100 pb-3">
                  Candidate Dashboard
                </h3>

                {/* Initial Silhouette Profile photo */}
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 relative">
                  <span className="text-3xl font-bold text-white font-mono">PK</span>
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 animate-ping"></div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Candidate Name:</p>
                  <p className="text-sm font-bold text-slate-800 tracking-tight">pravinkumarverma</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Roll Number:</p>
                  <p className="text-xs font-mono font-bold text-slate-700 tracking-wider">202605290035</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Exam Subject:</p>
                  <p className="text-xs font-bold text-indigo-600">{selectedCategory}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 text-[10px] text-slate-500">
                  <p>System Terminal: Term-01</p>
                  <p>Server Connection: Connected (🟢)</p>
                </div>

              </div>

            </div>

            {/* Bottom Disclaimer Checklist bar */}
            <div className="glass rounded-2xl p-5 border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon size={16} />
                <span>Quit Practice Room</span>
              </button>
              
              <span className="text-xs text-slate-700 font-semibold uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                {selectedCategory} (Practice Mode)
              </span>
            </div>

            {/* Main Question Card */}
            <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-indigo-600">
                  QUESTION {practiceIndex + 1} OF {practiceQuestions.length}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                  practiceQuestions[practiceIndex].difficulty === "Easy" ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                  practiceQuestions[practiceIndex].difficulty === "Medium" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                  "bg-rose-100 text-rose-700 border border-rose-200"
                }`}>
                  {practiceQuestions[practiceIndex].difficulty}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-850 leading-relaxed">
                {practiceQuestions[practiceIndex].question}
              </h2>

              {/* Options Grid (Practice Mode) */}
              <div className="grid gap-3 pt-2">
                {practiceQuestions[practiceIndex].options.map((option, optIdx) => {
                  const isSelected = practiceAnswers[practiceIndex] === optIdx;
                  const optionStyle = isSelected
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-800 shadow-sm"
                    : "border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50/30";
                  const numStyle = isSelected
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 border border-gray-200";
                  
                  return (
                    <button
                      key={optIdx}
                      onClick={() => selectPracticeOption(optIdx)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${optionStyle}`}
                    >
                      <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${numStyle}`}>
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
                className="rounded-full border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-5 py-2.5 flex items-center gap-1 transition-all text-slate-700 cursor-pointer"
              >
                <ChevronLeftIcon size={14} />
                <span>Previous</span>
              </button>

              <button
                onClick={handlePracticeSubmit}
                className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
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
                className="rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold px-5 py-2.5 flex items-center gap-1.5 transition-all text-white cursor-pointer"
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
            <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-wide uppercase flex items-center gap-1.5">
                    SSC CGL / KVS Computer Instructor Core Exam
                  </h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Section: {selectedCategory} CBT Practice</p>
                </div>
              </div>

              {/* Middle Clock */}
              <div className="flex items-center gap-6">
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 flex items-center gap-2">
                  <TimerIcon size={16} className="text-rose-600 animate-pulse" />
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Time Left:</span>
                  <span className="text-sm font-extrabold font-mono text-rose-700">{formatTimer(mockTimeLeft)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden rounded-xl bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold px-4 py-2 border border-gray-200 transition-all cursor-pointer"
                >
                  {mobileMenuOpen ? "Hide Grid" : "Show Grid"}
                </button>
                <button
                  onClick={handleMockSubmit}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-5 py-2.5 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
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
                <div className="glass-premium rounded-3xl p-6 md:p-8 space-y-6 min-h-[320px] flex flex-col justify-between relative">
                  
                  {/* Category and Index Bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                      <span className="font-bold text-indigo-750 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                        Question {mockIndex + 1}
                      </span>
                      <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                        {mockQuestions[mockIndex].category}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-850 leading-relaxed">
                      {/* Regex dynamic translation filter for custom exam language view! */}
                      {filterQuestionText(mockQuestions[mockIndex].question, examLanguage)}
                    </h2>
                  </div>

                  {/* Options List (Silent Choice Mode + dynamic language filters!) */}
                  <div className="grid gap-3 pt-4">
                    {mockQuestions[mockIndex].options.map((option, optIdx) => {
                      const isSelected = mockAnswers[mockIndex] === optIdx;
                      const isOptionE = optIdx === 4;

                      let btnStyle = "border-gray-200 bg-white text-gray-700 hover:border-indigo-400 hover:bg-indigo-50/30";
                      let numStyle = "bg-gray-100 text-gray-500 border border-gray-200";

                      if (isSelected) {
                        if (isOptionE) {
                          btnStyle = "border-purple-600 bg-purple-50/70 text-purple-805 shadow-sm";
                          numStyle = "bg-purple-600 text-white";
                        } else {
                          btnStyle = "border-indigo-600 bg-indigo-50/70 text-indigo-805 shadow-sm";
                          numStyle = "bg-indigo-600 text-white";
                        }
                      } else if (isOptionE) {
                        btnStyle = "border-purple-200 bg-purple-50/30 text-purple-650 hover:border-purple-400 hover:bg-purple-50/60";
                        numStyle = "bg-purple-100 text-purple-600 border border-purple-200";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => selectMockOption(optIdx)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${btnStyle}`}
                        >
                          <span className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${numStyle}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span>{filterQuestionText(option, examLanguage)}</span>
                        </button>
                      );
                    })}
                  </div>

                </div>

                {/* SSC Action Row Console */}
                <div className="glass rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMockMarkForReview}
                      className="rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold px-4 py-2.5 border border-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                      <span>Mark for Review & Next</span>
                    </button>

                    <button
                      onClick={clearMockResponse}
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold px-4 py-2.5 border border-gray-200 transition-all cursor-pointer text-slate-700"
                    >
                      Clear Response
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMockIndex(prev => Math.max(0, prev - 1))}
                      disabled={mockIndex === 0}
                      className="rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold px-4 py-2.5 border border-gray-200 transition-all text-slate-700 cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeftIcon size={14} />
                      <span>Prev</span>
                    </button>

                    <button
                      onClick={saveAndNextMock}
                      className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>Save & Next</span>
                      <ChevronRightIcon size={14} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Sidebar: Testbook Sticky Navigator Matrix */}
              <aside className={`glass rounded-3xl p-5 space-y-6 lg:block ${
                mobileMenuOpen ? "block absolute inset-x-0 top-0 z-30 shadow-2xl glass-premium animate-fade-in" : "hidden"
              }`}>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Questions Panel</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Click any number to jump directly</p>
                </div>

                {/* Grid Numbers styled according to visited state */}
                <div className="grid grid-cols-5 gap-2.5">
                  {mockQuestions.map((_, idx) => {
                    const isCurrent = idx === mockIndex;
                    const isAnswered = mockAnswers[idx] !== null;
                    const isMarked = mockMarked[idx];
                    const isVisited = mockVisited[idx];

                    let indicatorClass = "";

                    if (isMarked && isAnswered) {
                      indicatorClass = "cbt-answered-review text-white";
                    } else if (isMarked) {
                      indicatorClass = "cbt-review text-white";
                    } else if (isAnswered) {
                      indicatorClass = "cbt-answered text-white";
                    } else if (isVisited) {
                      indicatorClass = "cbt-unanswered text-rose-450";
                    } else {
                      indicatorClass = "cbt-unvisited text-slate-500";
                    }

                    const borderStyle = isCurrent
                      ? "ring-2 ring-indigo-600 ring-offset-2 ring-offset-white scale-110 z-10 shadow-lg shadow-indigo-600/35 border-transparent font-extrabold"
                      : "border-transparent";

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setMockIndex(idx);
                          setMobileMenuOpen(false);
                        }}
                        className={`h-10 w-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer relative rounded border ${indicatorClass} ${borderStyle}`}
                      >
                        <span>{idx + 1}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Legend explanation matrix */}
                <div className="pt-5 border-t border-gray-200 space-y-3 text-[10px] font-bold text-slate-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-answered text-[10px] font-bold">1</span>
                      <span>Answered (उत्तर दिया)</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {mockQuestions.filter((_, idx) => mockAnswers[idx] !== null && !mockMarked[idx]).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-answered-review text-[10px] font-bold">1</span>
                      <span>Answered & Marked (उत्तर व समीक्षा)</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {mockQuestions.filter((_, idx) => mockAnswers[idx] !== null && mockMarked[idx]).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-review text-[10px] font-bold">1</span>
                      <span>Marked for Review (समीक्षा)</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {mockQuestions.filter((_, idx) => mockAnswers[idx] === null && mockMarked[idx]).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-unanswered text-[10px] font-bold">1</span>
                      <span>Not Answered (बचे हुए)</span>
                    </div>
                    <span className="font-bold text-slate-800">
                      {mockQuestions.filter((_, idx) => mockAnswers[idx] === null && !mockMarked[idx] && mockVisited[idx]).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 flex items-center justify-center cbt-unvisited text-[10px] font-bold">1</span>
                      <span>Not Visited (अभी तक नहीं देखा)</span>
                    </div>
                    <span className="font-bold text-slate-800">{mockAnswers.filter((_, idx) => !mockVisited[idx]).length}</span>
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
            <div className="glass-premium rounded-3xl p-8 border border-gray-200 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <div className="space-y-3 text-center md:text-left">
                <span className="rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 uppercase border border-indigo-100">
                  Exam Completed Successfully
                </span>
                
                <h2 className="text-3xl font-extrabold text-slate-800">
                  Official CBT Result Card
                </h2>
                
                <p className="text-xs text-slate-500">
                  Subject Tested: <span className="font-semibold text-slate-700">{lastAttempt.category}</span> • 
                  Exam Date: <span className="font-semibold text-slate-700">{formatDate(new Date().toISOString())}</span>
                </p>
              </div>

              {/* Accuracy Meter Ring displaying exact final mark count incorporating Rajasthan 5-option OMR rules */}
              {(() => {
                const totalCorrect = lastAttempt.correctCount;
                const totalOptionE = lastAttempt.answers.filter(a => a === 4).length;
                const totalBlank = lastAttempt.answers.filter(a => a === null).length;
                const totalIncorrect = lastAttempt.total - totalCorrect - totalOptionE - totalBlank;
                const totalPenalized = totalIncorrect + totalBlank;
                const finalMark = Math.max(0, totalCorrect - (totalPenalized * 0.33));

                return (
                  <div className="flex flex-col items-center justify-center p-6 bg-indigo-50 rounded-3xl border border-indigo-100 w-40 h-40">
                    <span className={`text-4xl font-extrabold ${lastAttempt.score >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                      {lastAttempt.score}%
                    </span>
                    <span className="text-[10px] text-indigo-655 font-semibold uppercase tracking-wider mt-1.5">Marks Scored</span>
                    <span className="text-xs text-indigo-805 font-bold mt-0.5">
                      {finalMark.toFixed(2)} / {lastAttempt.total}.00 Marks
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Performance Verdict Cards (4-State OMR Breakdown!) */}
            {(() => {
              const totalCorrect = lastAttempt.correctCount;
              const totalOptionE = lastAttempt.answers.filter(a => a === 4).length;
              const totalBlank = lastAttempt.answers.filter(a => a === null).length;
              const totalIncorrect = lastAttempt.total - totalCorrect - totalOptionE - totalBlank;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass rounded-2xl p-4 border border-emerald-250 bg-emerald-50/50 relative overflow-hidden group hover:border-emerald-400 transition-all">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg pointer-events-none"></div>
                    <p className="text-[10px] text-slate-600 uppercase font-semibold">🟢 Correct (सही विकल्प)</p>
                    <h4 className="text-xl font-extrabold text-emerald-650 pt-1">
                      {totalCorrect} Qs
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Score weight: +1.00 each</p>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-rose-250 bg-rose-50/50 relative overflow-hidden group hover:border-rose-400 transition-all">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full blur-lg pointer-events-none"></div>
                    <p className="text-[10px] text-slate-600 uppercase font-semibold">🔴 Incorrect (गलत विकल्प)</p>
                    <h4 className="text-xl font-extrabold text-rose-655 pt-1">
                      {totalIncorrect} Qs
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Penalty: -0.33 each</p>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-purple-250 bg-purple-50/50 relative overflow-hidden group hover:border-purple-400 transition-all">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-lg pointer-events-none"></div>
                    <p className="text-[10px] text-slate-600 uppercase font-semibold">🟣 Option E (अनुत्तरित)</p>
                    <h4 className="text-xl font-extrabold text-purple-650 pt-1">
                      {totalOptionE} Qs
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">Safe Skip: 0.00 marks</p>
                  </div>

                  <div className="glass rounded-2xl p-4 border border-amber-250 bg-amber-50/50 relative overflow-hidden group hover:border-amber-400 transition-all">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-lg pointer-events-none"></div>
                    <p className="text-[10px] text-slate-600 uppercase font-semibold">⚠️ Blank Bubble (खाली OMR)</p>
                    <h4 className="text-xl font-extrabold text-amber-600 pt-1">
                      {totalBlank} Qs
                    </h4>
                    <p className="text-[9px] text-slate-500 font-medium mt-1">OMR Penalty: -0.33 each!</p>
                  </div>
                </div>
              );
            })()}

            {/* Performance Verdict Cards (Qualified Status) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">CBT Assessment Status</p>
                <h4 className={`text-base font-bold pt-1 ${lastAttempt.score >= 50 ? "text-emerald-600" : "text-rose-600"}`}>
                  {lastAttempt.score >= 50 ? "✅ QUALIFIED (सफल)" : "❌ REQUIRES REVISION (पुनः प्रयास)"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Cutoff rating evaluated at 50% standard.</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">CBT Pace Velocity</p>
                <h4 className="text-base font-bold text-slate-800 pt-1">
                  {lastAttempt.timeSpent > 0 ? `${Math.round(lastAttempt.timeSpent / lastAttempt.total)} s / Question` : "Practice Mode"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Recommended target: &lt; 90 seconds.</p>
              </div>

              <div className="glass rounded-2xl p-5 space-y-1">
                <p className="text-xs text-slate-500 uppercase font-semibold">Total Time Taken</p>
                <h4 className="text-base font-bold text-indigo-700 pt-1">
                  {lastAttempt.timeSpent > 0 ? `${formatTimer(lastAttempt.timeSpent)} minutes` : "Practice Session"}
                </h4>
                <p className="text-xs text-slate-500 pt-1">Strict Rajasthan Board 5-bubble guidelines active.</p>
              </div>

            </div>

            {/* Dynamic Category Accuracy Stacked Progress Bar Grid */}
            <div className="glass rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Category-wise Analytics (विषयवार विश्लेषण)</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Proportion of correct, incorrect, and skipped questions per category</p>
              </div>

              <div className="space-y-4">
                {activeCategories.map(cat => {
                  // Compute stats for this category inside this specific test
                  const catQuestions = lastAttempt.questions.filter(q => q.category === cat);
                  if (catQuestions.length === 0) return null;

                  let right = 0;
                  let wrong = 0;
                  let optionE = 0;
                  let blank = 0;

                  lastAttempt.questions.forEach((q, idx) => {
                    if (q.category === cat) {
                      const userAns = lastAttempt.answers[idx];
                      if (userAns === 4) {
                        optionE++;
                      } else if (userAns === null) {
                        blank++;
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
                  const optionEPct = Math.round((optionE / totalCat) * 100);
                  const blankPct = 100 - rightPct - wrongPct - optionEPct;

                  return (
                    <div key={cat} className="space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-700">
                        <span>{cat}</span>
                        <span className="text-[10px] text-slate-500">
                          {right} Correct • {wrong} Incorrect • {optionE} Option E • {blank} Blank
                        </span>
                      </div>

                      {/* 4-State OMR Stacked Progress Bar */}
                      <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden flex border border-gray-200">
                        {right > 0 && (
                          <div 
                            className="bg-emerald-500 h-full flex items-center justify-center text-[8px] text-slate-950 font-bold"
                            style={{ width: `${rightPct}%` }}
                            title={`${rightPct}% Correct`}
                          >
                            {rightPct}%
                          </div>
                        )}
                        {wrong > 0 && (
                          <div 
                            className="bg-rose-500 h-full flex items-center justify-center text-[8px] text-white font-bold"
                            style={{ width: `${wrongPct}%` }}
                            title={`${wrongPct}% Incorrect`}
                          >
                            {wrongPct}%
                          </div>
                        )}
                        {optionE > 0 && (
                          <div 
                            className="bg-purple-500 h-full flex items-center justify-center text-[8px] text-white font-bold"
                            style={{ width: `${optionEPct}%` }}
                            title={`${optionEPct}% Skipped (Option E)`}
                          >
                            {optionEPct}%
                          </div>
                        )}
                        {blank > 0 && (
                          <div 
                            className="bg-amber-500 h-full flex items-center justify-center text-[8px] text-slate-950 font-bold"
                            style={{ width: `${blankPct}%` }}
                            title={`${blankPct}% Blank Bubble`}
                          >
                            {blankPct}%
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
                <span className="h-2 w-2 bg-indigo-500 rounded-full animate-ping"></span>
                Official Solution Review Grid (प्रश्नों की समीक्षा)
              </h3>

              <div className="space-y-4">
                {lastAttempt.questions.map((question, idx) => {
                  const selectedIdx = lastAttempt.answers[idx];
                  const isCorrect = selectedIdx === question.answerIndex;

                  return (
                    <div 
                      key={question.id}
                      className="glass rounded-3xl p-6 space-y-4 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-indigo-600 font-bold">
                          Question {idx + 1}
                        </span>
                        
                        {(() => {
                          if (isCorrect) {
                            return (
                              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-250 uppercase tracking-wider">
                                Correct (+1.00)
                              </span>
                            );
                          }
                          if (selectedIdx === 4) {
                            return (
                              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-250 uppercase tracking-wider">
                                Not Attempted (0.00)
                              </span>
                            );
                          }
                          if (selectedIdx === null) {
                            return (
                              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-250 uppercase tracking-wider">
                                Blank OMR Penalty (-0.33)
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-250 uppercase tracking-wider">
                              Incorrect (-0.33)
                            </span>
                          );
                        })()}
                      </div>

                      <h4 className="text-base font-bold text-slate-800 leading-relaxed">
                        {question.question}
                      </h4>

                      {/* Display choices state */}
                      <div className="grid gap-2 text-xs">
                        {question.options.map((option, optIdx) => {
                          const isCorrectChoice = optIdx === question.answerIndex;
                          const isUserSelection = optIdx === selectedIdx;
                          
                          let badgeStyle = "bg-gray-50 border border-gray-200 text-gray-600";
                          if (isCorrectChoice) {
                            badgeStyle = "bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold";
                          } else if (isUserSelection) {
                            badgeStyle = "bg-rose-50 border border-rose-200 text-rose-750";
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
                        <div className="bg-indigo-50/50 rounded-2xl p-4 text-xs text-slate-700 leading-relaxed border border-indigo-100">
                          <p className="font-bold text-indigo-700 flex items-center gap-1 mb-1.5 uppercase tracking-wider">
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
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white border-l border-gray-200 shadow-2xl p-5 flex flex-col justify-between drawer-transition animate-slide-left">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">📝</span>
                <h3 className="text-sm font-bold text-slate-800">Virtual Scratchpad (रफ़ काम)</h3>
              </div>
              <button 
                onClick={() => setShowScratchpad(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            <p className="text-[10px] text-slate-600 mb-3 leading-relaxed">
              पॉइंटर/टच का उपयोग करके यहाँ चित्र बनाएं या गणितीय गणना का रफ़ काम करें।
            </p>

            {/* Canvas Drawing Area */}
            <div className="relative border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                className="w-full h-[380px] bg-white cursor-crosshair touch-none"
              />
            </div>

            {/* Colors and brush controller */}
            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-1.5">
                {["#8b5cf6", "#ef4444", "#10b981", "#fbbf24"].map(col => (
                  <button
                    key={col}
                    onClick={() => setDrawColor(col)}
                    className="h-6 w-6 rounded-full border border-gray-250 cursor-pointer flex items-center justify-center"
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
                  className="rounded bg-white border border-gray-200 text-xs p-1 text-slate-700"
                >
                  <option value={2}>Thin brush</option>
                  <option value={4}>Medium brush</option>
                  <option value={6}>Thick brush</option>
                </select>

                <button
                  onClick={clearCanvas}
                  className="rounded bg-rose-50 border border-rose-200 text-rose-600 text-xs px-3 py-1 font-semibold cursor-pointer"
                >
                  Clear Board
                </button>
              </div>
            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center border-t border-gray-100 pt-4">
            Interactive blackboard vector drawing tool active.
          </div>
        </div>
      )}

      {/* 2. Core CS Cheat Sheet (शॉर्ट नोट्स) */}
      {showCheatSheet && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white border-l border-gray-200 shadow-2xl p-5 flex flex-col justify-between drawer-transition animate-slide-left">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⚡</span>
                <h3 className="text-sm font-bold text-slate-800">CS Quick Revision Sheets</h3>
              </div>
              <button 
                onClick={() => setShowCheatSheet(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-4 text-[10px] font-bold text-slate-500">
              {["DBMS", "DSA", "Programming", "OS"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setCheatTab(tab as any)}
                  className={`flex-1 py-1.5 text-center transition-all cursor-pointer ${
                    cheatTab === tab ? "text-amber-605 border-b-2 border-amber-500" : "text-slate-500 hover:text-slate-800"
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
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1.5 text-slate-700">
                    <h4 className="font-bold text-amber-700">Normalization Forms (नॉर्मलाइजेशन)</h4>
                    <p><strong>1NF:</strong> Attributes must be atomic (no arrays/multivalued values).</p>
                    <p><strong>2NF:</strong> 1NF + No partial dependencies (No non-prime attribute dependent on a part of candidate key).</p>
                    <p><strong>3NF:</strong> 2NF + No transitive dependencies (No non-prime dependent on non-prime).</p>
                    <p><strong>BCNF:</strong> For X ➔ Y, X must be a Super Key.</p>
                    <p><strong>4NF:</strong> Eliminates non-trivial Multi-valued dependencies.</p>
                  </div>
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1.5 text-slate-700">
                    <h4 className="font-bold text-amber-700">ACID Properties</h4>
                    <p><strong>Atomicity:</strong> All or nothing transaction execution.</p>
                    <p><strong>Consistency:</strong> Database constraints remain preserved.</p>
                    <p><strong>Isolation:</strong> Transactions run independently without race states.</p>
                    <p><strong>Durability:</strong> Changes are permanently written to non-volatile disk.</p>
                  </div>
                </div>
              )}

              {cheatTab === "DSA" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 text-slate-750">
                    <h4 className="font-bold text-amber-700 mb-2">Algorithmic Complexities (जटिलता)</h4>
                    <table className="w-full text-left text-[10px]">
                      <thead>
                        <tr className="border-b border-gray-250 text-slate-650">
                          <th className="pb-1.5">Algorithm</th>
                          <th className="pb-1.5">Average</th>
                          <th className="pb-1.5">Worst</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-slate-700">
                        <tr>
                          <td className="py-1.5">Quick Sort</td>
                          <td>O(n log n)</td>
                          <td className="text-rose-600 font-semibold">O(n²)</td>
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
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1 text-slate-700">
                    <h4 className="font-bold text-amber-700">Traversal Models</h4>
                    <p><strong>In-order (L-Root-R):</strong> BST traversal yields sorted ascending numbers.</p>
                    <p><strong>Pre-order (Root-L-R):</strong> Copies BST structure.</p>
                    <p><strong>BFS:</strong> Queue matrix logic (level-by-level search).</p>
                    <p><strong>DFS:</strong> Stack logic (depth first search).</p>
                  </div>
                </div>
              )}

              {cheatTab === "Programming" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1.5 text-slate-700">
                    <h4 className="font-bold text-amber-700">C++ OOP Rules</h4>
                    <p><strong>final Class:</strong> Prevent inheritance (`class Derived final : base {}`).</p>
                    <p><strong>virtual override:</strong> Prevent overriding with `final` virtual function.</p>
                    <p><strong>friend function:</strong> External function allowed to query private attributes.</p>
                  </div>
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1.5 text-slate-700">
                    <h4 className="font-bold text-amber-700">Web CSS parameters</h4>
                    <p><strong>display: flex:</strong> Convert container element to dynamic Flex layout.</p>
                    <p><strong>flex-direction:</strong> row, row-reverse, column, column-reverse.</p>
                  </div>
                </div>
              )}

              {cheatTab === "OS" && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1.5 text-slate-700">
                    <h4 className="font-bold text-amber-700">Page Replacement</h4>
                    <p><strong>Belady's Anomaly:</strong> Increasing frames leads to MORE page faults. Exclusively affects FIFO algorithm.</p>
                    <p><strong>LRU:</strong> Replaces page least recently requested by processes.</p>
                  </div>
                  <div className="bg-amber-50/40 border border-amber-100/75 rounded-xl p-4 space-y-1.5 text-slate-700">
                    <h4 className="font-bold text-amber-700">Process Scheduling</h4>
                    <p><strong>Starvation:</strong> Shortest Job First (SJF) and Priority (without aging) causes low priority processes to wait indefinitely.</p>
                    <p><strong>Round Robin:</strong> FCFS with time slice (quantum). No starvation.</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="text-[9px] text-slate-500 text-center border-t border-gray-100 pt-4">
            Bilingual CS formula note sheets loaded.
          </div>
        </div>
      )}

      {/* 3. Draggable Programmer Calculator Popup (गणना यंत्र) */}
      {showCalculator && (
        <div className="fixed bottom-6 right-6 z-50 w-72 bg-white border border-gray-200 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 animate-slide-up text-slate-800">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700">
              <span>🧮</span>
              <span>Scientific & Base Calculator</span>
            </div>
            <button 
              onClick={() => setShowCalculator(false)}
              className="p-0.5 hover:bg-gray-100 rounded-full transition-colors text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <XIcon size={14} />
            </button>
          </div>

          {/* Calculator Screen */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-right">
            <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Base Mode: {calcBase}</span>
            <div className="text-xs text-slate-550 font-mono h-4 overflow-hidden truncate">{calcInput || "0"}</div>
            <div className="text-lg font-bold font-mono text-indigo-700 truncate mt-1">{calcResult || "0"}</div>
          </div>

          {/* Keypads */}
          <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold">
            {calcBtns.map(btn => (
              <button
                key={btn}
                onClick={() => handleCalcBtn(btn)}
                className={`py-2 rounded-lg cursor-pointer transition-colors ${
                  btn === "=" ? "bg-indigo-600 hover:bg-indigo-500 text-white col-span-2" :
                  ["DEC", "BIN", "HEX", "C"].includes(btn) ? "bg-indigo-50 hover:bg-indigo-100 text-indigo-700" :
                  "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {btn === "=" && calcResult ? "Solve" : btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-6 md:px-12 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SSC CBT Exam Preparation Portal • Computer Instructor Exam</p>
          <div className="flex items-center gap-3 text-gray-400">
            <span>🔥 Firebase Powered</span>
            <span>•</span>
            <span>Responsive Design</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
