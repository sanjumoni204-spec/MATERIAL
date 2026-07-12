import React from "react";
import { motion } from "motion/react";
import { FileText, X } from "lucide-react";

interface ReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastedReference: string;
  setPastedReference: (val: string) => void;
  showNotification: (msg: string) => void;
}

export function ReferenceModal({
  isOpen,
  onClose,
  pastedReference,
  setPastedReference,
  showNotification
}: ReferenceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xl max-w-lg w-full flex flex-col gap-4"
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <FileText size={16} className="text-orange-500" />
            <span>સંદર્ભ કન્ટેન્ટ પેસ્ટ કરો</span>
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[10px] text-slate-400 font-medium">
            તમારી પાસે રહેલ પીડીએફ, પુસ્તક અથવા અન્ય વેબસાઇટના પેરાગ્રાફ અહી પેસ્ટ કરો. આ કન્ટેન્ટનો ઉપયોગ કરીને AI નવું પ્રકરણ અત્યંત સચોટ રીતે તૈયાર કરશે.
          </p>
          <textarea
            value={pastedReference}
            onChange={(e) => setPastedReference(e.target.value)}
            placeholder="તમારો સંદર્ભ લખાણ અહીં પેસ્ટ કરો..."
            rows={6}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white text-slate-800"
          />
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={() => {
              setPastedReference("");
              onClose();
              showNotification("સંદર્ભ કાઢી નાખવામાં આવ્યો છે.");
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer border-0"
          >
            સાફ કરો
          </button>
          <button
            onClick={() => {
              onClose();
              showNotification(
                pastedReference.trim()
                  ? "સંદર્ભ સામગ્રી સફળતાપૂર્વક સાચવવામાં આવી છે!"
                  : "કોઈ સંદર્ભ ઉમેરાયેલ નથી."
              );
            }}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-sm active:scale-95 transition-all cursor-pointer border-0"
          >
            સંદર્ભ સાચવો
          </button>
        </div>
      </motion.div>
    </div>
  );
}
