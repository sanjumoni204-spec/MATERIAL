import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  X,
  Globe,
  FileSpreadsheet,
  FileText,
  CheckCircle,
  Sparkles,
  BookOpen
} from "lucide-react";

const SUBJECTS = [
  { id: "guj_history", name: "ગુજરાતનો ઇતિહાસ (History of Gujarat)" },
  { id: "cultural_heritage", name: "સાંસ્કૃતિક વારસો (Cultural Heritage)" },
  { id: "guj_literature", name: "ગુજરાતી સાહિત્ય (Gujarati Literature)" },
  { id: "indian_polity", name: "ભારતનું બંધારણ (Indian Constitution)" },
  { id: "geography", name: "ભૂગોળ (Geography of India & Gujarat)" },
  { id: "science_tech", name: "વિજ્ઞાન અને ટેકનોલોજી (Science & Technology)" },
  { id: "xray_tech", name: "એક્સ-રે ટેકનિશિયન (X-Ray Technician)" }
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
  { label: "સામાન્ય (Standard)", desc: "૧૨૦вом-૧૫૦૦ શબ્દો", value: "Standard" },
  { label: "વિગતવાર (Detailed)", desc: "૨૫૦૦+ શબ્દો", value: "Detailed" }
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  includeMcqs: boolean;
  setIncludeMcqs: (val: boolean) => void;
  authoringLanguage: string;
  setAuthoringLanguage: (val: string) => void;
  appTheme: string;
  setAppTheme: (val: string) => void;
  appNameEnglish: string;
  setAppNameEnglish: (val: string) => void;
  appNameGujarati: string;
  setAppNameGujarati: (val: string) => void;
  webFooterLeft: string;
  setWebFooterLeft: (val: string) => void;
  webFooterRight1: string;
  setWebFooterRight1: (val: string) => void;
  webFooterRight2: string;
  setWebFooterRight2: (val: string) => void;
  themeColorPrimary: string;
  setThemeColorPrimary: (val: string) => void;
  themeColorSecondary: string;
  setThemeColorSecondary: (val: string) => void;
  themeColorAccent: string;
  setThemeColorAccent: (val: string) => void;
  docxFont: string;
  setDocxFont: (val: string) => void;
  docxFontSizeH1: number;
  setDocxFontSizeH1: (val: number) => void;
  docxFontSizeH2: number;
  setDocxFontSizeH2: (val: number) => void;
  docxFontSizeH3: number;
  setDocxFontSizeH3: (val: number) => void;
  docxFontSizeP: number;
  setDocxFontSizeP: (val: number) => void;
  setDocxFontSize: (val: number) => void;
  docxColor: string;
  setDocxColor: (val: string) => void;
  docxHeader: string;
  setDocxHeader: (val: string) => void;
  docxFooter: string;
  setDocxFooter: (val: string) => void;
  docxIncludeCoverPage: boolean;
  setDocxIncludeCoverPage: (val: boolean) => void;
  docxAutoSectionNumbering: boolean;
  setDocxAutoSectionNumbering: (val: boolean) => void;
  docxWatermarkType: "none" | "text" | "picture";
  setDocxWatermarkType: (val: "none" | "text" | "picture") => void;
  docxWatermarkScale: string;
  setDocxWatermarkScale: (val: string) => void;
  docxWatermarkWashout: boolean;
  setDocxWatermarkWashout: (val: boolean) => void;
  docxWatermark: string;
  setDocxWatermark: (val: string) => void;
  docxWatermarkFont: string;
  setDocxWatermarkFont: (val: string) => void;
  docxWatermarkSize: string | number;
  setDocxWatermarkSize: (val: string | number) => void;
  docxWatermarkColor: string;
  setDocxWatermarkColor: (val: string) => void;
  docxWatermarkSemitransparent: boolean;
  setDocxWatermarkSemitransparent: (val: boolean) => void;
  docxWatermarkLayout: "diagonal" | "horizontal";
  setDocxWatermarkLayout: (val: "diagonal" | "horizontal") => void;
  docxWatermarkImage: string | null;
  setDocxWatermarkImage: (val: string | null) => void;
  showNotification: (msg: string) => void;
  
  // New States Moved to Settings Modal
  subject: string;
  setSubject: (val: string) => void;
  examLevel: string;
  setExamLevel: (val: string) => void;
  tone: string;
  setTone: (val: string) => void;
  length: string;
  setLength: (val: string) => void;
  additionalInstructions: string;
  setAdditionalInstructions: (val: string) => void;
  enableSearch: boolean;
  setEnableSearch: (val: boolean) => void;
  enableThinking: boolean;
  setEnableThinking: (val: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  includeMcqs,
  setIncludeMcqs,
  authoringLanguage,
  setAuthoringLanguage,
  appTheme,
  setAppTheme,
  appNameEnglish,
  setAppNameEnglish,
  appNameGujarati,
  setAppNameGujarati,
  webFooterLeft,
  setWebFooterLeft,
  webFooterRight1,
  setWebFooterRight1,
  webFooterRight2,
  setWebFooterRight2,
  themeColorPrimary,
  setThemeColorPrimary,
  themeColorSecondary,
  setThemeColorSecondary,
  themeColorAccent,
  setThemeColorAccent,
  docxFont,
  setDocxFont,
  docxFontSizeH1,
  setDocxFontSizeH1,
  docxFontSizeH2,
  setDocxFontSizeH2,
  docxFontSizeH3,
  setDocxFontSizeH3,
  docxFontSizeP,
  setDocxFontSizeP,
  setDocxFontSize,
  docxColor,
  setDocxColor,
  docxHeader,
  setDocxHeader,
  docxFooter,
  setDocxFooter,
  docxIncludeCoverPage,
  setDocxIncludeCoverPage,
  docxAutoSectionNumbering,
  setDocxAutoSectionNumbering,
  docxWatermarkType,
  setDocxWatermarkType,
  docxWatermarkScale,
  setDocxWatermarkScale,
  docxWatermarkWashout,
  setDocxWatermarkWashout,
  docxWatermark,
  setDocxWatermark,
  docxWatermarkFont,
  setDocxWatermarkFont,
  docxWatermarkSize,
  setDocxWatermarkSize,
  docxWatermarkColor,
  setDocxWatermarkColor,
  docxWatermarkSemitransparent,
  setDocxWatermarkSemitransparent,
  docxWatermarkLayout,
  setDocxWatermarkLayout,
  docxWatermarkImage,
  setDocxWatermarkImage,
  showNotification,

  // New States Moved to Settings Modal
  subject,
  setSubject,
  examLevel,
  setExamLevel,
  tone,
  setTone,
  length,
  setLength,
  additionalInstructions,
  setAdditionalInstructions,
  enableSearch,
  setEnableSearch,
  enableThinking,
  setEnableThinking
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"chapter" | "app" | "word" | "watermark">("chapter");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl h-[600px] overflow-hidden flex flex-col"
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings className="text-slate-600 animate-spin-slow" size={20} />
            <h3 className="font-bold text-slate-800 text-base">Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          {/* TAB SIDEBAR */}
          <div className="w-56 border-r border-slate-100 bg-slate-50/50 p-3 flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setActiveTab("chapter")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === "chapter"
                  ? "bg-white text-orange-600 shadow-xs border-l-4 border-orange-500 pl-3"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Sparkles size={14} className="text-orange-500 animate-pulse" />
              <span>Chapter Parameters</span>
            </button>
            <button
              onClick={() => setActiveTab("app")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === "app"
                  ? "bg-white text-orange-600 shadow-xs border-l-4 border-orange-500 pl-3"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Globe size={14} />
              <span>Application Settings</span>
            </button>
            <button
              onClick={() => setActiveTab("word")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === "word"
                  ? "bg-white text-orange-600 shadow-xs border-l-4 border-orange-500 pl-3"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FileSpreadsheet size={14} />
              <span>Word Formatting</span>
            </button>
            <button
              onClick={() => setActiveTab("watermark")}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeTab === "watermark"
                  ? "bg-white text-orange-600 shadow-xs border-l-4 border-orange-500 pl-3"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <FileText size={14} />
              <span>Printed Watermark</span>
            </button>
          </div>

          {/* TAB DETAILS */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {/* CHAPTER PARAMETERS */}
            {activeTab === "chapter" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">પ્રકરણ પેરામીટર્સ (Chapter Parameters)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generate customized book chapters or learning materials by setting academic criteria.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SUBJECT */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">વિષય શાખા (Subject Branch):</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* EXAM LEVEL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">પરીક્ષા સ્તર (Exam Level):</label>
                    <select
                      value={examLevel}
                      onChange={(e) => setExamLevel(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {EXAM_LEVELS.map((el, i) => (
                        <option key={i} value={el}>{el}</option>
                      ))}
                    </select>
                  </div>

                  {/* WRITING TONE */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">લખાણ શૈલી (Writing Style / Tone):</label>
                    <select
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {WRITING_TONES.map((wt, i) => (
                        <option key={i} value={wt}>{wt}</option>
                      ))}
                    </select>
                  </div>

                  {/* LENGTH */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">પ્રકરણની લંબાઈ (Target Length):</label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      {LENGTH_OPTIONS.map((lo, i) => (
                        <option key={i} value={lo.value}>{lo.label} ({lo.desc})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SPECIAL INSTRUCTIONS */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">ખાસ મુદ્દાઓ/સૂચનાઓ (Special Instructions):</label>
                  <textarea
                    value={additionalInstructions}
                    onChange={(e) => setAdditionalInstructions(e.target.value)}
                    placeholder="દા.ત. અગત્યની કલમો કોષ્ટકમાં સામેલ કરો, વગેરે..."
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 h-16 resize-none focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* ADVANCED AI CONTROLS */}
                <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-100">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Advanced AI Features</label>
                  <div className="flex flex-wrap gap-5">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableSearch}
                        onChange={(e) => setEnableSearch(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">🌐 ગૂગલ સર્ચ માહિતી (Google Search Grounding)</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={enableThinking}
                        onChange={(e) => setEnableThinking(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="flex items-center gap-1">🧠 ઊંડી વૈચારિક ક્ષમતા (High Thinking Mode)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* APPLICATION SETTINGS */}
            {activeTab === "app" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Web Application</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Customize default parameters for chapter authoring and metadata.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none mt-4">
                    <input
                      type="checkbox"
                      checked={includeMcqs}
                      onChange={(e) => setIncludeMcqs(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Include MCQs in Content</span>
                  </label>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Authoring Language:</label>
                    <select
                      value={authoringLanguage}
                      onChange={(e) => setAuthoringLanguage(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold cursor-pointer text-slate-700"
                    >
                      <option value="Gujarati (GU)">Gujarati (GU)</option>
                      <option value="English (EN)">English (EN)</option>
                      <option value="Bilingual (GU-EN)">Bilingual (GU-EN)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">App Theme:</label>
                    <select
                      value={appTheme}
                      onChange={(e) => setAppTheme(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold cursor-pointer text-slate-700"
                    >
                      <option value="Bright / Light Mode">Bright / Light Mode</option>
                      <option value="Cozy Dark Mode">Cozy Dark Mode</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Application Name (English)</label>
                    <input
                      type="text"
                      value={appNameEnglish}
                      onChange={(e) => setAppNameEnglish(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Application Name (Gujarati)</label>
                    <input
                      type="text"
                      value={appNameGujarati}
                      onChange={(e) => setAppNameGujarati(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Web Footer Left Text</label>
                    <input
                      type="text"
                      value={webFooterLeft}
                      onChange={(e) => setWebFooterLeft(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Web Footer Right 1</label>
                      <input
                        type="text"
                        value={webFooterRight1}
                        onChange={(e) => setWebFooterRight1(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Web Footer Right 2</label>
                      <input
                        type="text"
                        value={webFooterRight2}
                        onChange={(e) => setWebFooterRight2(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* WORD FORMATTING */}
            {activeTab === "word" && (
              <div className="flex flex-col gap-5">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Word Document Formatting</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure advanced style sheets and fonts for downloading MS Word chapters.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Theme Colors (Headings, Tables)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: themeColorPrimary }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-500">Primary Color</span>
                        <input
                          type="color"
                          value={themeColorPrimary}
                          onChange={(e) => {
                            setThemeColorPrimary(e.target.value);
                            setDocxColor(e.target.value.replace("#", ""));
                          }}
                          className="w-full h-4 p-0 border-0 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: themeColorSecondary }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-500">Secondary Color</span>
                        <input
                          type="color"
                          value={themeColorSecondary}
                          onChange={(e) => setThemeColorSecondary(e.target.value)}
                          className="w-full h-4 p-0 border-0 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                      <div className="w-6 h-6 rounded-lg shrink-0" style={{ backgroundColor: themeColorAccent }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-slate-500">Accent Color</span>
                        <input
                          type="color"
                          value={themeColorAccent}
                          onChange={(e) => setThemeColorAccent(e.target.value)}
                          className="w-full h-4 p-0 border-0 bg-transparent cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Font Family</label>
                  <select
                    value={docxFont}
                    onChange={(e) => setDocxFont(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 font-semibold cursor-pointer text-slate-700"
                  >
                    <option value="Calibri">Calibri (સ્ટાન્ડર્ડ)</option>
                    <option value="Arial">Arial (ક્લીન)</option>
                    <option value="Times New Roman">Times New Roman (એકેડેમિક)</option>
                    <option value="Georgia">Georgia (એડિટોરિયલ)</option>
                    <option value="Courier New">Courier New (મોનોસ્પેસ)</option>
                    <option value="Hind Vadodara">Hind Vadodara (ગુજરાતી)</option>
                    <option value="Hind Vadodara SemiBold">Hind Vadodara SemiBold (ગુજરાતી સેમી-બોલ્ડ)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Font Sizes (pt)</label>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400">Title (H1)</span>
                      <input
                        type="number"
                        value={docxFontSizeH1}
                        onChange={(e) => setDocxFontSizeH1(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400">Header (H2)</span>
                      <input
                        type="number"
                        value={docxFontSizeH2}
                        onChange={(e) => setDocxFontSizeH2(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400">Sub (H3)</span>
                      <input
                        type="number"
                        value={docxFontSizeH3}
                        onChange={(e) => setDocxFontSizeH3(Number(e.target.value))}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-800"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold text-slate-400">Text (P)</span>
                      <input
                        type="number"
                        value={docxFontSizeP}
                        onChange={(e) => {
                          setDocxFontSizeP(Number(e.target.value));
                          setDocxFontSize(Number(e.target.value));
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-center font-bold text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Header Text</label>
                    <input
                      type="text"
                      value={docxHeader}
                      onChange={(e) => setDocxHeader(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Footer Text</label>
                    <input
                      type="text"
                      value={docxFooter}
                      onChange={(e) => setDocxFooter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={docxIncludeCoverPage}
                      onChange={(e) => setDocxIncludeCoverPage(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Include Cover Page</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={docxAutoSectionNumbering}
                      onChange={(e) => setDocxAutoSectionNumbering(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span>Auto Section Numbering</span>
                  </label>
                </div>
              </div>
            )}

            {/* PRINTED WATERMARK */}
            {activeTab === "watermark" && (
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Printed Watermark</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Establish elegant brand watermarks inside download-ready MS Word chapters.</p>
                </div>

                {/* OPTION 1: NO WATERMARK */}
                <div
                  onClick={() => setDocxWatermarkType("none")}
                  className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all ${
                    docxWatermarkType === "none"
                      ? "bg-slate-50 border-orange-500 ring-1 ring-orange-500/30"
                      : "bg-white border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="modal_watermark_type"
                    checked={docxWatermarkType === "none"}
                    onChange={() => setDocxWatermarkType("none")}
                    className="w-4 h-4 text-orange-600 focus:ring-orange-500 mt-0.5 border-slate-300"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">No watermark</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">Exclude any background text or logo on exported MS Word pages.</p>
                  </div>
                </div>

                {/* OPTION 2: PICTURE WATERMARK */}
                <div
                  onClick={() => setDocxWatermarkType("picture")}
                  className={`border rounded-xl p-3.5 flex flex-col gap-3 cursor-pointer transition-all ${
                    docxWatermarkType === "picture"
                      ? "bg-orange-50/40 border-orange-500 ring-1 ring-orange-500/30"
                      : "bg-white border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="modal_watermark_type"
                      checked={docxWatermarkType === "picture"}
                      onChange={() => setDocxWatermarkType("picture")}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 mt-0.5 border-slate-300"
                    />
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-orange-950">Picture watermark</h5>
                      <p className="text-[10px] text-orange-600 mt-0.5 font-medium">Use the official high-resolution, light-weight Knowledge Sankul crest watermark.</p>
                    </div>
                  </div>

                  {docxWatermarkType === "picture" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pl-7 flex flex-col gap-3 border-t border-orange-100 pt-3"
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          id="watermark-logo-upload"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  setDocxWatermarkImage(reader.result);
                                  showNotification("વોટરમાર્ક લોગો સફળતાપૂર્વક અપલોડ થયો છે!");
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("watermark-logo-upload")?.click()}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold text-slate-700 rounded-lg shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        >
                          Select Picture (લોગો પસંદ કરો)...
                        </button>

                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-700">
                          <input
                            type="checkbox"
                            checked={!!docxWatermarkImage}
                            readOnly
                            className="w-3.5 h-3.5 rounded text-orange-600 border-orange-300 focus:ring-orange-500 bg-orange-50"
                          />
                          <span>{docxWatermarkImage ? "લોગો સેટ છે (Logo Set)" : "નોલેજ સંકુલ લોગો સક્રિય"}</span>
                        </label>

                        {docxWatermarkImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setDocxWatermarkImage(null);
                              showNotification("લોગો રીસેટ થઈ ગયો છે!");
                            }}
                            className="text-[10px] text-red-500 hover:text-red-700 underline font-bold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Scale:</span>
                          <select
                            value={docxWatermarkScale}
                            onChange={(e) => setDocxWatermarkScale(e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] font-semibold cursor-pointer text-slate-700"
                          >
                            <option value="Auto">Auto</option>
                            <option value="50%">50%</option>
                            <option value="100%">100%</option>
                            <option value="150%">150%</option>
                            <option value="200%">200%</option>
                            <option value="500%">500%</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={docxWatermarkWashout}
                            onChange={(e) => setDocxWatermarkWashout(e.target.checked)}
                            className="w-3.5 h-3.5 rounded text-orange-600 border-slate-300 focus:ring-orange-500"
                          />
                          <span>Washout (Fade)</span>
                        </label>
                      </div>

                      <div className="text-[10px] text-orange-800 bg-orange-100/50 p-2.5 rounded-lg border border-orange-100/60 leading-relaxed">
                        <p className="font-bold">✨ નોલેજ સંકુલ ઓફિશિયલ સિમ્બોલ સક્રિય:</p>
                        <p className="mt-0.5 text-slate-600 font-normal">
                          આ વિકલ્પ પસંદ કરવાથી કન્ટેન્ટ પૃષ્ઠની મધ્યમાં નોલેજ સંકુલનો અતિ ભવ્ય લાઈટવેઈટ લોગો પૃષ્ઠભૂમિ (Background) તરીકે સેટ થશે.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* OPTION 3: TEXT WATERMARK */}
                <div
                  onClick={() => setDocxWatermarkType("text")}
                  className={`border rounded-xl p-3.5 flex flex-col gap-3 cursor-pointer transition-all ${
                    docxWatermarkType === "text"
                      ? "bg-slate-50 border-orange-500 ring-1 ring-orange-500/30"
                      : "bg-white border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="modal_watermark_type"
                      checked={docxWatermarkType === "text"}
                      onChange={() => setDocxWatermarkType("text")}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500 mt-0.5 border-slate-300"
                    />
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Text watermark</h5>
                      <p className="text-[10px] text-slate-400 mt-0.5">Apply custom background watermark texts such as "CONFIDENTIAL" or "KNOWLEDGE SANKUL".</p>
                    </div>
                  </div>

                  {docxWatermarkType === "text" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pl-7 flex flex-col gap-3.5 border-t border-slate-100 pt-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Text Presets:</span>
                          <select
                            value={["KNOWLEDGE SANKUL", "CONFIDENTIAL", "DO NOT COPY", "SAMPLE", "ORIGINAL"].includes(docxWatermark) ? docxWatermark : "CUSTOM"}
                            onChange={(e) => {
                              if (e.target.value !== "CUSTOM") {
                                setDocxWatermark(e.target.value);
                              }
                            }}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer text-slate-700"
                          >
                            <option value="KNOWLEDGE SANKUL">KNOWLEDGE SANKUL</option>
                            <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                            <option value="DO NOT COPY">DO NOT COPY</option>
                            <option value="SAMPLE">SAMPLE</option>
                            <option value="ORIGINAL">ORIGINAL</option>
                            <option value="CUSTOM">Custom / લખો...</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Custom Text (લખો)</span>
                          <input
                            type="text"
                            value={docxWatermark}
                            onChange={(e) => setDocxWatermark(e.target.value)}
                            placeholder="કસ્ટમ લખાણ લખો..."
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Font</span>
                          <select
                            value={docxWatermarkFont}
                            onChange={(e) => setDocxWatermarkFont(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium cursor-pointer text-slate-700"
                          >
                            <option value="Calibri">Calibri</option>
                            <option value="Arial">Arial</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Hind Vadodara">Hind Vadodara</option>
                            <option value="Hind Vadodara SemiBold">Hind Vadodara SemiBold</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Size</span>
                          <select
                            value={docxWatermarkSize}
                            onChange={(e) => setDocxWatermarkSize(e.target.value === "Auto" ? "Auto" : Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium cursor-pointer text-slate-700"
                          >
                            <option value="Auto">Auto</option>
                            <option value={36}>36 pt</option>
                            <option value={40}>40 pt</option>
                            <option value={48}>48 pt</option>
                            <option value={54}>54 pt</option>
                            <option value={60}>60 pt</option>
                            <option value={72}>72 pt</option>
                            <option value={96}>96 pt</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Color</span>
                          <select
                            value={docxWatermarkColor}
                            onChange={(e) => setDocxWatermarkColor(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-1 text-xs font-medium cursor-pointer text-slate-700"
                          >
                            <option value="CBD5E1">Light Gray</option>
                            <option value="94A3B8">Slate Gray</option>
                            <option value="FECACA">Soft Red</option>
                            <option value="FDE68A">Soft Yellow</option>
                            <option value="99F6E4">Soft Teal</option>
                            <option value="C7D2FE">Soft Indigo</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-100/80">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={docxWatermarkSemitransparent}
                            onChange={(e) => setDocxWatermarkSemitransparent(e.target.checked)}
                            className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>Semitransparent</span>
                        </label>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Layout:</span>
                          <label className="flex items-center gap-1 text-xs font-medium text-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="modal_watermark_layout"
                              checked={docxWatermarkLayout === "diagonal"}
                              onChange={() => setDocxWatermarkLayout("diagonal")}
                              className="w-3.5 h-3.5 text-orange-600 focus:ring-orange-500"
                            />
                            <span>Diagonal</span>
                          </label>
                          <label className="flex items-center gap-1 text-xs font-medium text-slate-600 cursor-pointer">
                            <input
                              type="radio"
                              name="modal_watermark_layout"
                              checked={docxWatermarkLayout === "horizontal"}
                              onChange={() => setDocxWatermarkLayout("horizontal")}
                              className="w-3.5 h-3.5 text-orange-600 focus:ring-orange-500"
                            />
                            <span>Horizontal</span>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* APPLY BUTTON */}
                <button
                  onClick={() => {
                    onClose();
                    showNotification("Watermark and configurations applied successfully!");
                  }}
                  className="mt-2 w-full py-2.5 rounded-xl text-white text-xs font-bold bg-[#10b981] hover:bg-[#059669] active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-0"
                >
                  <CheckCircle size={14} />
                  <span>Apply Watermark</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
