import React from "react";
import { motion } from "motion/react";
import { BookOpen, X, ChevronRight } from "lucide-react";

interface SyllabusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (subject: string, title: string, instructions: string) => void;
}

export function SyllabusModal({ isOpen, onClose, onSelect }: SyllabusModalProps) {
  if (!isOpen) return null;

  const syllabi = [
    {
      label: "૧. ગુજરાતનો ઇતિહાસ: સોલંકી વંશનો સુવર્ણકાળ",
      subject: "ગુજરાતનો ઇતિહાસ (History of Gujarat)",
      title: "સોલંકી યુગનો ઇતિહાસ અને શાસન વ્યવસ્થા",
      instructions: "સિદ્ધરાજ જયસિંહ, કુમારપાળ, પાટણની પટોળા, અને મોઢેરાનું સૂર્યમંદિર વિશે ઊંડાણપૂર્વક વિગતો સામેલ કરો."
    },
    {
      label: "૨. સાંસ્કૃતિક વારસો: ગુજરાતના લોકમેળાઓ અને લોકનૃત્યો",
      subject: "સાંસ્કૃતિક વારસો (Cultural Heritage)",
      title: "ગુજરાતના લોકમેળાઓ અને વિશિષ્ટ મેળો પ્રથાઓ",
      instructions: "તરણેતરનો મેળો, વૌઠાનો મેળો, શામળાજીનો મેળો, ગરબા, રાસ, ભવાઈ અને પરંપરાગત વસ્ત્રાલંકારની ઊંડાણપૂર્વક ચર્ચા."
    },
    {
      label: "૩. ગુજરાતી સાહિત્ય: મધ્યકાલીન સાહિત્યકારો",
      subject: "ગુજરાતી સાહિત્ય (Gujarati Literature)",
      title: "મધ્યકાલીન સાહિત્યકારો અને તેમની પ્રમુખ કૃતિઓ",
      instructions: "નરસિંહ મહેતા, મીરાંબાઈ, અખો, પ્રેમાનંદ, અને શામળ ભટ્ટના પ્રમુખ પદો અને તખલ્લુસ સવિસ્તાર લખો."
    },
    {
      label: "૪. બંધારણ: ભારતીય સંસદ અને લોકશાહી",
      subject: "ભારતનું બંધારણ (Indian Constitution)",
      title: "ભારતીય બંધારણ હેઠળ સંસદ અને કાયદા ઘડવાની પ્રક્રિયા",
      instructions: "લોકસભા, રાજ્યસભા, રાષ્ટ્રપતિની સત્તાઓ, ખરડામાંથી કાયદો બનવાની પદ્ધતિ અને મહત્વના અનુચ્છેદ."
    },
    {
      label: "૫. વિજ્ઞાન અને ટેક: કોષ અને માનવ શરીર રચના",
      subject: "વિજ્ઞાન અને ટેકનોલોજી (Science & Technology)",
      title: "કોષ વિજ્ઞાન (Cell Biology) અને અંગીકાઓની રચના",
      instructions: "કોષરચના, રક્તકણો, શ્વેતકણો, મિટોકોન્ડ્રિયા, અને કોષવિભાજન પ્રક્રિયાને સુંદર કોષ્ટકો સાથે સમજાવો."
    },
    {
      label: "૬. એક્સ-રે ટેકનિશિયન: ક્ષ-કિરણ ભૌતિકશાસ્ત્ર અને અણુ રચના",
      subject: "એક્સ-રે ટેકનિશિયન (X-Ray Technician)",
      title: "X-Ray Production and Radiation protection rules",
      instructions: "X-ray tube cathode/anode structure, Bremsstrahlung, Characteristic radiation, and TLD badges radiation standards."
    }
  ];

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
            <BookOpen size={16} className="text-orange-500" />
            <span>મહત્વપૂર્ણ સ્પર્ધાત્મક સિલેબસ ઉમેરો</span>
          </h4>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {syllabi.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(item.subject, item.title, item.instructions)}
              className="text-left p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/50 text-xs font-semibold text-slate-700 transition-all flex justify-between items-center group cursor-pointer"
            >
              <span>{item.label}</span>
              <ChevronRight size={14} className="text-slate-400 group-hover:text-orange-500 transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
