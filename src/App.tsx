import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookOpen,
  PenTool,
  Sparkles,
  Download,
  Copy,
  Printer,
  History,
  RotateCcw,
  Plus,
  Compass,
  CheckCircle,
  FileText,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Award,
  Trash2,
  Edit3,
  Book,
  ChevronDown,
  Search,
  ExternalLink,
  Activity,
  Settings,
  X,
  Globe,
  FileSpreadsheet,
  Check,
  Maximize2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3
} from "lucide-react";
import { exportToDocx } from "./utils/docxExporter";
import { SettingsModal } from "./components/SettingsModal";
import { SyllabusModal } from "./components/SyllabusModal";
import { ReferenceModal } from "./components/ReferenceModal";
import { AssistantModal } from "./components/AssistantModal";
import { InteractiveQuiz, ParsedMCQ } from "./components/InteractiveQuiz";

const gujaratiToEnglishDigits = (str: string): string => {
  const map: Record<string, string> = {
    '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4',
    '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9'
  };
  return str.replace(/[૦-૯]/g, (m) => map[m]);
};

const parseMCQs = (mcqText: string): ParsedMCQ[] => {
  const lines = mcqText.split("\n");
  const mcqs: ParsedMCQ[] = [];
  let currentMcq: ParsedMCQ | null = null;
  const answerMap: Record<string, string> = {};

  // Find answers like "1. A" or "૧. A" or "૧ - A"
  const answerRegex = /(?:^|\s|\||:)\*?\*?(\d+|[૧-૯][૦-૯]*)\*?\*?\s*[\.\-:\/|]\s*\(?\*?\*?([A-Da-d])\*?\*?\)?/g;
  let match;
  while ((match = answerRegex.exec(mcqText)) !== null) {
    const qNum = gujaratiToEnglishDigits(match[1]);
    const ans = match[2].toUpperCase();
    answerMap[qNum] = ans;
  }

  // Parse markdown tables of answers, if any
  const tableRows = lines.filter(l => l.includes("|"));
  if (tableRows.length >= 2) {
    for (let i = 0; i < tableRows.length - 1; i++) {
      const row1 = tableRows[i].split("|").map(s => s.trim()).filter(Boolean);
      const row2 = tableRows[i+1].split("|").map(s => s.trim()).filter(Boolean);
      if (row1.length === row2.length && row1.length > 2) {
        const isNumRow = row1.some(cell => /\d|[૧-૯]/.test(cell));
        const isOptRow = row2.some(cell => /^[A-D]$/i.test(cell));
        if (isNumRow && isOptRow) {
          for (let j = 0; j < row1.length; j++) {
            const numVal = gujaratiToEnglishDigits(row1[j]);
            const optVal = row2[j].toUpperCase();
            if (/^\d+$/.test(numVal) && /^[A-D]$/.test(optVal)) {
              answerMap[numVal] = optVal;
            }
          }
        }
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if it's a question line
    const questionMatch = line.match(/^\s*\*?\*?(\d+|[૧-૯][૦-૯]*)\s*[\.\)]\s*(.*)/);
    if (questionMatch) {
      if (currentMcq) {
        mcqs.push(currentMcq);
      }
      const qNum = gujaratiToEnglishDigits(questionMatch[1]);
      currentMcq = {
        index: qNum,
        question: questionMatch[2].replace(/\*\*+/g, "").trim(),
        options: { A: "", B: "", C: "", D: "" }
      };
      continue;
    }

    if (currentMcq) {
      // Check for options
      const optAMatch = line.match(/^\s*[-*]*\s*\*?\*?\(?[Aa]\)?\s*[\.\-:]?\s*\*?\*?\s*(.*)/);
      if (optAMatch) {
        currentMcq.options.A = optAMatch[1].replace(/\*\*+/g, "").trim();
        continue;
      }
      const optBMatch = line.match(/^\s*[-*]*\s*\*?\*?\(?[Bb]\)?\s*[\.\-:]?\s*\*?\*?\s*(.*)/);
      if (optBMatch) {
        currentMcq.options.B = optBMatch[1].replace(/\*\*+/g, "").trim();
        continue;
      }
      const optCMatch = line.match(/^\s*[-*]*\s*\*?\*?\(?[Cc]\)?\s*[\.\-:]?\s*\*?\*?\s*(.*)/);
      if (optCMatch) {
        currentMcq.options.C = optCMatch[1].replace(/\*\*+/g, "").trim();
        continue;
      }
      const optDMatch = line.match(/^\s*[-*]*\s*\*?\*?\(?[Dd]\)?\s*[\.\-:]?\s*\*?\*?\s*(.*)/);
      if (optDMatch) {
        currentMcq.options.D = optDMatch[1].replace(/\*\*+/g, "").trim();
        continue;
      }

      if (!line.includes("|") && !line.includes("જવાબો") && !line.includes("સાચો વિકલ્પ") && !line.startsWith("#")) {
        currentMcq.question += " " + line;
      }
    }
  }

  if (currentMcq) {
    mcqs.push(currentMcq);
  }

  mcqs.forEach(mcq => {
    if (answerMap[mcq.index]) {
      mcq.correctAnswer = answerMap[mcq.index];
    }
  });

  return mcqs.filter(m => m.question && m.options.A && m.options.B);
};

// Types
interface ChapterHistoryItem {
  id: string;
  title: string;
  subject: string;
  examLevel: string;
  tone: string;
  length: string;
  content: string;
  additionalInstructions?: string;
  createdAt: string;
}

const SUBJECTS = [
  { id: "guj_history", name: "ગુજરાતનો ઇતિહાસ (History of Gujarat)", icon: BookOpen, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { id: "cultural_heritage", name: "સાંસ્કૃતિક વારસો (Cultural Heritage)", icon: Compass, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "guj_literature", name: "ગુજરાતી સાહિત્ય (Gujarati Literature)", icon: PenTool, color: "text-teal-600 bg-teal-50 border-teal-200" },
  { id: "indian_polity", name: "ભારતનું બંધારણ (Indian Constitution)", icon: Award, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { id: "geography", name: "ભૂગોળ (Geography of India & Gujarat)", icon: Book, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "science_tech", name: "વિજ્ઞાન અને ટેકનોલોજી (Science & Technology)", icon: Sparkles, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "xray_tech", name: "એક્સ-રે ટેકનિશિયન (X-Ray Technician)", icon: Activity, color: "text-rose-600 bg-rose-50 border-rose-200" }
];

const EXAM_LEVELS = [
  "GPSC Class 1/2 (મેન્સ અને પ્રિલિમ્સ)",
  "DySO / STI / નાયબ મામલતદાર",
  "PSI / Constable / પોલીસ ભરતી",
  "Class 3 (બિન સચિવાલય ક્લર્ક, તલાટી, જુનિયર ક્લર્ક)",
  "Class 3 Technical (GSSSB / GPSSB / ટેકનિકલ)",
  "General / All Gujarat Exams"
];

const WRITING_TONES = [
  "Syllabus-aligned (અભ્યાસક્રમ મુજબ)",
  "Point-wise Facts (મુદ્દાસર તથ્યો)",
  "Deep Analytical (વિશ્લેષણાત્મક શૈલી)",
  "Lucid Storytelling (સરળ પ્રવાહી શૈલી)"
];

const LENGTH_OPTIONS = [
  { label: "ટૂંકું (Short)", desc: "૬ો૦-૮૦૦ શબ્દો", value: "Short" },
  { label: "સામાન્ય (Standard)", desc: "૧૨૦૦-૧૫૦૦ શબ્દો", value: "Standard" },
  { label: "વિગતવાર (Detailed)", desc: "૨૫૦૦+ શબ્દો", value: "Detailed" }
];

const TEMPLATES = [
  {
    title: "સોલંકી વંશનો સુવર્ણકાળ અને સ્થાપત્ય કલા",
    subject: "ગુજરાતનો ઇતિહાસ (History of Gujarat)",
    examLevel: "GPSC Class 1/2 (મેન્સ અને પ્રિલિમ્સ)",
    tone: "Syllabus-aligned (અભ્યાસક્રમ મુજબ)",
    length: "Standard",
    additionalInstructions: "સિદ્ધરાજ જયસિંહ, કુમારપાળ, પાટણની પટોળા અને મોઢેરાનું સૂર્યમંદિર વિશે ઊંડાણપૂર્વક વિગતો સામેલ કરો."
  },
  {
    title: "ગુજરાતના લોકમેળાઓ અને ભવાઈ કલા",
    subject: "સાંસ્કૃતિક વારસો (Cultural Heritage)",
    examLevel: "DySO / STI / નાયબ મામલતદાર",
    tone: "Lucid Storytelling (સરળ પ્રવાહી શૈલી)",
    length: "Standard",
    additionalInstructions: "તરણેતરનો મેળો, વૌઠાનો મેળો, શામળાજીનો મેળો અને અસાહિત ઠાકરનું પ્રદાન સવિસ્તાર લખો."
  },
  {
    title: "ગુજરાતી ભાષાના જ્ઞાનપીઠ પુરસ્કાર વિજેતાઓ",
    subject: "ગુજરાતી સાહિત્ય (Gujarati Literature)",
    examLevel: "Class 3 (બિન સચિવાલય ક્લર્ક, તલાટી, જુનિયર ક્લર્ક)",
    tone: "Point-wise Facts (મુદ્દાસર તથ્યો)",
    length: "Short",
    additionalInstructions: "ઉમાશંકર જોશી (નિશીથ), પન્નાલાલ પટેલ (માનવીની ભવાઈ), રાજેન્દ્ર શાહ, અને રઘુવીર ચૌધરી વિશેની વિગતો અને વર્ષો યાદી રૂપે દર્શાવો."
  },
  {
    title: "X-Ray ટ્યુબની રચના અને કાર્યપદ્ધતિ (Structure of X-Ray Tube)",
    subject: "એક્સ-રે ટેકનિશિયન (X-Ray Technician)",
    examLevel: "General / All Gujarat Exams",
    tone: "Syllabus-aligned (અભ્યાસક્રમ મુજબ)",
    length: "Standard",
    additionalInstructions: "કેથોડ (Cathode), એનોડ (Anode), રોટેટીંગ ટાર્ગેટ (Rotating Target), થર્મિઓનિક એમિશન (Thermionic Emission) અને ગ્રીડ (Grid) ના સિદ્ધાંતો સ્પષ્ટ આકૃતિ વિગતો અને વન-લાઇનર સાથે દર્શાવો."
  }
];

export default function App() {
  // Config state
  const [subject, setSubject] = useState(() => localStorage.getItem("ks_setting_subject") || "સામાન્ય જ્ઞાન અને સરકારી અભ્યાસક્રમ (Class 3)");
  const [title, setTitle] = useState(() => localStorage.getItem("ks_setting_title") || "");
  const [examLevel, setExamLevel] = useState(() => localStorage.getItem("ks_setting_examLevel") || "Class 3 (CCE / ગૌણ સેવા ભરતી / તલાટી)");
  const [tone, setTone] = useState(() => localStorage.getItem("ks_setting_tone") || "Point-wise Facts (મુદ્દાસર તથ્યો)");
  const [length, setLength] = useState(() => localStorage.getItem("ks_setting_length") || "Standard");
  const [additionalInstructions, setAdditionalInstructions] = useState(() => localStorage.getItem("ks_setting_additionalInstructions") || "");

  // Docx Export settings states
  const [docxHeader, setDocxHeader] = useState(() => localStorage.getItem("ks_setting_docxHeader") || "નોલેજ સંકુલ - લર્નિંગ મટીરીયલ (Class 3)");
  const [docxFooter, setDocxFooter] = useState(() => localStorage.getItem("ks_setting_docxFooter") || "અધિકૃત લર્નિંગ મટીરીયલ");
  const [docxFont, setDocxFont] = useState(() => localStorage.getItem("ks_setting_docxFont") || "Hind Vadodara");
  const [docxFontSize, setDocxFontSize] = useState(() => Number(localStorage.getItem("ks_setting_docxFontSize") || 11));
  const [docxColor, setDocxColor] = useState(() => localStorage.getItem("ks_setting_docxColor") || "0F766E"); // default teal

  // MS Word style Advanced Watermark settings states
  const [docxWatermarkType, setDocxWatermarkType] = useState<"none" | "text" | "picture">(() => (localStorage.getItem("ks_setting_docxWatermarkType") as any) || "picture");
  const [docxWatermark, setDocxWatermark] = useState(() => localStorage.getItem("ks_setting_docxWatermark") || "KNOWLEDGE SANKUL");
  const [docxWatermarkFont, setDocxWatermarkFont] = useState(() => localStorage.getItem("ks_setting_docxWatermarkFont") || "Hind Vadodara");
  const [docxWatermarkSize, setDocxWatermarkSize] = useState<string | number>(() => {
    const val = localStorage.getItem("ks_setting_docxWatermarkSize");
    if (!val) return "Auto";
    return isNaN(Number(val)) ? val : Number(val);
  });
  const [docxWatermarkColor, setDocxWatermarkColor] = useState(() => localStorage.getItem("ks_setting_docxWatermarkColor") || "CBD5E1");
  const [docxWatermarkSemitransparent, setDocxWatermarkSemitransparent] = useState(() => localStorage.getItem("ks_setting_docxWatermarkSemitransparent") !== "false");
  const [docxWatermarkLayout, setDocxWatermarkLayout] = useState<"diagonal" | "horizontal">(() => (localStorage.getItem("ks_setting_docxWatermarkLayout") as any) || "diagonal");
  const [docxWatermarkImage, setDocxWatermarkImage] = useState<string | null>(() => localStorage.getItem("ks_setting_docxWatermarkImage") || null);

  // Additional settings from screenshots
  const [includeMcqs, setIncludeMcqs] = useState(() => localStorage.getItem("ks_setting_includeMcqs") !== "false");
  const [authoringLanguage, setAuthoringLanguage] = useState(() => localStorage.getItem("ks_setting_authoringLanguage") || "Gujarati (GU)");
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem("ks_setting_appTheme") || "Bright / Light Mode");
  const [appNameEnglish, setAppNameEnglish] = useState(() => localStorage.getItem("ks_setting_appNameEnglish") || "Knowledge Sankul");
  const [appNameGujarati, setAppNameGujarati] = useState(() => localStorage.getItem("ks_setting_appNameGujarati") || "નોલેજ સંકુલ");
  const [webFooterLeft, setWebFooterLeft] = useState(() => localStorage.getItem("ks_setting_webFooterLeft") || "Content Created by Knowledge Sankul Experts • © 2026");
  const [webFooterRight1, setWebFooterRight1] = useState(() => localStorage.getItem("ks_setting_webFooterRight1") || "Target Exams: AFSO, MPHW, Staff Nurse");
  const [webFooterRight2, setWebFooterRight2] = useState(() => localStorage.getItem("ks_setting_webFooterRight2") || "Accuracy: 100% Verified");

  // Word formatting advanced colors & details
  const [themeColorPrimary, setThemeColorPrimary] = useState(() => localStorage.getItem("ks_setting_themeColorPrimary") || "#0F766E");
  const [themeColorSecondary, setThemeColorSecondary] = useState(() => localStorage.getItem("ks_setting_themeColorSecondary") || "#DC2626");
  const [themeColorAccent, setThemeColorAccent] = useState(() => localStorage.getItem("ks_setting_themeColorAccent") || "#10B981");
  const [docxFontSizeH1, setDocxFontSizeH1] = useState(() => Number(localStorage.getItem("ks_setting_docxFontSizeH1") || 20));
  const [docxFontSizeH2, setDocxFontSizeH2] = useState(() => Number(localStorage.getItem("ks_setting_docxFontSizeH2") || 16));
  const [docxFontSizeH3, setDocxFontSizeH3] = useState(() => Number(localStorage.getItem("ks_setting_docxFontSizeH3") || 14));
  const [docxFontSizeP, setDocxFontSizeP] = useState(() => Number(localStorage.getItem("ks_setting_docxFontSizeP") || 12));
  const [docxIncludeCoverPage, setDocxIncludeCoverPage] = useState(() => localStorage.getItem("ks_setting_docxIncludeCoverPage") === "true");
  const [docxAutoSectionNumbering, setDocxAutoSectionNumbering] = useState(() => localStorage.getItem("ks_setting_docxAutoSectionNumbering") === "true");

  // Watermark details
  const [docxWatermarkScale, setDocxWatermarkScale] = useState(() => localStorage.getItem("ks_setting_docxWatermarkScale") || "Auto");
  const [docxWatermarkWashout, setDocxWatermarkWashout] = useState(() => localStorage.getItem("ks_setting_docxWatermarkWashout") !== "false");

  // Modal open & active tab state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Syllabus list helper state or view
  const [isSyllabusOpen, setIsSyllabusOpen] = useState(false);
  // Paste reference helper state
  const [isReferenceOpen, setIsReferenceOpen] = useState(false);
  const [pastedReference, setPastedReference] = useState("");

  // UI state
  const [currentChapter, setCurrentChapter] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selection refiner state
  const [selectedText, setSelectedText] = useState("");
  const [refineInstruction, setRefineInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  // History & Persistence state
  const [historyList, setHistoryList] = useState<ChapterHistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Editor toggle state
  const [isEditMode, setIsEditMode] = useState(false);
  const [localEditText, setLocalEditText] = useState("");
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState(false);

  // Advanced AI & Modal States
  const [enableSearch, setEnableSearch] = useState(() => localStorage.getItem("ks_setting_enableSearch") === "true");
  const [enableThinking, setEnableThinking] = useState(() => localStorage.getItem("ks_setting_enableThinking") === "true");
  const [groundingSources, setGroundingSources] = useState<{ title: string; uri: string }[]>([]);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("saved");

  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Split chapter into Book Content and MCQ section
  const { bookText, mcqText } = React.useMemo(() => {
    if (!currentChapter) return { bookText: "", mcqText: "" };
    // Find heading with હેતુલક્ષી પ્રશ્નોત્તરી or Mock MCQs
    const mcqHeaderIndex = currentChapter.search(/(?:###|##|#)?\s*\*?\*?હેતુલક્ષી પ્રશ્નોત્તરી/i);
    if (mcqHeaderIndex !== -1) {
      const bText = currentChapter.substring(0, mcqHeaderIndex).trim();
      const mText = currentChapter.substring(mcqHeaderIndex).trim();
      return { bookText: bText, mcqText: mText };
    }
    return { bookText: currentChapter, mcqText: "" };
  }, [currentChapter]);

  const parsedMcqs = React.useMemo(() => {
    if (!mcqText) return [];
    return parseMCQs(mcqText);
  }, [mcqText]);

  const handleFormat = (type: "bold" | "italic" | "bullet" | "number" | "h1" | "h2" | "h3") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let replacement = "";
    let newCursorPos = start;

    switch (type) {
      case "bold":
        replacement = `**${selectedText || "ઠોસ લખાણ"}**`;
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 8);
        break;
      case "italic":
        replacement = `*${selectedText || "ત્રાંસુ લખાણ"}*`;
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 12);
        break;
      case "bullet":
        if (selectedText.includes("\n")) {
          replacement = selectedText
            .split("\n")
            .map((line) => line.startsWith("- ") ? line : `- ${line}`)
            .join("\n");
        } else {
          replacement = `- ${selectedText || "યાદી વસ્તુ"}`;
        }
        newCursorPos = start + replacement.length;
        break;
      case "number":
        if (selectedText.includes("\n")) {
          replacement = selectedText
            .split("\n")
            .map((line, idx) => {
              const prefix = `${idx + 1}. `;
              return line.match(/^\d+\.\s/) ? line : `${prefix}${line}`;
            })
            .join("\n");
        } else {
          replacement = `1. ${selectedText || "ક્રમિક યાદી વસ્તુ"}`;
        }
        newCursorPos = start + replacement.length;
        break;
      case "h1":
        replacement = `\n# ${selectedText || "મુખ્ય શીર્ષક 1"}\n`;
        newCursorPos = start + replacement.length;
        break;
      case "h2":
        replacement = `\n## ${selectedText || "પેટા શીર્ષક 2"}\n`;
        newCursorPos = start + replacement.length;
        break;
      case "h3":
        replacement = `\n### ${selectedText || "પેટા શીર્ષક 3"}\n`;
        newCursorPos = start + replacement.length;
        break;
      default:
        return;
    }

    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setLocalEditText(newValue);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Load history & check for autosave on mount
  useEffect(() => {
    const saved = localStorage.getItem("knowledge_sankul_history");
    if (saved) {
      try {
        setHistoryList(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history logs", e);
      }
    }

    const savedAutosave = localStorage.getItem("knowledge_sankul_autosave");
    if (savedAutosave) {
      try {
        const parsed = JSON.parse(savedAutosave);
        if (parsed && parsed.localEditText) {
          setLocalEditText(parsed.localEditText);
          setCurrentChapter(parsed.localEditText);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.subject) setSubject(parsed.subject);
          if (parsed.examLevel) setExamLevel(parsed.examLevel);
          if (parsed.tone) setTone(parsed.tone);
          if (parsed.length) setLength(parsed.length);
          if (parsed.additionalInstructions) setAdditionalInstructions(parsed.additionalInstructions);
          if (parsed.activeHistoryId) setActiveHistoryId(parsed.activeHistoryId);
          setIsEditMode(true);
          setTimeout(() => {
            showNotification("તમારો છેલ્લો ડ્રાફ્ટ આપમેળે પુનઃસ્થાપિત (Restored) કરવામાં આવ્યો છે!");
          }, 1000);
        }
      } catch (e) {
        console.error("Failed to parse autosave draft", e);
      }
    }
  }, []);

  // Dynamically set matching, gorgeous color presets for headings (H1, H2, H3) based on selected subject
  useEffect(() => {
    if (subject === "ગુજરાતનો ઇતિહાસ (History of Gujarat)") {
      setThemeColorPrimary("#1E3A8A"); // Deep Royal Blue
      setThemeColorSecondary("#2563EB"); // Vibrant Blue
      setThemeColorAccent("#0284C7"); // Clean Cyan-Blue
    } else if (subject === "સાંસ્કૃતિક વારસો (Cultural Heritage)") {
      setThemeColorPrimary("#78350F"); // Deep Warm Amber/Brown
      setThemeColorSecondary("#D97706"); // Bright Amber
      setThemeColorAccent("#B45309"); // Rich Gold-Brown
    } else if (subject === "ગુજરાતી સાહિત્ય (Gujarati Literature)") {
      setThemeColorPrimary("#0F766E"); // Elegant Dark Teal
      setThemeColorSecondary("#14B8A6"); // Vibrant Teal
      setThemeColorAccent("#0891B2"); // Ocean Cyan
    } else if (subject === "ભારતનું બંધારણ (Indian Constitution)") {
      setThemeColorPrimary("#5B21B6"); // Authoritative Deep Purple
      setThemeColorSecondary("#7C3AED"); // Medium Violet
      setThemeColorAccent("#2563EB"); // Trusted Blue
    } else if (subject === "ભૂગોળ (Geography of India & Gujarat)") {
      setThemeColorPrimary("#065F46"); // Deep Forest Green
      setThemeColorSecondary("#10B981"); // Bright Emerald Green
      setThemeColorAccent("#047857"); // Slate Green
    } else if (subject === "વિજ્ઞાન અને ટેકનોલોજી (Science & Technology)") {
      setThemeColorPrimary("#3730A3"); // Modern Tech Indigo
      setThemeColorSecondary("#4F46E5"); // Royal Indigo
      setThemeColorAccent("#0891B2"); // High-Tech Cyan
    } else if (subject === "એક્સ-રે ટેકનિશિયન (X-Ray Technician)") {
      setThemeColorPrimary("#9F1239"); // Professional Dark Rose
      setThemeColorSecondary("#E11D48"); // Diagnostic Rose
      setThemeColorAccent("#BE123C"); // Red-Rose
    }
  }, [subject]);

  // Persistent Settings Sync
  useEffect(() => {
    localStorage.setItem("ks_setting_subject", subject);
    localStorage.setItem("ks_setting_title", title);
    localStorage.setItem("ks_setting_examLevel", examLevel);
    localStorage.setItem("ks_setting_tone", tone);
    localStorage.setItem("ks_setting_length", length);
    localStorage.setItem("ks_setting_additionalInstructions", additionalInstructions);
    localStorage.setItem("ks_setting_docxHeader", docxHeader);
    localStorage.setItem("ks_setting_docxFooter", docxFooter);
    localStorage.setItem("ks_setting_docxFont", docxFont);
    localStorage.setItem("ks_setting_docxFontSize", String(docxFontSize));
    localStorage.setItem("ks_setting_docxColor", docxColor);
    localStorage.setItem("ks_setting_docxWatermarkType", docxWatermarkType);
    localStorage.setItem("ks_setting_docxWatermark", docxWatermark);
    localStorage.setItem("ks_setting_docxWatermarkFont", docxWatermarkFont);
    localStorage.setItem("ks_setting_docxWatermarkSize", String(docxWatermarkSize));
    localStorage.setItem("ks_setting_docxWatermarkColor", docxWatermarkColor);
    localStorage.setItem("ks_setting_docxWatermarkSemitransparent", String(docxWatermarkSemitransparent));
    localStorage.setItem("ks_setting_docxWatermarkLayout", docxWatermarkLayout);
    if (docxWatermarkImage) {
      localStorage.setItem("ks_setting_docxWatermarkImage", docxWatermarkImage);
    } else {
      localStorage.removeItem("ks_setting_docxWatermarkImage");
    }
    localStorage.setItem("ks_setting_includeMcqs", String(includeMcqs));
    localStorage.setItem("ks_setting_authoringLanguage", authoringLanguage);
    localStorage.setItem("ks_setting_appTheme", appTheme);
    localStorage.setItem("ks_setting_appNameEnglish", appNameEnglish);
    localStorage.setItem("ks_setting_appNameGujarati", appNameGujarati);
    localStorage.setItem("ks_setting_webFooterLeft", webFooterLeft);
    localStorage.setItem("ks_setting_webFooterRight1", webFooterRight1);
    localStorage.setItem("ks_setting_webFooterRight2", webFooterRight2);
    localStorage.setItem("ks_setting_themeColorPrimary", themeColorPrimary);
    localStorage.setItem("ks_setting_themeColorSecondary", themeColorSecondary);
    localStorage.setItem("ks_setting_themeColorAccent", themeColorAccent);
    localStorage.setItem("ks_setting_docxFontSizeH1", String(docxFontSizeH1));
    localStorage.setItem("ks_setting_docxFontSizeH2", String(docxFontSizeH2));
    localStorage.setItem("ks_setting_docxFontSizeH3", String(docxFontSizeH3));
    localStorage.setItem("ks_setting_docxFontSizeP", String(docxFontSizeP));
    localStorage.setItem("ks_setting_docxIncludeCoverPage", String(docxIncludeCoverPage));
    localStorage.setItem("ks_setting_docxAutoSectionNumbering", String(docxAutoSectionNumbering));
    localStorage.setItem("ks_setting_docxWatermarkScale", docxWatermarkScale);
    localStorage.setItem("ks_setting_docxWatermarkWashout", String(docxWatermarkWashout));
    localStorage.setItem("ks_setting_enableSearch", String(enableSearch));
    localStorage.setItem("ks_setting_enableThinking", String(enableThinking));
  }, [
    subject, title, examLevel, tone, length, additionalInstructions,
    docxHeader, docxFooter, docxFont, docxFontSize, docxColor,
    docxWatermarkType, docxWatermark, docxWatermarkFont, docxWatermarkSize,
    docxWatermarkColor, docxWatermarkSemitransparent, docxWatermarkLayout, docxWatermarkImage,
    includeMcqs, authoringLanguage, appTheme, appNameEnglish, appNameGujarati,
    webFooterLeft, webFooterRight1, webFooterRight2,
    themeColorPrimary, themeColorSecondary, themeColorAccent,
    docxFontSizeH1, docxFontSizeH2, docxFontSizeH3, docxFontSizeP,
    docxIncludeCoverPage, docxAutoSectionNumbering,
    docxWatermarkScale, docxWatermarkWashout,
    enableSearch, enableThinking
  ]);

  // Debounced auto-save for editor text & metadata
  useEffect(() => {
    if (!isEditMode || !localEditText) return;

    // Set saving state as soon as text/options change
    setSaveStatus("saving");

    const timer = setTimeout(() => {
      const autosaveData = {
        localEditText,
        title,
        subject,
        examLevel,
        tone,
        length,
        additionalInstructions,
        activeHistoryId,
        timestamp: Date.now()
      };
      localStorage.setItem("knowledge_sankul_autosave", JSON.stringify(autosaveData));
      
      // Sync with active history item if exists so history view is also kept up to date
      if (activeHistoryId) {
        setHistoryList(prev => {
          const updated = prev.map(item => {
            if (item.id === activeHistoryId) {
              return { ...item, content: localEditText, title: title };
            }
            return item;
          });
          localStorage.setItem("knowledge_sankul_history", JSON.stringify(updated));
          return updated;
        });
      }

      setSaveStatus("saved");
    }, 1500); // Debounce save for 1.5 seconds

    return () => clearTimeout(timer);
  }, [localEditText, title, subject, examLevel, tone, length, additionalInstructions, activeHistoryId, isEditMode]);

  // Save history helper
  const saveHistory = (newList: ChapterHistoryItem[]) => {
    setHistoryList(newList);
    localStorage.setItem("knowledge_sankul_history", JSON.stringify(newList));
  };

  // Selection watcher
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 10) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText("");
    }
  };

  // Copy text helper
  const handleCopy = () => {
    const textToCopy = isEditMode ? localEditText : currentChapter;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    showNotification("પ્રકરણ ક્લિપબોર્ડમાં કોપી થઈ ગયું છે!");
  };

  // Notification helper
  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Download markdown file helper
  const handleDownload = () => {
    const textToDownload = isEditMode ? localEditText : currentChapter;
    if (!textToDownload) return;
    const cleanTitle = title.trim().replace(/\s+/g, "_") || "chapter";
    const blob = new Blob([textToDownload], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${cleanTitle}_નોલેજ_સંકુલ.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("મેનીફેસ્ટ Markdown ફાઇલ ડાઉનલોડ થઈ ગઈ છે!");
  };

  // Download DOCX file helper
  const handleDownloadDocx = async () => {
    const textToDownload = isEditMode ? localEditText : currentChapter;
    if (!textToDownload) return;
    try {
      showNotification("વર્ડ (.docx) ફાઇલ તૈયાર થઈ રહી છે...");
      await exportToDocx({
        title,
        content: textToDownload,
        headerText: docxHeader,
        footerText: docxFooter,
        watermarkType: docxWatermarkType,
        watermarkText: docxWatermark,
        watermarkFont: docxWatermarkFont,
        watermarkSize: docxWatermarkSize,
        watermarkColor: docxWatermarkColor,
        watermarkSemitransparent: docxWatermarkSemitransparent,
        watermarkLayout: docxWatermarkLayout,
        fontFamily: docxFont,
        baseFontSize: docxFontSize,
        themeColor: docxColor,
        watermarkImage: docxWatermarkImage,
      });
      showNotification("વર્ડ (.docx) ફાઇલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગઈ છે!");
    } catch (e: any) {
      console.error(e);
      setError("વર્ડ (.docx) એક્સપોર્ટ પ્રક્રિયા દરમિયાન ભૂલ આવી: " + e.message);
    }
  };

  // Apply template helper
  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    setSubject(tpl.subject);
    setTitle(tpl.title);
    setExamLevel(tpl.examLevel);
    setTone(tpl.tone);
    setLength(tpl.length);
    setAdditionalInstructions(tpl.additionalInstructions);
    showNotification("ટેમ્પલેટ પસંદગી સફળતાપૂર્વક લાગુ કરવામાં આવી છે!");
  };

  // Handle Generate Chapter Call
  const handleGenerate = async (isOutlineOnly: any = false) => {
    if (!title.trim()) {
      setError("કૃપા કરીને પ્રકરણનું શીર્ષક લખો.");
      return;
    }

    const isActualOutline = isOutlineOnly === true;

    setIsGenerating(true);
    setError(null);
    setSelectedText("");

    try {
      // Append MCQs custom instruction if unchecked
      let finalInstructions = additionalInstructions || "";
      if (!includeMcqs) {
        finalInstructions += "\n[CRITICAL FORMATTING RULE: DO NOT INCLUDE ANY MCQS OR QUESTIONNAIRES AT THE END OF THE CHAPTER. CONCENTRATE SOLELY ON DISCUSSIVE CONTENT AND STUDY FACTS.]";
      } else {
        finalInstructions += "\n[CRITICAL FORMATTING RULE: INCLUDE A DETAILED PRACTICAL MCQ SECTION AT THE END OF THE CHAPTER WITH EXACTLY 15 HIGH-YIELD QUESTIONS IN GUJARATI. DO NOT INCLUDE ANY EXPLANATIONS (સમજૂતી) FOR THE QUESTIONS. TO ENSURE OUTSTANDING READABILITY, LIST ALL CORRECT ANSWERS (જવાબો) AT THE VERY END OF THIS MCQ SECTION IN A BEAUTIFUL, HIGHLY SPACIOUS, NEAT MARKDOWN TABLE OR POINT-WISE LIST WITH PLENTY OF NEGATIVE SPACE. NO SPACE LIMITATIONS REMAIN.]";
      }

      // Append Image descriptions instruction
      finalInstructions += "\n[CRITICAL FORMATTING RULE: WHEREVER AN IMAGE, ILLUSTRATION, DIAGRAM, OR CHART IS HELPFUL TO EXPLAIN OR COMPREHEND THE CHAPTER CONTENT, INCLUDE A DETAILED DESCRIPTION PLACEHOLDER OF THAT IMAGE ENTIRELY WRITTEN IN GUJARATI ENCLOSED IN BRACKETS (E.G., [ચિત્ર: પૃથ્વીના આંતરિક સ્તરોની આકૃતિ]).]";

      if (pastedReference.trim()) {
        finalInstructions += `\n[CRITICAL SOURCE MATERIAL: USE THE FOLLOWING PASTED REFERENCE TEXT FOR DRAFTING COHESIVE CONTENT:\n${pastedReference}\n]`;
      }

      if (isActualOutline) {
        finalInstructions += "\n[CRITICAL REQUEST: PLEASE GENERATE ONLY A HIGHLY STRUCTURED AND DETAILED CHAPTER OUTLINE WITH HEADINGS, SUBHEADINGS, AND SECTION OBJECTIVES. DO NOT WRITE THE FULL BOOK TEXT YET. FOCUS PURELY ON PRODUCING AN OUTLINE CORRESPONDING TO THE SCHEMA.]";
      }

      const response = await fetch("/api/chapters/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          title,
          examLevel,
          tone,
          length: isActualOutline ? "Short" : length,
          additionalInstructions: finalInstructions,
          enableSearch,
          enableThinking
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "જનરેશન દરમિયાન અજાણી ભૂલ આવી.");
      }

      const generatedContent = data.chapter;
      setCurrentChapter(generatedContent);
      setLocalEditText(generatedContent);

      if (data.sources) {
        setGroundingSources(data.sources);
      } else {
        setGroundingSources([]);
      }

      // Save to history
      const newHistoryItem: ChapterHistoryItem = {
        id: Date.now().toString(),
        title: isActualOutline ? `${title} (રૂપરેખા)` : title,
        subject,
        examLevel,
        tone,
        length,
        content: generatedContent,
        additionalInstructions,
        createdAt: new Date().toLocaleDateString("gu-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      const updatedHistory = [newHistoryItem, ...historyList];
      saveHistory(updatedHistory);
      setActiveHistoryId(newHistoryItem.id);
      showNotification(isActualOutline ? "પ્રકરણની રૂપરેખા સફળતાપૂર્વક તૈયાર થઈ ગઈ છે!" : "નવું પ્રકરણ સફળતાપૂર્વક તૈયાર થયું છે!");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "જોડાણ નિષ્ફળ રહ્યું. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Edit Refine Call
  const handleRefine = async (customInstruction?: string) => {
    const instructionToUse = customInstruction || refineInstruction;
    if (!instructionToUse.trim()) return;

    setIsRefining(true);
    setError(null);

    const textBeforeRefine = isEditMode ? localEditText : currentChapter;

    try {
      const response = await fetch("/api/chapters/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterContent: textBeforeRefine,
          selectedText: selectedText || undefined,
          instruction: instructionToUse
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "સુધારણા દરમિયાન ભૂલ આવી.");
      }

      const refinedContent = data.chapter;
      setCurrentChapter(refinedContent);
      setLocalEditText(refinedContent);
      setRefineInstruction("");
      setSelectedText("");

      // Update active history item content
      if (activeHistoryId) {
        const updated = historyList.map(item => {
          if (item.id === activeHistoryId) {
            return { ...item, content: refinedContent };
          }
          return item;
        });
        saveHistory(updated);
      }

      showNotification("પ્રકરણ સંતોષકારક રીતે સંપાદિત થયું છે!");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "સુધારણા નિષ્ફળ થઈ.");
    } finally {
      setIsRefining(false);
    }
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = historyList.filter(item => item.id !== id);
    saveHistory(filtered);
    if (activeHistoryId === id) {
      setCurrentChapter("");
      setLocalEditText("");
      setActiveHistoryId(null);
      setTitle("");
      setAdditionalInstructions("");
    }
    showNotification("પ્રકરણ ઇતિહાસમાંથી દૂર કરવામાં આવ્યું.");
  };

  // Print friendly print handler
  const handlePrint = () => {
    window.print();
  };

  // Handle toggling edit mode with state sync & saving
  const toggleEditMode = () => {
    if (isEditMode) {
      // Transitioning from Edit mode to Reader mode
      setCurrentChapter(localEditText);
      
      // Update the active history item content so edits are saved instantly to history
      if (activeHistoryId) {
        setHistoryList(prev => {
          const updated = prev.map(item => {
            if (item.id === activeHistoryId) {
              return { ...item, content: localEditText };
            }
            return item;
          });
          localStorage.setItem("knowledge_sankul_history", JSON.stringify(updated));
          return updated;
        });
      }

      // Update autosave key since it has been synced
      const autosaveData = {
        localEditText,
        title,
        subject,
        examLevel,
        tone,
        length,
        additionalInstructions,
        activeHistoryId,
        timestamp: Date.now()
      };
      localStorage.setItem("knowledge_sankul_autosave", JSON.stringify(autosaveData));
      showNotification("ફેરફારો પૂર્વાવલોકન માટે સાચવવામાં આવ્યા છે!");
    }
    setIsEditMode(!isEditMode);
  };

  // Load a chapter from history
  const loadHistoryItem = (item: ChapterHistoryItem) => {
    setSubject(item.subject || "સામાન્ય જ્ઞાન અને સરકારી અભ્યાસક્રમ (Class 3)");
    setTitle(item.title);
    setExamLevel(item.examLevel || "Class 3 (CCE / ગૌણ સેવા ભરતી / તલાટી)");
    setTone(item.tone || "Point-wise Facts (મુદ્દાસર તથ્યો)");
    setLength(item.length || "Standard");
    setAdditionalInstructions(item.additionalInstructions || "");
    setCurrentChapter(item.content);
    setLocalEditText(item.content);
    setActiveHistoryId(item.id);
    setIsEditMode(false);
    setError(null);
    showNotification("પ્રકરણ પુનઃસ્થાપિત કરવામાં આવ્યું છે.");
  };

  // Create new blank chapter creator
  const startNewChapter = () => {
    setSubject("સામાન્ય જ્ઞાન અને સરકારી અભ્યાસક્રમ (Class 3)");
    setExamLevel("Class 3 (CCE / ગૌણ સેવા ભરતી / તલાટી)");
    setTitle("");
    setAdditionalInstructions("");
    setCurrentChapter("");
    setLocalEditText("");
    setActiveHistoryId(null);
    setError(null);
    setIsEditMode(false);
    localStorage.removeItem("knowledge_sankul_autosave");
    showNotification("નવું પ્રકરણ ડેસ્ક તૈયાર છે.");
  };

  const renderedFontFamily = docxFont === "Hind Vadodara SemiBold" ? "Hind Vadodara" : docxFont;
  const renderedFontWeight = docxFont === "Hind Vadodara SemiBold" ? 600 : undefined;
  const renderedWatermarkFont = docxWatermarkFont === "Hind Vadodara SemiBold" ? "Hind Vadodara" : docxWatermarkFont;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row font-sans text-slate-800 antialiased selection:bg-teal-200">
      
      {/* SUCCESS BANNER NOTIFICATION */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#10b981] text-white font-medium px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 no-print"
          >
            <CheckCircle size={20} />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR (No-print) */}
      <div className="w-72 border-r border-slate-200 bg-white flex flex-col justify-between h-screen sticky top-0 no-print shrink-0 z-40">
        <div>
          {/* LOGO AREA */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
            <div className="bg-[#f15a24] text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              KS
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#f15a24] text-base leading-tight">નોલેજ સંકુલ</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">KNOWLEDGE SANKUL</span>
            </div>
          </div>

          {/* TAJETARNA CHAPTERS HEADER */}
          <div className="px-5 py-4 flex items-center gap-2 text-slate-500">
            <History size={16} />
            <span className="text-xs font-bold text-slate-700">તાજેતરના પ્રકરણો</span>
          </div>

          {/* CHAPTERS HISTORY LIST */}
          <div className="px-3 flex flex-col gap-1.5 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {historyList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <Sparkles size={20} className="text-slate-300 animate-pulse mb-1.5" />
                <span className="text-xs font-bold text-slate-400">કોઈ રેકોર્ડ નથી</span>
              </div>
            ) : (
              historyList.map((item) => {
                const isActive = activeHistoryId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-1 group hover:shadow-xs relative ${
                      isActive
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-xs truncate max-w-[170px]">
                        {item.title}
                      </h4>
                      <button
                        onClick={(e) => handleDeleteHistory(item.id, e)}
                        className={`p-1 rounded-md shrink-0 transition-colors opacity-0 group-hover:opacity-100 ${
                          isActive
                            ? "text-slate-400 hover:text-red-400 hover:bg-slate-800 bg-transparent border-0"
                            : "text-slate-400 hover:text-red-500 hover:bg-slate-100 bg-transparent border-0"
                        }`}
                        title="ડીલીટ કરો"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[9px] opacity-75 mt-1 border-t border-slate-100/10 pt-1">
                      <span className="truncate max-w-[100px]">{item.subject.split(" ")[0]}</span>
                      <span>{item.createdAt.split(",")[0]}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-2.5">
          {/* AUTHOR MODE TOGGLE */}
          <button
            onClick={() => {
              setIsEditMode(!isEditMode);
              showNotification(isEditMode ? "રીડર મોડ સક્રિય" : "લેખક સંપાદન મોડ સક્રિય");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left cursor-pointer border-0"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isEditMode ? "bg-[#f15a24] text-white" : "bg-slate-200 text-slate-600"
            }`}>
              <PenTool size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">લેખક મોડ</span>
              <span className="text-[10px] text-slate-400 leading-none">Author Mode</span>
            </div>
          </button>

          {/* INTEL ASSISTANT LAUNCHER */}
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-indigo-100 hover:border-indigo-200 bg-indigo-50/45 hover:bg-indigo-50/75 transition-all text-left cursor-pointer border-0"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Sparkles size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">જાદુઈ આઇડોલોજી અસિસ્ટન્ટ</span>
              <span className="text-[10px] text-slate-400 leading-none">Gemini Intelligence Hub</span>
            </div>
          </button>

          {/* ALL DATA RESET */}
          <button
            onClick={() => {
              if (window.confirm("શું તમે ખરેખર બધો જ ઇતિહાસ ભૂંસી નાખવા માંગો છો?")) {
                saveHistory([]);
                setCurrentChapter("");
                setLocalEditText("");
                setActiveHistoryId(null);
                showNotification("બધો જ ડેટા રિસેટ કરવામાં આવ્યો છે!");
              }
            }}
            className="w-full py-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border-0"
          >
            <RotateCcw size={12} />
            <span>બધો ડેટા સાફ કરો (RESET)</span>
          </button>
        </div>
      </div>

      {/* RIGHT MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto bg-slate-50 relative">
        
        {/* TOP NAV/HEADER */}
        <div className="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between sticky top-0 z-30 no-print">
          {/* BREADCRUMB */}
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold tracking-wide text-slate-400">
            <span className="uppercase">KNOWLEDGE SANKUL PLATFORM</span>
            <span>/</span>
            <span className="text-[#f15a24] lowercase font-semibold truncate max-w-[200px]">
              {title || "cell"}
            </span>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-3">
            {/* NEW CHAPTER SETUP */}
            <button
              onClick={startNewChapter}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-0"
              title="નવું પ્રકરણ શરૂ કરો"
            >
              <Plus size={13} />
              <span>નવું પ્રકરણ</span>
            </button>

            {/* GEAR SETTINGS */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full cursor-pointer transition-all border-0"
              title="સેટિંગ્સ ખોલો"
            >
              <Settings size={15} />
            </button>

            {/* PUBLISH WORD */}
            <button
              onClick={handleDownloadDocx}
              disabled={!currentChapter}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 border-2 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer ${
                !currentChapter
                  ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed"
                  : "border-slate-300 hover:border-[#f15a24] hover:text-[#f15a24] text-slate-700"
              }`}
            >
              <FileText size={13} />
              <span>PUBLISH WORD</span>
            </button>
          </div>
        </div>

        {/* SCROLLABLE MAIN CONTENT BODY */}
        <div className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
          
          {/* CHAPTER GENERATOR HEADING & QUICK BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              પ્રકરણ જનરેટર
            </h2>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsSyllabusOpen(true)}
                className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-xs px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                📖 સિલેબસ ઉમેરો
              </button>

              <button
                onClick={() => setIsReferenceOpen(true)}
                className={`border px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  pastedReference.trim()
                    ? "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                }`}
              >
                📄 {pastedReference.trim() ? "સંદર્ભ ફેરફાર કરો" : "સંદર્ભ પેસ્ટ કરો"}
              </button>
            </div>
          </div>

          {/* INPUT CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col gap-4 no-print">
            
            {/* CURRENT ACTIVE PARAMETERS STRIP */}
            <div className="bg-slate-50/75 border border-slate-100 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-400">વિષય:</span>
                  <span className="text-slate-800 font-bold">{subject}</span>
                </div>
                <div className="h-3.5 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-400">સ્તર:</span>
                  <span className="text-slate-700">{examLevel}</span>
                </div>
                <div className="h-3.5 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-400">શૈલી:</span>
                  <span className="text-slate-700">{tone}</span>
                </div>
                <div className="h-3.5 w-[1px] bg-slate-200 hidden sm:block"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-black text-slate-400">લંબાઈ:</span>
                  <span className="text-slate-700">{length === "Short" ? "ટૂંકું (Short)" : length === "Standard" ? "સામાન્ય (Standard)" : "વિગતવાર (Detailed)"}</span>
                </div>
                {includeMcqs && (
                  <>
                    <div className="h-3.5 w-[1px] bg-slate-200 hidden sm:block"></div>
                    <span className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-100">
                      📝 MCQs સામેલ
                    </span>
                  </>
                )}
                {(enableSearch || enableThinking) && (
                  <>
                    <div className="h-3.5 w-[1px] bg-slate-200 hidden sm:block"></div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600">
                      {enableSearch && <span>🌐 Search</span>}
                      {enableSearch && enableThinking && <span>+</span>}
                      {enableThinking && <span>🧠 Thinking</span>}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs font-bold text-[#f15a24] hover:text-orange-700 flex items-center gap-1 bg-white hover:bg-orange-50/50 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Settings size={12} />
                <span>પેરામીટર્સ બદલો</span>
              </button>
            </div>

            {/* MAIN GENERATOR INPUT ROW */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="કઈ ચોક્કસ ટોપિક પર લખવું છે? (દા.ત. કોષ, અખો સાહિત્યકાર, તરણેતર મેળો, ALARA principle)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isGenerating) handleGenerate(false);
                  }}
                />
              </div>

              {/* ACTION BUTTON GROUP */}
              <div className="flex gap-2.5 shrink-0">
                {/* OUTLINE BUTTON */}
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating || !title.trim()}
                  className={`px-4.5 py-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-0 ${
                    isGenerating || !title.trim()
                      ? "bg-orange-50 text-orange-300 cursor-not-allowed"
                      : "bg-orange-50 hover:bg-orange-100 text-[#f15a24]"
                  }`}
                >
                  <BookOpen size={14} />
                  <span>📖 રૂપરેખા</span>
                </button>

                {/* GENERATE BUTTON */}
                <button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating || !title.trim()}
                  className={`px-6 py-3 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer border-0 ${
                    isGenerating || !title.trim()
                      ? "bg-orange-400/60 cursor-not-allowed"
                      : "bg-[#f15a24] hover:bg-[#d04616]"
                  }`}
                >
                  <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                  <span>{isGenerating ? "તૈયાર થઈ રહ્યું છે..." : "✈️ જનરેટ"}</span>
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE DISPLAY */}
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* TWO COLUMN BENTO GRID LANDING (Visible only if currentChapter is empty) */}
          {!currentChapter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
              {/* GUIDELINES CARD */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2.5">
                  માર્ગદર્શિકા
                </h3>
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700">સચોટ ગુજરાતી પરિભાષાનો ઉપયોગ.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700">ઊંડાણપૂર્વક અને વિસ્તૃત થીયરી.</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-orange-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700">નેમોનિક્સ અને કોષ્ટકોનું સમાવેશ.</span>
                  </div>
                </div>
              </div>

              {/* ORANGE BRAND BANNER */}
              <div className="bg-gradient-to-br from-[#f15a24] to-orange-500 rounded-2xl p-6 shadow-md flex flex-col justify-between gap-5 text-white">
                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide leading-snug">
                    તમારા પુસ્તકનું આગામી પ્રકરણ તૈયાર છે.
                  </h3>
                  <p className="text-[11px] text-orange-50 leading-relaxed mt-1">
                    માત્ર એક ટોપિક લખો અને ડાયરેક્ટ પબ્લિશ કરવા યોગ્ય કન્ટેન્ટ મેળવો.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE GENERATED CHAPTER WORKSPACE (Visible only if currentChapter exists) */}
          {currentChapter && (
            <div className="flex flex-col gap-6">
              
              {/* MAIN CONTENT CARD */}
              <div className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
                appTheme === "Cozy Dark Mode"
                  ? "bg-slate-900 border-slate-800 text-slate-100 dark-theme"
                  : "bg-white border-slate-200 text-slate-800"
              }`}>
                
                {/* CARD ACTION HEADER */}
                <div className={`px-5 py-3.5 border-b flex flex-col sm:flex-row justify-between items-center gap-3 no-print transition-all duration-300 ${
                  appTheme === "Cozy Dark Mode"
                    ? "bg-slate-950 border-slate-800 text-slate-100"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <FileText className="text-orange-500" size={16} />
                    <span className={`text-xs font-bold transition-all duration-300 ${
                      appTheme === "Cozy Dark Mode" ? "text-slate-200" : "text-slate-800"
                    }`}>પ્રકરણ સંપાદક અને પૂર્વાવલોકન</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* AUTOSAVE STATUS INDICATOR */}
                    <div className={`flex items-center gap-1.5 text-[10px] md:text-xs font-medium mr-2 border-r pr-2 transition-all duration-300 ${
                      appTheme === "Cozy Dark Mode" ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"
                    }`}>
                      {isEditMode && saveStatus === "saving" ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                          <span className="text-amber-500 font-bold">સાચવી રહ્યું છે...</span>
                        </>
                      ) : (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="text-emerald-500 font-bold">સાચવેલ છે</span>
                        </>
                      )}
                    </div>

                    {/* COPY BUTTON */}
                    <button
                      onClick={handleCopy}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent ${
                        appTheme === "Cozy Dark Mode"
                          ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          : "hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                      }`}
                      title="લખાણ કોપી કરો"
                    >
                      <Copy size={14} />
                    </button>

                    {/* DOWNLOAD MARKDOWN */}
                    <button
                      onClick={handleDownload}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent ${
                        appTheme === "Cozy Dark Mode"
                          ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          : "hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                      }`}
                      title="Markdown ડાઉનલોડ કરો"
                    >
                      <Download size={14} />
                    </button>

                    {/* PRINT */}
                    <button
                      onClick={handlePrint}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent ${
                        appTheme === "Cozy Dark Mode"
                          ? "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                          : "hover:bg-slate-200 text-slate-600 hover:text-slate-800"
                      }`}
                      title="પ્રિન્ટ આઉટ લેશો"
                    >
                      <Printer size={14} />
                    </button>

                    {/* EDIT MODE TOGGLE */}
                    <button
                      onClick={toggleEditMode}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border-0 ${
                        isEditMode
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : appTheme === "Cozy Dark Mode"
                            ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                      }`}
                    >
                      <Edit3 size={11} />
                      <span>{isEditMode ? "રીડર મોડ" : "એડિટ મોડ"}</span>
                    </button>
                  </div>
                </div>

                {/* WRAPPER RENDER CANVAS */}
                <div className="p-6 md:p-8 overflow-x-auto relative">
                  
                  {/* WATERMARK BACKGROUND EMBLEM (If picture watermark is selected) */}
                  {docxWatermarkType === "picture" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
                      {docxWatermarkImage ? (
                        <img
                          src={docxWatermarkImage}
                          alt="Watermark Logo"
                          className="w-80 h-80 object-contain opacity-10 select-none pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-96 h-96 rounded-full border-[12px] border-[#f15a24]/10 flex items-center justify-center font-black text-7xl text-[#f15a24]/10">
                          KS
                        </div>
                      )}
                    </div>
                  )}

                  {/* WATERMARK TEXT BACKGROUND (If text watermark is selected) */}
                  {docxWatermarkType === "text" && docxWatermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                      <div
                        className="text-center font-black tracking-widest text-slate-700/10 select-none"
                        style={{
                          transform: docxWatermarkLayout === "diagonal" ? "rotate(-30deg)" : "none",
                          fontSize: docxWatermarkSize === "Auto" ? "4.5rem" : `${Number(docxWatermarkSize) * 1.5}px`,
                          fontFamily: renderedWatermarkFont
                        }}
                      >
                        {docxWatermark}
                      </div>
                    </div>
                  )}

                  {/* RENDER LOGIC */}
                  <div className="relative z-10">
                    {isEditMode ? (
                      <div className="flex flex-col gap-4">
                        {/* WYSIWYG FORMATTING TOOLBAR */}
                        <div className={`flex flex-wrap items-center gap-1.5 p-2 border rounded-xl no-print transition-all duration-300 ${
                          appTheme === "Cozy Dark Mode"
                            ? "bg-slate-950 border-slate-800 text-slate-200"
                            : "bg-slate-50 border-slate-200/60 text-slate-700"
                        }`}>
                          <button
                            type="button"
                            onClick={() => handleFormat("bold")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="બોલ્ડ (Bold - **લખાણ**)"
                          >
                            <Bold size={15} className="stroke-[2.5]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormat("italic")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="ઇટાલિક (Italic - *લખાણ*)"
                          >
                            <Italic size={15} className="stroke-[2.5]" />
                          </button>
                          
                          <div className={`h-4 w-[1px] mx-1 ${
                            appTheme === "Cozy Dark Mode" ? "bg-slate-800" : "bg-slate-200"
                          }`}></div>

                          <button
                            type="button"
                            onClick={() => handleFormat("h1")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="શીર્ષક ૧ (Heading 1)"
                          >
                            <Heading1 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormat("h2")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="પેટા-શીર્ષક ૨ (Heading 2)"
                          >
                            <Heading2 size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormat("h3")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="પેટા-શીર્ષક ૩ (Heading 3)"
                          >
                            <Heading3 size={15} />
                          </button>

                          <div className={`h-4 w-[1px] mx-1 ${
                            appTheme === "Cozy Dark Mode" ? "bg-slate-800" : "bg-slate-200"
                          }`}></div>

                          <button
                            type="button"
                            onClick={() => handleFormat("bullet")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="બુલેટ યાદી (Bullet List)"
                          >
                            <List size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormat("number")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border-0 bg-transparent flex items-center justify-center ${
                              appTheme === "Cozy Dark Mode"
                                ? "hover:bg-slate-800 text-slate-300 active:bg-slate-700"
                                : "hover:bg-slate-200 active:bg-slate-300 text-slate-700"
                            }`}
                            title="નંબર યાદી (Numbered List)"
                          >
                            <ListOrdered size={15} />
                          </button>

                          <div className={`ml-auto text-[10px] px-2 select-none hidden md:block ${
                            appTheme === "Cozy Dark Mode" ? "text-slate-500" : "text-slate-400"
                          }`}>
                            લખાણ સિલેક્ટ કરી બટન દબાવો
                          </div>
                        </div>

                        <textarea
                          ref={textareaRef}
                          value={localEditText}
                          onChange={(e) => setLocalEditText(e.target.value)}
                          spellCheck="true"
                          lang="gu"
                          className={`w-full min-h-[500px] text-sm font-medium border-0 focus:outline-none focus:ring-0 resize-none leading-relaxed p-2 bg-transparent transition-all duration-300 ${
                            appTheme === "Cozy Dark Mode"
                              ? "text-slate-100 placeholder-slate-600"
                              : "text-slate-800 placeholder-slate-400"
                          }`}
                          style={{ fontFamily: renderedFontFamily, fontWeight: renderedFontWeight, fontSize: `${docxFontSize}px` }}
                          placeholder="અહીં ગુજરાતી મટીરીયલ લખો..."
                        />
                      </div>
                    ) : (
                      <div
                        ref={contentRef}
                        onMouseUp={handleTextSelection}
                        className={`markdown-body prose max-w-none text-sm focus:outline-none transition-all duration-300 ${
                          appTheme === "Cozy Dark Mode" ? "text-slate-200" : "text-slate-800"
                        }`}
                        style={{
                          fontFamily: renderedFontFamily,
                          fontWeight: renderedFontWeight,
                          fontSize: `${docxFontSize}px`,
                          '--theme-primary': themeColorPrimary,
                          '--theme-secondary': themeColorSecondary,
                          '--theme-accent': themeColorAccent,
                        } as React.CSSProperties}
                      >
                        {parsedMcqs.length > 0 ? (
                          <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {bookText}
                            </ReactMarkdown>
                            <InteractiveQuiz
                              mcqs={parsedMcqs}
                              themeColorPrimary={themeColorPrimary}
                              themeColorSecondary={themeColorSecondary}
                              themeColorAccent={themeColorAccent}
                              appTheme={appTheme}
                              fontFamily={renderedFontFamily}
                              fontSize={`${docxFontSize}px`}
                            />
                          </>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentChapter}
                          </ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* GROUNDING SOURCES */}
              {groundingSources && groundingSources.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 no-print">
                  <div className="flex items-center gap-2 text-slate-700 pb-1.5 border-b border-slate-200/60">
                    <Globe size={16} className="text-blue-500" />
                    <h4 className="text-xs font-black uppercase tracking-wider">ગૂગલ સર્ચ સંદર્ભ સ્ત્રોતો (Google Search Sources)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {groundingSources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 bg-white border border-slate-150 rounded-xl hover:border-slate-300 hover:shadow-xs transition-all flex items-start gap-2 text-slate-700 decoration-none"
                      >
                        <ExternalLink size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-xs font-bold leading-tight line-clamp-2 hover:text-[#f15a24]">{src.title || src.uri}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* CO-AUTHOR REFINEMENT PANEL */}
              {currentChapter && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 no-print">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    <Sparkles className="text-orange-500" size={16} />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">AI સહ-લેખક સહાયક (Co-Author Refinement)</h3>
                  </div>

                  {selectedText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-orange-50 text-orange-800 p-3 rounded-xl text-xs font-semibold leading-relaxed"
                    >
                      <span className="font-bold">પસંદ કરેલું લખાણ (Selected Text):</span>
                      <p className="mt-1 font-normal italic text-slate-600 line-clamp-2">"{selectedText}"</p>
                    </motion.div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={refineInstruction}
                      onChange={(e) => setRefineInstruction(e.target.value)}
                      placeholder="પસંદ કરેલા લખાણમાં સુધારો સૂચવો (દા.ત. આ પેરેગ્રાફ વધુ વિગતવાર સમજાવો, જોડણી સુધારો)..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder-slate-400 text-slate-800"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !isRefining && refineInstruction.trim()) handleRefine();
                      }}
                    />
                    <button
                      onClick={() => handleRefine()}
                      disabled={isRefining || !refineInstruction.trim()}
                      className={`px-5 py-3 rounded-xl text-white text-xs font-bold shadow-xs transition-all cursor-pointer border-0 ${
                        isRefining || !refineInstruction.trim()
                          ? "bg-orange-400/60 cursor-not-allowed"
                          : "bg-[#f15a24] hover:bg-[#d04616]"
                      }`}
                    >
                      {isRefining ? "સુધરી રહ્યું છે..." : "લાગુ કરો"}
                    </button>
                  </div>

                  {/* QUICK REFINEMENT BULLET TAGS */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100/60">
                    <span className="text-[10px] text-slate-400 font-bold self-center">ઝડપી સુધારા:</span>
                    {[
                      { label: "+૩ નવા MCQs", inst: "૩ નવા અત્યંત મહત્વના પ્રેક્ટિસ માટેના હેતુલક્ષી પ્રશ્નો સમજૂતી સાથે ઉમેરો." },
                      { label: "વ્યાકરણ શુદ્ધ કરો", inst: "પ્રકરણમાં ભાષાકીય અને જોડણીની ભૂલો ચકાસીને શુદ્ધ ગુજરાતી વ્યાકરણ લાગુ કરો." },
                      { label: "કોષ્ટક મજબૂત બનાવો", inst: "પરીક્ષાલક્ષી અગત્યના તથ્યોવાળા કોષ્ટકમાં વધુ ૩ અગત્યની બાબતો જોડો." }
                    ].map((btn, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleRefine(btn.inst)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-semibold border border-slate-200 transition-all cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC WEB FOOTER */}
          <div className="mt-8 pt-5 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>{webFooterLeft}</span>
            <div className="flex items-center gap-3">
              <span>{webFooterRight1}</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-500 font-extrabold">{webFooterRight2}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL OVERLAYS */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            includeMcqs={includeMcqs}
            setIncludeMcqs={setIncludeMcqs}
            authoringLanguage={authoringLanguage}
            setAuthoringLanguage={setAuthoringLanguage}
            appTheme={appTheme}
            setAppTheme={setAppTheme}
            appNameEnglish={appNameEnglish}
            setAppNameEnglish={setAppNameEnglish}
            appNameGujarati={appNameGujarati}
            setAppNameGujarati={setAppNameGujarati}
            webFooterLeft={webFooterLeft}
            setWebFooterLeft={setWebFooterLeft}
            webFooterRight1={webFooterRight1}
            setWebFooterRight1={setWebFooterRight1}
            webFooterRight2={webFooterRight2}
            setWebFooterRight2={setWebFooterRight2}
            themeColorPrimary={themeColorPrimary}
            setThemeColorPrimary={setThemeColorPrimary}
            themeColorSecondary={themeColorSecondary}
            setThemeColorSecondary={setThemeColorSecondary}
            themeColorAccent={themeColorAccent}
            setThemeColorAccent={setThemeColorAccent}
            docxFont={docxFont}
            setDocxFont={setDocxFont}
            docxFontSizeH1={docxFontSizeH1}
            setDocxFontSizeH1={setDocxFontSizeH1}
            docxFontSizeH2={docxFontSizeH2}
            setDocxFontSizeH2={setDocxFontSizeH2}
            docxFontSizeH3={docxFontSizeH3}
            setDocxFontSizeH3={setDocxFontSizeH3}
            docxFontSizeP={docxFontSizeP}
            setDocxFontSizeP={setDocxFontSizeP}
            setDocxFontSize={setDocxFontSize}
            docxColor={docxColor}
            setDocxColor={setDocxColor}
            docxHeader={docxHeader}
            setDocxHeader={setDocxHeader}
            docxFooter={docxFooter}
            setDocxFooter={setDocxFooter}
            docxIncludeCoverPage={docxIncludeCoverPage}
            setDocxIncludeCoverPage={setDocxIncludeCoverPage}
            docxAutoSectionNumbering={docxAutoSectionNumbering}
            setDocxAutoSectionNumbering={setDocxAutoSectionNumbering}
            docxWatermarkType={docxWatermarkType}
            setDocxWatermarkType={setDocxWatermarkType}
            docxWatermarkScale={docxWatermarkScale}
            setDocxWatermarkScale={setDocxWatermarkScale}
            docxWatermarkWashout={docxWatermarkWashout}
            setDocxWatermarkWashout={setDocxWatermarkWashout}
            docxWatermark={docxWatermark}
            setDocxWatermark={setDocxWatermark}
            docxWatermarkFont={docxWatermarkFont}
            setDocxWatermarkFont={setDocxWatermarkFont}
            docxWatermarkSize={docxWatermarkSize}
            setDocxWatermarkSize={setDocxWatermarkSize}
            docxWatermarkColor={docxWatermarkColor}
            setDocxWatermarkColor={setDocxWatermarkColor}
            docxWatermarkSemitransparent={docxWatermarkSemitransparent}
            setDocxWatermarkSemitransparent={setDocxWatermarkSemitransparent}
            docxWatermarkLayout={docxWatermarkLayout}
            setDocxWatermarkLayout={setDocxWatermarkLayout}
            docxWatermarkImage={docxWatermarkImage}
            setDocxWatermarkImage={setDocxWatermarkImage}
            showNotification={showNotification}
            subject={subject}
            setSubject={setSubject}
            examLevel={examLevel}
            setExamLevel={setExamLevel}
            tone={tone}
            setTone={setTone}
            length={length}
            setLength={setLength}
            additionalInstructions={additionalInstructions}
            setAdditionalInstructions={setAdditionalInstructions}
            enableSearch={enableSearch}
            setEnableSearch={setEnableSearch}
            enableThinking={enableThinking}
            setEnableThinking={setEnableThinking}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSyllabusOpen && (
          <SyllabusModal
            isOpen={isSyllabusOpen}
            onClose={() => setIsSyllabusOpen(false)}
            onSelect={(sub, ttl, inst) => {
              setSubject(sub);
              setTitle(ttl);
              setAdditionalInstructions(inst);
              setIsSyllabusOpen(false);
              showNotification(`સિલેબસ "${ttl}" સફળતાપૂર્વક લોડ થયો છે!`);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReferenceOpen && (
          <ReferenceModal
            isOpen={isReferenceOpen}
            onClose={() => setIsReferenceOpen(false)}
            pastedReference={pastedReference}
            setPastedReference={setPastedReference}
            showNotification={showNotification}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAssistantOpen && (
          <AssistantModal
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            chapterContent={isEditMode ? localEditText : currentChapter}
            showNotification={showNotification}
            onApplyRevisedText={(newText) => {
              setLocalEditText(newText);
              setCurrentChapter(newText);
              
              if (activeHistoryId) {
                setHistoryList(prev => {
                  const updated = prev.map(item => {
                    if (item.id === activeHistoryId) {
                      return { ...item, content: newText };
                    }
                    return item;
                  });
                  localStorage.setItem("knowledge_sankul_history", JSON.stringify(updated));
                  return updated;
                });
              }
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
