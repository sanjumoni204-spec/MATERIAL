import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  Printer,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layout,
  Sliders,
  Sparkles,
  BookOpen,
  Info,
  Layers,
  Award
} from "lucide-react";

interface ParsedMCQ {
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

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  subject: string;
  examLevel: string;
  tone: string;
  
  // Custom Exporter Configs to reflect
  docxHeader: string;
  docxFooter: string;
  docxFont: string;
  docxFontSize: number;
  docxColor: string;
  
  // Watermark options
  docxWatermarkType: "none" | "text" | "picture";
  docxWatermark: string;
  docxWatermarkFont: string;
  docxWatermarkSize: string | number;
  docxWatermarkColor: string;
  docxWatermarkSemitransparent: boolean;
  docxWatermarkLayout: "diagonal" | "horizontal";
  docxWatermarkImage: string | null;
  docxWatermarkWashout: boolean;
  
  // Extra options
  docxIncludeCoverPage: boolean;
  themeColorPrimary: string;
  themeColorSecondary: string;
  themeColorAccent: string;
  appTheme: string;
  
  // Download handler
  onDownloadDocx: () => void;
  onPrint: () => void;
}

export function PrintPreviewModal({
  isOpen,
  onClose,
  title,
  content,
  subject,
  examLevel,
  tone,
  docxHeader,
  docxFooter,
  docxFont,
  docxFontSize,
  docxColor,
  docxWatermarkType,
  docxWatermark,
  docxWatermarkFont,
  docxWatermarkSize,
  docxWatermarkColor,
  docxWatermarkSemitransparent,
  docxWatermarkLayout,
  docxWatermarkImage,
  docxWatermarkWashout,
  docxIncludeCoverPage,
  themeColorPrimary,
  themeColorSecondary,
  themeColorAccent,
  appTheme,
  onDownloadDocx,
  onPrint
}: PrintPreviewModalProps) {
  const isDark = appTheme === "Cozy Dark Mode";

  // States
  const [zoom, setZoom] = useState<number>(90); // 50% to 120%
  const [marginSize, setMarginSize] = useState<"narrow" | "standard" | "wide">("narrow");
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [layoutMode, setLayoutMode] = useState<"book" | "scroll">("book");

  if (!isOpen) return null;

  // Conversion of English index/scores to Gujarati numerals
  const toGujaratiDigits = (num: number | string): string => {
    const map: Record<string, string> = {
      "0": "૦", "1": "૧", "2": "૨", "3": "૩", "4": "૪",
      "5": "૫", "6": "૬", "7": "૭", "8": "૮", "9": "૯"
    };
    return num.toString().replace(/[0-9]/g, (m) => map[m]);
  };

  // 1. Process content by splitting MCQs
  const { bookText, mcqText } = useMemo(() => {
    if (!content) return { bookText: "", mcqText: "" };
    const mcqHeaderIndex = content.search(/(?:###|##|#)?\s*\*?\*?હેતુલક્ષી પ્રશ્નોત્તરી/i);
    if (mcqHeaderIndex !== -1) {
      const bText = content.substring(0, mcqHeaderIndex).trim();
      const mText = content.substring(mcqHeaderIndex).trim();
      return { bookText: bText, mcqText: mText };
    }
    return { bookText: content, mcqText: "" };
  }, [content]);

  // 2. Intelligent Pagination algorithm: Splits text into logical blocks, ensuring heading integrity and estimated page breaks
  const pages = useMemo(() => {
    const renderedPages: string[] = [];
    const lines = bookText.split(/\r?\n/);
    
    let currentPageLines: string[] = [];
    let currentLength = 0;
    
    // Page height limit parameters (est. character length)
    const maxLengthPerPage = marginSize === "narrow" ? 1700 : marginSize === "wide" ? 1200 : 1450;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      currentPageLines.push(line);
      currentLength += line.length + 1;

      const isHeading = line.startsWith("# ") || line.startsWith("## ") || line.startsWith("### ");
      
      // Page division criteria
      if (currentLength >= maxLengthPerPage || (isHeading && currentLength > maxLengthPerPage * 0.6)) {
        // If it's a heading, try to push previous lines and start new page with this heading (avoiding orphans)
        if (isHeading && currentPageLines.length > 1) {
          const headingLine = currentPageLines.pop();
          renderedPages.push(currentPageLines.join("\n"));
          currentPageLines = headingLine ? [headingLine] : [];
          currentLength = headingLine ? headingLine.length : 0;
        } else {
          renderedPages.push(currentPageLines.join("\n"));
          currentPageLines = [];
          currentLength = 0;
        }
      }
    }
    
    if (currentPageLines.length > 0) {
      renderedPages.push(currentPageLines.join("\n"));
    }

    // Append MCQs as their own page(s) if present
    if (mcqText) {
      const mcqLines = mcqText.split(/\r?\n/);
      let tempMcqPage: string[] = [];
      let tempLen = 0;
      
      for (let j = 0; j < mcqLines.length; j++) {
        const mLine = mcqLines[j];
        tempMcqPage.push(mLine);
        tempLen += mLine.length + 1;
        
        if (tempLen >= maxLengthPerPage) {
          renderedPages.push(tempMcqPage.join("\n"));
          tempMcqPage = [];
          tempLen = 0;
        }
      }
      if (tempMcqPage.length > 0) {
        renderedPages.push(tempMcqPage.join("\n"));
      }
    }

    return renderedPages.length > 0 ? renderedPages : ["પ્રકરણ સામગ્રી ખાલી છે."];
  }, [bookText, mcqText, marginSize]);

  const totalPagesCount = pages.length + (docxIncludeCoverPage ? 1 : 0);

  // Layout Font Family resolution
  const resolvedFontFamily = docxFont === "Hind Vadodara SemiBold" ? "Hind Vadodara" : docxFont;

  // Zoom styles
  const zoomFactor = zoom / 100;

  // Margin CSS mapping
  const marginClasses = {
    narrow: "px-8 py-8",     // 0.5 in
    standard: "px-14 py-14", // 1 in
    wide: "px-20 py-20"      // 1.25 in
  };

  const handleNextPage = () => {
    if (activePageIndex < totalPagesCount - 1) {
      setActivePageIndex(activePageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 no-print select-none">
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15, scale: 0.98 }}
        className={`rounded-3xl border ${
          isDark ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-800"
        } shadow-2xl max-w-[95vw] w-[1200px] h-[92vh] flex flex-col overflow-hidden`}
      >
        {/* HEADER BAR */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          isDark ? "border-slate-800/80 bg-slate-900/40" : "border-slate-100 bg-slate-50/50"
        }`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
              style={{ backgroundColor: themeColorPrimary }}
            >
              <Eye size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 m-0 flex items-center gap-2">
                <span>પ્રિન્ટ-ફ્રેન્ડલી ડોક્યુમેન્ટ પ્રિવ્યૂ</span>
                <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">PRE-FLIGHT</span>
              </h3>
              <p className={`text-[11px] font-medium m-0 mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                ડાઉનલોડ અથવા પ્રિન્ટ કરતા પહેલા પેજીનેશન, વોટરમાર્ક અને સેટિંગ્સ ચકાસો.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer transition-all border-0 bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className={`px-6 py-3 border-b flex flex-wrap gap-4 items-center justify-between shrink-0 ${
          isDark ? "border-slate-800 bg-slate-900/20" : "border-slate-100 bg-slate-50/30"
        }`}>
          {/* Zoom and Page controls */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* View layout selector */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setLayoutMode("book")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === "book"
                    ? "bg-white dark:bg-slate-800 shadow-xs text-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Layers size={13} />
                <span>પેજ-બાય-પેજ</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("scroll")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  layoutMode === "scroll"
                    ? "bg-white dark:bg-slate-800 shadow-xs text-slate-800 dark:text-white"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Layout size={13} />
                <span>સળંગ સ્ક્રોલ</span>
              </button>
            </div>

            {/* Zoom Adjuster */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 transition-all cursor-pointer border-0 bg-transparent"
                title="ઝૂમ આઉટ"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-xs font-black text-slate-600 dark:text-slate-300 w-12 text-center select-none">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(120, zoom + 10))}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 transition-all cursor-pointer border-0 bg-transparent"
                title="ઝૂમ ઇન"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Margins Adjuster */}
            <div className="flex items-center gap-1.5">
              <Sliders size={13} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500">માર્જિન:</span>
              <select
                value={marginSize}
                onChange={(e) => {
                  setMarginSize(e.target.value as any);
                  setActivePageIndex(0);
                }}
                className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold px-2 py-1 text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
              >
                <option value="narrow">સાંકડું (Narrow - 0.5")</option>
                <option value="standard">સામાન્ય (Standard - 1.0")</option>
                <option value="wide">પહોળું (Wide - 1.25")</option>
              </select>
            </div>
          </div>

          {/* Action trigger buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onPrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-0"
            >
              <Printer size={14} />
              <span>ડાયરેક્ટ પ્રિન્ટ</span>
            </button>

            <button
              onClick={onDownloadDocx}
              className="px-4.5 py-2 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 hover:opacity-95 active:scale-95 transition-all cursor-pointer border-0"
              style={{ backgroundColor: themeColorPrimary }}
            >
              <Download size={14} />
              <span>વર્ડ (.docx) ડાઉનલોડ</span>
            </button>
          </div>
        </div>

        {/* MIDDLE CONTENT CONTAINER (PREVIEW STAGE) */}
        <div className={`flex-1 overflow-auto p-8 flex justify-center items-start ${
          isDark ? "bg-slate-950" : "bg-slate-100"
        }`}>
          {/* Scale Outer wrapper to perform high-quality CSS zoom */}
          <div 
            className="transition-transform origin-top duration-200 flex flex-col items-center gap-8"
            style={{ transform: `scale(${zoomFactor})` }}
          >
            {layoutMode === "book" ? (
              /* BOOK PAGE-BY-PAGE VIEW */
              <div className="relative">
                {activePageIndex === 0 && docxIncludeCoverPage ? (
                  /* SIMULATED COVER PAGE */
                  <div 
                    id="simulated-cover-page"
                    className={`w-[794px] h-[1123px] bg-white text-slate-800 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between p-16 select-text`}
                    style={{ fontFamily: resolvedFontFamily }}
                  >
                    {/* Cover design top accent */}
                    <div className="absolute top-0 left-0 right-0 h-4" style={{ backgroundColor: themeColorPrimary }}></div>
                    <div className="absolute top-4 left-0 right-0 h-1.5" style={{ backgroundColor: themeColorSecondary }}></div>

                    {/* Logo Area */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
                          style={{ backgroundColor: themeColorPrimary }}
                        >
                          KS
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-900 m-0">નોલેજ સંકુલ</h2>
                          <p className="text-[10px] text-slate-400 font-bold m-0 uppercase tracking-widest">Knowledge Sankul</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">અધિકૃત સ્ટડી મટીરીયલ</span>
                      </div>
                    </div>

                    {/* Title & Subject info */}
                    <div className="my-auto flex flex-col gap-6 text-center py-10">
                      <div className="flex justify-center mb-4">
                        <div 
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white"
                          style={{ backgroundColor: `${themeColorPrimary}15` }}
                        >
                          <BookOpen size={48} style={{ color: themeColorPrimary }} />
                        </div>
                      </div>
                      <span 
                        className="text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block mx-auto"
                        style={{ backgroundColor: `${themeColorPrimary}12`, color: themeColorPrimary }}
                      >
                        {subject || "જનરલ સ્ટડીઝ"}
                      </span>
                      <h1 
                        className="text-3xl md:text-4xl font-black leading-tight tracking-tight m-0"
                        style={{ color: themeColorPrimary }}
                      >
                        {title || "પ્રકરણ શીર્ષક"}
                      </h1>
                      <div className="h-[2px] w-24 bg-rose-500 mx-auto rounded-full"></div>
                      <p className="text-sm font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                        પરીક્ષાલક્ષી અદ્યતન અને સંપૂર્ણ વન-સ્ટોપ સંકલિત મટીરીયલ
                      </p>
                    </div>

                    {/* Meta info footer */}
                    <div className="border-t border-slate-100 pt-8 flex items-center justify-between">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">સ્પર્ધાત્મક પરીક્ષા સ્તર</span>
                        <span className="text-xs font-bold text-slate-700">{examLevel}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">પદ્ધતિ અને શૈલી</span>
                        <span className="text-xs font-bold text-slate-700">{tone}</span>
                      </div>
                    </div>

                    {/* Cover footer brand watermark */}
                    <div className="text-center mt-4">
                      <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase m-0">
                        © ૨૦૨૬ નોલેજ સંકુલ પ્રકાશન • ALL RIGHTS RESERVED
                      </p>
                    </div>
                  </div>
                ) : (
                  /* REGULAR PAGINATED PAGE WITH HEADER, FOOTER & WATERMARK */
                  <div 
                    className={`w-[794px] h-[1123px] bg-white text-slate-800 rounded-lg shadow-xl relative flex flex-col justify-between select-text overflow-hidden`}
                    style={{ fontFamily: resolvedFontFamily }}
                  >
                    {/* Header line and yellow highlighter */}
                    <div className="px-10 pt-8 pb-3 flex justify-center border-b border-slate-100 shrink-0">
                      {docxHeader && (
                        <div className="bg-yellow-200/80 px-4 py-0.5 rounded-md text-[11px] font-black tracking-wide text-center uppercase text-slate-800">
                          {docxHeader}
                        </div>
                      )}
                    </div>

                    {/* WATERMARK LAYER */}
                    {docxWatermarkType !== "none" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                        {docxWatermarkType === "text" && docxWatermark && (
                          <div
                            className="text-center font-black tracking-widest text-slate-200 select-none uppercase opacity-35"
                            style={{
                              transform: docxWatermarkLayout === "diagonal" ? "rotate(-30deg)" : "none",
                              fontSize: docxWatermarkSize === "Auto" ? "4rem" : `${Number(docxWatermarkSize) * 1.3}px`,
                              fontFamily: docxWatermarkFont === "Hind Vadodara SemiBold" ? "Hind Vadodara" : docxWatermarkFont,
                              color: docxWatermarkColor ? `#${docxWatermarkColor.replace("#", "")}` : "#CBD5E1"
                            }}
                          >
                            {docxWatermarkLayout === "diagonal" 
                              ? `* * * ${docxWatermark} * * *` 
                              : `--- ${docxWatermark} ---`
                            }
                          </div>
                        )}
                        {docxWatermarkType === "picture" && (
                          docxWatermarkImage ? (
                            <img
                              src={docxWatermarkImage}
                              alt="Watermark Logo"
                              className="w-80 h-80 object-contain opacity-8 select-none pointer-events-none"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-96 h-96 rounded-full border-[12px] border-slate-200/25 flex items-center justify-center font-black text-8xl text-slate-200/20 select-none">
                              KS
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {/* Main text content body */}
                    <div className={`flex-1 overflow-hidden relative z-10 ${marginClasses[marginSize]}`}>
                      <div className="prose prose-sm max-w-none text-slate-800 print-preview-markdown text-left">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {pages[docxIncludeCoverPage ? activePageIndex - 1 : activePageIndex]}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Page Footer */}
                    <div className="px-10 pb-8 pt-3 border-t border-slate-100 shrink-0 flex items-center justify-between text-[11px] font-black text-slate-500">
                      <div className="truncate max-w-[350px]">
                        {docxFooter ? docxFooter.replace(/\s*\|\s*પેજ નં\.?\s*/gi, "").trim() : `${title || "પ્રકરણ"} - નોલેજ સંકુલ`}
                      </div>
                      <div className="shrink-0 flex items-center gap-1">
                        <span>પેજ નં.</span>
                        <span className="font-bold">{toGujaratiDigits(activePageIndex + 1)}</span>
                        <span>/</span>
                        <span>{toGujaratiDigits(totalPagesCount)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Left/Right Floating Page Navigation triggers */}
                <div className="absolute top-1/2 -left-16 -translate-y-1/2 flex flex-col gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={activePageIndex === 0}
                    className={`w-12 h-12 rounded-full shadow-lg border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 cursor-pointer text-slate-700 transition-all ${
                      activePageIndex === 0 ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
                    }`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-[10px] font-black text-center bg-slate-800/80 text-white px-2 py-1 rounded-md">
                    {toGujaratiDigits(activePageIndex + 1)} / {toGujaratiDigits(totalPagesCount)}
                  </span>
                </div>
                
                <div className="absolute top-1/2 -right-16 -translate-y-1/2 flex flex-col gap-2">
                  <button
                    onClick={handleNextPage}
                    disabled={activePageIndex === totalPagesCount - 1}
                    className={`w-12 h-12 rounded-full shadow-lg border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 cursor-pointer text-slate-700 transition-all ${
                      activePageIndex === totalPagesCount - 1 ? "opacity-30 cursor-not-allowed" : "hover:scale-105"
                    }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            ) : (
              /* SCROLL/SANGAT SCRROLL VIEW */
              <div className="flex flex-col gap-8 items-center max-h-[70vh] overflow-y-auto p-4 select-text">
                {docxIncludeCoverPage && (
                  <div 
                    className="w-[794px] h-[1123px] bg-white text-slate-800 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between p-16 shrink-0"
                    style={{ fontFamily: resolvedFontFamily }}
                  >
                    {/* Cover design top accent */}
                    <div className="absolute top-0 left-0 right-0 h-4" style={{ backgroundColor: themeColorPrimary }}></div>
                    <div className="absolute top-4 left-0 right-0 h-1.5" style={{ backgroundColor: themeColorSecondary }}></div>

                    {/* Logo Area */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
                          style={{ backgroundColor: themeColorPrimary }}
                        >
                          KS
                        </div>
                        <div>
                          <h2 className="text-base font-black text-slate-900 m-0">નોલેજ સંકુલ</h2>
                          <p className="text-[10px] text-slate-400 font-bold m-0 uppercase tracking-widest">Knowledge Sankul</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold">અધિકૃત સ્ટડી મટીરીયલ</span>
                      </div>
                    </div>

                    {/* Title & Subject info */}
                    <div className="my-auto flex flex-col gap-6 text-center py-10">
                      <div className="flex justify-center mb-4">
                        <div 
                          className="w-20 h-20 rounded-2xl flex items-center justify-center text-white"
                          style={{ backgroundColor: `${themeColorPrimary}15` }}
                        >
                          <BookOpen size={48} style={{ color: themeColorPrimary }} />
                        </div>
                      </div>
                      <span 
                        className="text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block mx-auto"
                        style={{ backgroundColor: `${themeColorPrimary}12`, color: themeColorPrimary }}
                      >
                        {subject || "જનરલ સ્ટડીઝ"}
                      </span>
                      <h1 
                        className="text-3xl md:text-4xl font-black leading-tight tracking-tight m-0"
                        style={{ color: themeColorPrimary }}
                      >
                        {title || "પ્રકરણ શીર્ષક"}
                      </h1>
                      <div className="h-[2px] w-24 bg-rose-500 mx-auto rounded-full"></div>
                      <p className="text-sm font-bold text-slate-500 max-w-md mx-auto leading-relaxed">
                        પરીક્ષાલક્ષી અદ્યતન અને સંપૂર્ણ વન-સ્ટોપ સંકલિત મટીરીયલ
                      </p>
                    </div>

                    {/* Meta info footer */}
                    <div className="border-t border-slate-100 pt-8 flex items-center justify-between">
                      <div className="flex flex-col gap-1 text-left">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">સ્પર્ધાત્મક પરીક્ષા સ્તર</span>
                        <span className="text-xs font-bold text-slate-700">{examLevel}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">પદ્ધતિ અને શૈલી</span>
                        <span className="text-xs font-bold text-slate-700">{tone}</span>
                      </div>
                    </div>

                    {/* Cover footer brand watermark */}
                    <div className="text-center mt-4">
                      <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase m-0">
                        © ૨૦૨૬ નોલેજ સંકુલ પ્રકાશન • ALL RIGHTS RESERVED
                      </p>
                    </div>
                  </div>
                )}

                {/* SCROLLABLE LIST OF ALL GENERATED PAGES */}
                {pages.map((pageText, idx) => {
                  const displayPageIndex = docxIncludeCoverPage ? idx + 1 : idx;
                  return (
                    <div 
                      key={idx}
                      className="w-[794px] h-[1123px] bg-white text-slate-800 rounded-lg shadow-xl relative flex flex-col justify-between overflow-hidden shrink-0"
                      style={{ fontFamily: resolvedFontFamily }}
                    >
                      {/* Page Header */}
                      <div className="px-10 pt-8 pb-3 flex justify-center border-b border-slate-100 shrink-0">
                        {docxHeader && (
                          <div className="bg-yellow-200/80 px-4 py-0.5 rounded-md text-[11px] font-black tracking-wide text-center uppercase text-slate-800">
                            {docxHeader}
                          </div>
                        )}
                      </div>

                      {/* WATERMARK LAYER */}
                      {docxWatermarkType !== "none" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
                          {docxWatermarkType === "text" && docxWatermark && (
                            <div
                              className="text-center font-black tracking-widest text-slate-200 select-none uppercase opacity-35"
                              style={{
                                transform: docxWatermarkLayout === "diagonal" ? "rotate(-30deg)" : "none",
                                fontSize: docxWatermarkSize === "Auto" ? "4rem" : `${Number(docxWatermarkSize) * 1.3}px`,
                                fontFamily: docxWatermarkFont === "Hind Vadodara SemiBold" ? "Hind Vadodara" : docxWatermarkFont,
                                color: docxWatermarkColor ? `#${docxWatermarkColor.replace("#", "")}` : "#CBD5E1"
                              }}
                            >
                              {docxWatermarkLayout === "diagonal" 
                                ? `* * * ${docxWatermark} * * *` 
                                : `--- ${docxWatermark} ---`
                              }
                            </div>
                          )}
                          {docxWatermarkType === "picture" && (
                            docxWatermarkImage ? (
                              <img
                                src={docxWatermarkImage}
                                alt="Watermark Logo"
                                className="w-80 h-80 object-contain opacity-8 select-none pointer-events-none"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-96 h-96 rounded-full border-[12px] border-slate-200/25 flex items-center justify-center font-black text-8xl text-slate-200/20 select-none">
                                KS
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {/* Content stage */}
                      <div className={`flex-1 overflow-hidden relative z-10 ${marginClasses[marginSize]}`}>
                        <div className="prose prose-sm max-w-none text-slate-800 text-left print-preview-markdown">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {pageText}
                          </ReactMarkdown>
                        </div>
                      </div>

                      {/* Page Footer */}
                      <div className="px-10 pb-8 pt-3 border-t border-slate-100 shrink-0 flex items-center justify-between text-[11px] font-black text-slate-500">
                        <div className="truncate max-w-[350px]">
                          {docxFooter ? docxFooter.replace(/\s*\|\s*પેજ નં\.?\s*/gi, "").trim() : `${title || "પ્રકરણ"} - નોલેજ સંકુલ`}
                        </div>
                        <div className="shrink-0 flex items-center gap-1">
                          <span>પેજ નં.</span>
                          <span className="font-bold">{toGujaratiDigits(displayPageIndex + 1)}</span>
                          <span>/</span>
                          <span>{toGujaratiDigits(totalPagesCount)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* METRICS / GUIDELINE FOOTER */}
        <div className={`px-6 py-3 border-t flex flex-wrap gap-4 items-center justify-between shrink-0 text-xs text-slate-500 ${
          isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50"
        }`}>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 font-semibold">
              <Info size={14} className="text-[#f15a24]" />
              <span>કુલ અંદાજીત પૃષ્ઠ સંખ્યા:</span>
              <span className="text-slate-800 dark:text-slate-200 font-black bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {toGujaratiDigits(totalPagesCount)} પેજ
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-medium">
              <span className="text-[10px] uppercase font-black text-slate-400">ફોન્ટ ફેમિલી:</span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{resolvedFontFamily} ({docxFontSize}pt)</span>
            </div>

            {docxWatermarkType !== "none" && (
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[10px] uppercase font-black text-slate-400">વોટરમાર્ક:</span>
                <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/50">
                  {docxWatermarkType === "text" ? `શાબ્દિક (${docxWatermark})` : "લોગો છબી (washout)"}
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] font-semibold text-slate-400">
            KNOWLEDGE SANKUL WYSIWYG PRE-FLIGHT PREVIEWER v1.2
          </div>
        </div>
      </motion.div>
    </div>
  );
}
