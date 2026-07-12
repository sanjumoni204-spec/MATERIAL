import React, { useState } from "react";
import { Check, X, RefreshCw, Eye, BookOpen, Award, Sparkles } from "lucide-react";
import { motion } from "motion/react";

export interface ParsedMCQ {
  index: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: string;
}

interface InteractiveQuizProps {
  mcqs: ParsedMCQ[];
  themeColorPrimary: string;
  themeColorSecondary: string;
  themeColorAccent: string;
  appTheme: string;
  fontFamily?: string;
  fontSize?: string;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  mcqs,
  themeColorPrimary,
  themeColorSecondary,
  themeColorAccent,
  appTheme,
  fontFamily,
  fontSize,
}) => {
  const isDark = appTheme === "Cozy Dark Mode";
  
  // Quiz states
  const [mode, setMode] = useState<"interactive" | "study">("interactive");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [showAllAnswers, setShowAllAnswers] = useState(false);

  if (!mcqs || mcqs.length === 0) return null;

  // Conversion of English index/scores to Gujarati numerals for supreme local look
  const toGujaratiDigits = (num: number | string): string => {
    const map: Record<string, string> = {
      "0": "૦", "1": "૧", "2": "૨", "3": "૩", "4": "૪",
      "5": "૫", "6": "૬", "7": "૭", "8": "૮", "9": "૯"
    };
    return num.toString().replace(/[0-9]/g, (m) => map[m]);
  };

  const handleOptionClick = (qIndex: string, option: "A" | "B" | "C" | "D") => {
    if (mode === "study") return; // Statically highlighted in study mode
    setSelectedAnswers(prev => ({
      ...prev,
      [qIndex]: option
    }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setShowAllAnswers(false);
  };

  // Calculate results
  const totalQuestions = mcqs.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = mcqs.reduce((acc, mcq) => {
    const userAns = selectedAnswers[mcq.index];
    if (userAns && mcq.correctAnswer && userAns.toUpperCase() === mcq.correctAnswer.toUpperCase()) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const scorePercentage = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

  return (
    <div 
      className="mt-10 mb-12 no-print" 
      style={{ fontFamily }}
    >
      {/* SECTION HEADER WITH SUBTITLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-8 border-b border-slate-200/60">
        <div>
          <h3 
            className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 m-0"
            style={{ color: themeColorPrimary }}
          >
            <Sparkles size={24} style={{ color: themeColorAccent }} />
            હેતુલક્ષી પ્રશ્નોત્તરી (Practice Mock MCQs)
          </h3>
          <p className={`text-xs mt-1 m-0 font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            પરીક્ષા લક્ષી અતિ અગત્યના વૈકલ્પિક પ્રશ્નોત્તરી દ્વારા તમારી તૈયારીનું મૂલ્યાંકન કરો.
          </p>
        </div>

        {/* MODE SELECTOR */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
        }`}>
          <button
            type="button"
            onClick={() => setMode("interactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "interactive"
                ? isDark
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Award size={14} style={{ color: mode === "interactive" ? themeColorSecondary : undefined }} />
            લાઇવ ટેસ્ટ મોડ
          </button>
          <button
            type="button"
            onClick={() => setMode("study")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "study"
                ? isDark
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen size={14} style={{ color: mode === "study" ? themeColorSecondary : undefined }} />
            વાંચન મોડ (સ્ટડી)
          </button>
        </div>
      </div>

      {/* SCOREBOARD IF INTERACTIVE AND STARTED */}
      {mode === "interactive" && answeredCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-5 rounded-2xl mb-8 border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isDark 
              ? "bg-slate-900/60 border-slate-800" 
              : "bg-gradient-to-r from-slate-50 to-white border-slate-200 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm"
              style={{ backgroundColor: themeColorPrimary }}
            >
              {toGujaratiDigits(correctCount)}
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 m-0">
                તમારો સ્કોર: {toGujaratiDigits(correctCount)} / {toGujaratiDigits(totalQuestions)} સાચા જવાબો
              </h4>
              <p className={`text-xs mt-0.5 m-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                તમે {toGujaratiDigits(answeredCount)} માંથી {toGujaratiDigits(correctCount)} પ્રશ્નોના સાચા જવાબ આપ્યા છે ({toGujaratiDigits(Math.round(scorePercentage))}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAllAnswers(prev => !prev)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                showAllAnswers
                  ? "bg-slate-200 border-slate-300 text-slate-800"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              <Eye size={13} />
              {showAllAnswers ? "જવાબો છુપાવો" : "બધા જવાબો જુઓ"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-1.5 hover:opacity-90 active:scale-95 border-0"
              style={{ backgroundColor: themeColorSecondary }}
            >
              <RefreshCw size={13} />
              ટેસ્ટ ફરી શરૂ કરો
            </button>
          </div>
        </motion.div>
      )}

      {/* EXHORTATION IF ALL CORRECT */}
      {mode === "interactive" && answeredCount === totalQuestions && correctCount === totalQuestions && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-6 rounded-2xl mb-8 border border-emerald-200 bg-emerald-50 text-emerald-800 flex flex-col items-center text-center gap-2"
        >
          <Award size={40} className="text-emerald-600 animate-bounce" />
          <h4 className="text-base font-black m-0 text-emerald-900">ઉત્કૃષ્ટ પ્રદર્શન! અદ્ભુત પરિણામ!</h4>
          <p className="text-xs m-0 text-emerald-700">
            તમે બધા જ {toGujaratiDigits(totalQuestions)} પ્રશ્નોના સાચા ઉત્તરો આપ્યા છે. તમારી તૈયારી ખૂબ જ ઉત્તમ સ્તર પર છે!
          </p>
        </motion.div>
      )}

      {/* MCQS CARDS LISTING */}
      <div className="flex flex-col gap-6">
        {mcqs.map((mcq, mcqIdx) => {
          const userSelected = selectedAnswers[mcq.index];
          const hasAnswered = !!userSelected;
          const correctOption = mcq.correctAnswer?.toUpperCase();

          return (
            <div
              key={mcq.index}
              className={`p-6 md:p-8 rounded-2xl border transition-all duration-300 flex flex-col gap-5 ${
                isDark
                  ? "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80"
                  : "bg-white border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300/80"
              }`}
            >
              {/* Question Header & Badge */}
              <div className="flex items-start gap-3.5">
                <span 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 text-white shadow-xs mt-0.5"
                  style={{ backgroundColor: themeColorPrimary }}
                >
                  {toGujaratiDigits(mcqIdx + 1)}
                </span>
                <div className="flex-1">
                  <h4 className="text-base font-bold leading-relaxed text-slate-900 dark:text-slate-100 m-0">
                    {mcq.question}
                  </h4>
                </div>
              </div>

              {/* 2-Column Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(["A", "B", "C", "D"] as const).map((optKey) => {
                  const optionText = mcq.options[optKey];
                  if (!optionText) return null;

                  const isCorrect = correctOption === optKey;
                  const isSelected = userSelected === optKey;

                  // CSS styling calculations
                  let buttonStyle = `w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between gap-3 text-sm font-semibold cursor-pointer select-none bg-transparent ${
                    isDark 
                      ? "border-slate-800 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700" 
                      : "border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                  }`;

                  let optionBadgeColor = isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500";
                  let rightIcon = null;

                  if (mode === "study") {
                    // Study Mode Styles (Statically Highlights Correct Option)
                    if (isCorrect) {
                      buttonStyle = "w-full text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/75 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-300 text-sm font-bold shadow-xs select-none cursor-default";
                      optionBadgeColor = "bg-emerald-500 text-white";
                      rightIcon = (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 shadow-2xs">
                          <Check size={11} strokeWidth={3} />
                          સાચો જવાબ
                        </span>
                      );
                    } else {
                      buttonStyle = `w-full text-left p-4 rounded-xl border-2 border-transparent text-sm font-semibold opacity-60 cursor-default select-none ${
                        isDark ? "text-slate-400" : "text-slate-500"
                      }`;
                    }
                  } else {
                    // Interactive Mode Styles
                    if (hasAnswered) {
                      if (isCorrect) {
                        // Correct option is always green once answered
                        buttonStyle = "w-full text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/75 dark:bg-emerald-950/25 text-emerald-950 dark:text-emerald-200 text-sm font-bold shadow-xs cursor-default";
                        optionBadgeColor = "bg-emerald-500 text-white";
                        rightIcon = <Check size={16} className="text-emerald-600 dark:text-emerald-400" strokeWidth={3} />;
                      } else if (isSelected) {
                        // Incorrectly selected option turns red
                        buttonStyle = "w-full text-left p-4 rounded-xl border-2 border-rose-500 bg-rose-50/75 dark:bg-rose-950/25 text-rose-950 dark:text-rose-200 text-sm font-bold shadow-xs cursor-default";
                        optionBadgeColor = "bg-rose-500 text-white";
                        rightIcon = <X size={16} className="text-rose-600 dark:text-rose-400" strokeWidth={3} />;
                      } else {
                        // Unselected options are greyed/disabled
                        buttonStyle = `w-full text-left p-4 rounded-xl border-2 border-transparent text-sm font-semibold opacity-40 cursor-default ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`;
                      }
                    } else if (showAllAnswers) {
                      // Answers displayed because user clicked "બધા જવાબો જુઓ"
                      if (isCorrect) {
                        buttonStyle = "w-full text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-900 dark:text-emerald-300 text-sm font-bold cursor-default";
                        optionBadgeColor = "bg-emerald-500 text-white";
                      } else {
                        buttonStyle = `w-full text-left p-4 rounded-xl border-2 border-transparent text-sm font-semibold opacity-40 cursor-default ${
                          isDark ? "text-slate-500" : "text-slate-400"
                        }`;
                      }
                    }
                  }

                  return (
                    <button
                      key={optKey}
                      type="button"
                      disabled={mode === "study" || hasAnswered || showAllAnswers}
                      onClick={() => handleOptionClick(mcq.index, optKey)}
                      className={buttonStyle}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 transition-colors shadow-2xs ${optionBadgeColor}`}>
                          {optKey}
                        </span>
                        <span className="leading-relaxed">{optionText}</span>
                      </div>
                      {rightIcon}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
