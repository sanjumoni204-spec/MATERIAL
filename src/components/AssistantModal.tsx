import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  X,
  FileText,
  Activity,
  Check,
  Copy,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Award
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterContent: string;
  onApplyRevisedText: (newText: string) => void;
  showNotification: (msg: string) => void;
}

type TaskType = "analyze" | "grammar" | "custom";

export function AssistantModal({
  isOpen,
  onClose,
  chapterContent,
  onApplyRevisedText,
  showNotification
}: AssistantModalProps) {
  const [taskType, setTaskType] = useState<TaskType>("analyze");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunTask = async () => {
    let finalInstruction = instruction.trim();
    if (taskType === "analyze" && !finalInstruction) {
      finalInstruction = "કૃપા કરીને આ શૈક્ષણિક કન્ટેન્ટનું વિગતવાર મૂલ્યાંકન કરો, જેમ કે માહિતીની સચોટતા, ભાષા શુદ્ધિ અને સુધારાના સૂચનો.";
    } else if (taskType === "grammar" && !finalInstruction) {
      finalInstruction = "કૃપા કરીને આ લખાણમાં રહેલી જોડણી, વ્યાકરણ અને વિરામચિહ્નોની ભૂલો સુધારીને સુધારેલ લખાણ પ્રદાન કરો.";
    }

    if (!finalInstruction) {
      setError("કૃપા કરીને તમારી સૂચના અથવા પ્રશ્ન લખો.");
      return;
    }

    if (!chapterContent.trim()) {
      setError("પ્રકરણમાં કોઈ કન્ટેન્ટ નથી. કૃપા કરીને પહેલા પ્રકરણ બનાવો અથવા કંઈક લખો.");
      return;
    }

    setIsRunning(true);
    setError(null);
    setResult("");

    try {
      const response = await fetch("/api/assistant/task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          content: chapterContent,
          instruction: finalInstruction
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "ટાસ્ક દરમિયાન કોઈ ભૂલ આવી.");
      }

      setResult(data.result);
      showNotification("નવી આઇડોલોજી માહિતી તૈયાર છે!");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "ટાસ્ક રન કરવામાં મુશ્કેલી આવી છે.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    showNotification("પરિણામ કોપી થઈ ગયું છે!");
  };

  const handleApplyToChapter = () => {
    if (!result) return;
    onApplyRevisedText(result);
    showNotification("પ્રકરણમાં સુધારેલું લખાણ સફળતાપૂર્વક અપડેટ થઈ ગયું છે!");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-none">AI આઇડોલોજી અને વ્યાકરણ અસિસ્ટન્ટ</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Gemini Intelligence Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 cursor-pointer transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Panel - Inputs & Tab Selection (40% width) */}
          <div className="md:w-[40%] border-r border-slate-100 p-5 flex flex-col gap-4 overflow-y-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">મદદનીશ મોડ પસંદ કરો (Select Assistant Mode)</span>
            
            {/* Mode Selectors */}
            <div className="flex flex-col gap-2">
              {[
                {
                  id: "analyze",
                  title: "કન્ટેન્ટ મૂલ્યાંકન (Content Analysis)",
                  desc: "નબળાઈઓ અને મૂલ્યવાન સુધારાઓ શોધો",
                  model: "gemini-3.1-pro-preview",
                  color: "border-indigo-200 bg-indigo-50/20 text-indigo-800"
                },
                {
                  id: "grammar",
                  title: "જોડણી અને વ્યાકરણ શુદ્ધિકરણ",
                  desc: "ગુજરાતી ભાષાકીય શુદ્ધિ અને યોગ્ય ફોર્મેટિંગ",
                  model: "gemini-3.1-flash-lite",
                  color: "border-teal-200 bg-teal-50/20 text-teal-800"
                },
                {
                  id: "custom",
                  title: "કસ્ટમ જાદુઈ પ્રશ્નોત્તરી (Custom Query)",
                  desc: "પ્રકરણ આધારિત કોઈ પણ પ્રશ્ન પૂછો",
                  model: "gemini-3.5-flash",
                  color: "border-orange-200 bg-orange-50/20 text-orange-800"
                }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTaskType(item.id as TaskType);
                    setInstruction("");
                  }}
                  className={`p-3 rounded-2xl text-left border cursor-pointer transition-all ${
                    taskType === item.id
                      ? `${item.color} shadow-xs ring-1 ring-slate-150`
                      : "border-slate-150 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <h4 className="text-xs font-black">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug font-medium">{item.desc}</p>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1 uppercase">Engine: {item.model}</span>
                </button>
              ))}
            </div>

            {/* Instruction input */}
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {taskType === "custom" ? "તમારો પ્રશ્ન લખો" : "વિશેષ સૂચનાઓ (વૈકલ્પિક)"}
              </label>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={
                  taskType === "analyze"
                    ? "દા.ત. 'અભ્યાસક્રમની દ્રષ્ટિએ આ પ્રકરણ કેટલું સચોટ છે તે ચકાસો અને ખૂટતા પોઇન્ટ્સ દર્શાવો'..."
                    : taskType === "grammar"
                    ? "દા.ત. 'બધા અશુદ્ધ શબ્દોને સાચા કરો અને વિરામચિહ્નો બરાબર ગોઠવો'..."
                    : "દા.ત. 'આ પ્રકરણમાંથી એક સુંદર પ્રસ્તાવનાનો પેરેગ્રાફ અલગ તારવી આપો'..."
                }
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 resize-none leading-relaxed"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[10px] font-bold text-red-700">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Trigger */}
            <button
              onClick={handleRunTask}
              disabled={isRunning || (taskType === "custom" && !instruction.trim())}
              className={`w-full py-3 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer border-0 mt-auto ${
                isRunning || (taskType === "custom" && !instruction.trim())
                  ? "bg-slate-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {isRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={12} className="animate-spin" /> પ્રક્રિયા ચાલુ છે...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <Sparkles size={12} /> ટાસ્ક શરૂ કરો
                </span>
              )}
            </button>
          </div>

          {/* Right Panel - Result Preview (60% width) */}
          <div className="flex-1 bg-slate-50 p-5 flex flex-col gap-3 overflow-hidden">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">પરિણામ પૂર્વાવલોકન (Result Output)</span>
            
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 overflow-y-auto shadow-inner relative">
              {result ? (
                <div className="markdown-body prose max-w-none text-slate-850 text-xs font-semibold leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <HelpCircle size={32} className="text-slate-300 animate-pulse" />
                  <span className="text-xs font-bold mt-2">કોઈ આઉટપુટ હજી ઉપલબ્ધ નથી.</span>
                  <span className="text-[10px] text-slate-400 max-w-xs mt-1 font-medium">ડાબી બાજુ સૂચના આપીને 'ટાસ્ક શરૂ કરો' બટન પર ક્લિક કરો.</span>
                </div>
              )}
            </div>

            {/* Output Utilities */}
            {result && (
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-4 py-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400">પરિણામ ક્રિયાઓ:</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyResult}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Copy size={11} /> નકલ કરો (Copy)
                  </button>
                  {taskType === "grammar" && (
                    <button
                      onClick={handleApplyToChapter}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer flex items-center gap-1 border-0"
                    >
                      <Check size={11} /> પ્રકરણમાં બદલો
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>
      </motion.div>
    </div>
  );
}
