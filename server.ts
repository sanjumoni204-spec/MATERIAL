import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize GoogleGenAI client lazy/safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to check if an API error is due to rate limits or quota exhaustion
function isQuotaError(err: any): boolean {
  const errMsg = err.message?.toLowerCase() || "";
  const errStatus = err.status || err.code;
  return (
    errMsg.includes("quota") ||
    errMsg.includes("exceeded") ||
    errMsg.includes("resource_exhausted") ||
    errMsg.includes("rate limit") ||
    errMsg.includes("429") ||
    errStatus === 429
  );
}

// Returns a beautiful, localized Gujarati guidelines message for users hitting quotas
function getFriendlyQuotaError(originalError: any): string {
  const details = originalError.message || originalError;
  return `ગૂગલ આર્ટિફિશિયલ ઇન્ટેલિજન્સ (Gemini API) ની સેવાની મર્યાદા (Quota / Rate Limit) પૂર્ણ થઈ ગઈ છે.

આ સમસ્યાના ઉકેલ માટે નીચેના સરળ ઉપાયો અજમાવો:
૧. થોડી સેકન્ડો કે એકાદ મિનિટ પછી ફરીથી પ્રયત્ન કરો.
૨. પેરામીટર્સ બદલો પર ક્લિક કરી 'ગૂગલ સર્ચ માહિતી (Google Search)' અને 'ઊંડી વૈચારિક ક્ષમતા (High Thinking Mode)' બંધ કરો, કારણ કે તે વધુ કીમતી ક્વોટા વાપરે છે.
૩. Settings > Secrets માં જઈને તમારો પોતાનો 'GEMINI_API_KEY' દાખલ કરો જેથી તમને અવરોધ વિના અમર્યાદિત સર્જન ક્ષમતા મળી શકે.

(વિગતવાર ત્રુટિ: ${details})`;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Generate chapter
app.post("/api/chapters/generate", async (req, res) => {
  try {
    const { subject, title, examLevel, tone, length, additionalInstructions, enableSearch, enableThinking } = req.body;

    if (!subject || !title) {
      res.status(400).json({ error: "Subject and Chapter Title are required." });
      return;
    }

    const ai = getGeminiClient();

    // Custom instructions based on length
    let lengthDesc = "Standard, highly detailed textbook chapter (at least 2000-2500 words) with deep comprehensive explanations, exhaustive definitions, and full coverage of all related sub-topics. Do not summarize or skip any concepts.";
    if (length === "Short") {
      lengthDesc = "Concise yet fully detailed textbook chapter (about 1200-1500 words) with clear explanations of all core concepts without skipping syllabus items.";
    } else if (length === "Detailed") {
      lengthDesc = "Extremely detailed, exhaustive masterclass textbook chapter (at least 3500-4000 words) covering every single microscopic detail, comprehensive timelines, historical contexts, in-depth sub-topic discussions, comparative analyses, and exhaustive reference examples. Ensure absolutely no content is summarized, cut short, or condensed.";
    }

    // Dynamic subject guidelines
    let subjectGuidelines = "";
    if (subject === "ગુજરાતનો ઇતિહાસ (History of Gujarat)") {
      subjectGuidelines = "Focus heavily on critical eras: Solanki period, Maitraka, Maurya, Sultanate, Maratha, and British rule, with accurate names of kings, architecture, capitals, and administrative terms.";
    } else if (subject === "સાંસ્કૃતિક વારસો (Cultural Heritage)") {
      subjectGuidelines = "Focus on fairs (મેળાઓ), folk dances (ગરબા, રાસ, ભવાઈ), regional arts (પટોળા, પીઠોરા, બાંધણી), tribal culture, and historical monuments/temples of Gujarat with exact locations and traditional terms.";
    } else if (subject === "ગુજરાતી સાહિત્ય (Gujarati Literature)") {
      subjectGuidelines = "Cover medieval poets (નરસિંહ મહેતા, મીરાંબાઈ, અખો, પ્રેમાનંદ), modern pioneers (નર્મદ, દલપતરામ), and great novelists (ગોવર્ધનરામ ત્રિપાઠી, ક.મા. મુનશી, પન્નાલાલ પટેલ). List works, pen names (તખલ્લુસ), and major awards (જ્ઞાનપીઠ, રણજીતરામ સુવર્ણચંદ્રક).";
    } else if (subject === "ભારતનું બંધારણ (Indian Constitution)") {
      subjectGuidelines = "Provide accurate articles (અનુચ્છેદ), parts (ભાગ), schedules (પરિશિષ્ટ), and amendments (સુધારાઓ), explaining legal concepts in precise Gujarati political vocabulary.";
    } else if (subject === "ભૂગોળ (Geography of India & Gujarat)") {
      subjectGuidelines = "Include river systems, soil types, minerals, forests, mountains, boundaries, climate zones, and agricultural zones with exact statistics and geographic locations.";
    } else if (subject === "વિજ્ઞાન અને ટેકનોલોજી (Science & Technology)") {
      subjectGuidelines = "Focus on space, defense, biotech, chemistry, and general sciences with clear explanations of terms in both English transliteration and standard Gujarati translation.";
    } else if (subject === "એક્સ-રે ટેકનિશિયન (X-Ray Technician)") {
      subjectGuidelines = "Focus heavily on radiographic techniques, X-ray physics (X-ray tube, cathode, anode, kVp, mAs, grid), radiation safety and protection (ALARA principle, lead aprons, TLD badges), patient positioning, darkroom & digital imaging (CR, DR), contrast media, and radiographic anatomy. Provide technical medical terms in both Gujarati and clear English transliteration in brackets where helpful for professional comprehension.";
    }

    const systemPrompt = `You are an expert Gujarati educational author and subject matter scholar specializing in creating supreme study materials for competitive exams like GPSC Class 1/2, DySO, PSI, and Class 3 exams in Gujarat.
Your target audience is Gujarati aspirants seeking highly accurate, authoritative, and brilliantly structured book chapters.

Create a chapter matching the following configuration:
- Subject: ${subject}
- Title: ${title}
- Target Exam Level: ${examLevel}
- Writing Tone/Style: ${tone}
- Chapter Length: ${lengthDesc}
${additionalInstructions ? `- Special focus area/instructions: ${additionalInstructions}` : ""}

${subjectGuidelines}

CRITICAL FORMATTING RULES:
1. Write ENTIRELY in formal, elegant Gujarati language.
2. Use beautiful, highly spaced Markdown formatting: clear headings (h1, h2, h3), tables, bullet points, blockquotes for key definitions, and bold text for important factual data. Design the content to be point-wise (મુદ્દાસર) with outstanding structural design, making it extremely easy to read, study, and remember.
3. Keep the factual data 100% accurate. In historical topics, verify years and king names. In Polity, verify Articles.
4. Do NOT use horizontal divider/separator lines (like --- or ***) anywhere in the document.
5. Do NOT use automatic numbering (like 1., 2., 3., a., b.) for headings or subheadings. Use clean, unnumbered bold titles or bullets instead.
6. Wherever you feel an image, diagram, chart, or visual illustration is required to explain a concept, insert a highly descriptive image placeholder inside square brackets (e.g., '[ચિત્ર: પૃથ્વીના આંતરિક સ્તરોની આકૃતિ]' or '[ચિત્ર: રિંગ ઓફ ફાયર નકશો]'). Every single image description must be written entirely in beautiful Gujarati.
7. Structure the chapter exactly with these logical sections:
   # [Subject] - [Chapter Title]
   - **પરિચય / પૃષ્ઠભૂમિ (Introduction)**: Provide a deep, comprehensive and broad high-level contextual foundation.
   - **ಮುಖ್ಯ પ્રવાહ અને વિગતવાર મુદ્દાઓ (Core Explanations)**: Write an extremely exhaustive, detailed analysis of all related concepts, sub-topics, underlying dynamics, and sub-headings with rich details and deep conceptual descriptions. Do NOT condense or summarize anything. Format this section in an elegant point-wise, structured manner (મુદ્દાસર અને પોઇન્ટ-વાઇઝ સુંદર ડિઝાઇન).
   - **પરીક્ષાલક્ષી અગત્યના તથ્યો (High-Yield Quick Facts)**: A comprehensive table or pointwise list of 'One-Liners' that are directly asked in exams.
   - **વિશ્લેષણાત્મક દ્રષ્ટિકોણ (Analytical Perspective)**: A rich, deep section explaining 'Mains-oriented' conceptual analysis and viewpoints.
   - **હેતુલક્ષી પ્રશ્નોત્તરી (Mock MCQs for Practice)**: Provide exactly 15 realistic, high-quality MCQs with options (A, B, C, D) in Gujarati. Do NOT include any explanations (સમજૂતી). List all correct answers (જવાબો) consolidated at the very end of this MCQ section in a beautiful, neat, highly spaced standard table or a pointwise list. Absolutely no space limitations or compact limitations exist—ensure gorgeous, professional, readable layouts with plenty of negative space.

Begin generating immediately in supreme Gujarati text. Do not include any introductory conversational english text. Start directly with the Markdown H1 header. Ensure all sections are written with maximum possible detail and full conceptual richness. Do NOT condense, truncate, or summarize any parts.`;


    const config: any = {
      systemInstruction: systemPrompt,
      temperature: 0.7,
      maxOutputTokens: 8192,
    };

    let modelToUse = "gemini-3.5-flash";
    if (enableThinking) {
      modelToUse = "gemini-3.1-pro-preview";
      config.thinkingConfig = { thinkingLevel: "HIGH" };
    }

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    let response;
    try {
      // Tier 1: Try the selected model
      response = await ai.models.generateContent({
        model: modelToUse,
        contents: "કૃપા કરીને આયોજન મુજબ પ્રકરણ લખવાનું શરૂ કરો.",
        config: config,
      });
    } catch (err1: any) {
      if (isQuotaError(err1)) {
        console.warn(`Tier 1 Quota exceeded for model: ${modelToUse}.`);
        
        // Prepare a highly optimized, lightweight fallback config
        const fallbackConfig = { ...config };
        if (fallbackConfig.thinkingConfig) {
          delete fallbackConfig.thinkingConfig;
        }
        if (fallbackConfig.tools) {
          delete fallbackConfig.tools; // Strip Google Search to conserve quota/resources
        }

        // Tier 2: If we failed on gemini-3.1-pro-preview, try standard gemini-3.5-flash
        if (modelToUse === "gemini-3.1-pro-preview") {
          console.warn("Attempting Tier 2 Fallback to gemini-3.5-flash...");
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: "કૃપા કરીને આયોજન મુજબ પ્રકરણ લખવાનું શરૂ કરો. (નોંધ: ઊંડી વૈચારિક ક્ષમતા મર્યાદાના કારણે આ પ્રકરણ સ્ટાન્ડર્ડ મોડેલ દ્વારા જનરેટ કરવામાં આવ્યું છે)",
              config: fallbackConfig,
            });
          } catch (err2: any) {
            if (isQuotaError(err2)) {
              console.warn("Tier 2 Quota exceeded for gemini-3.5-flash. Attempting Tier 3 Fallback to gemini-3.1-flash-lite...");
              try {
                response = await ai.models.generateContent({
                  model: "gemini-3.1-flash-lite",
                  contents: "કૃપા કરીને આયોજન મુજબ પ્રકરણ લખવાનું શરૂ કરો. (નોંધ: ક્વોટા અને રિસોર્સ મર્યાદાના કારણે આ પ્રકરણ લાઇટ મોડેલ દ્વારા જનરેટ કરવામાં આવ્યું છે)",
                  config: fallbackConfig,
                });
              } catch (err3: any) {
                throw new Error(getFriendlyQuotaError(err3));
              }
            } else {
              throw err2;
            }
          }
        } else {
          // Tier 3: If we failed on gemini-3.5-flash, try falling back to the lightest gemini-3.1-flash-lite
          console.warn("Attempting Tier 3 Fallback to gemini-3.1-flash-lite...");
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: "કૃપા કરીને આયોજન મુજબ પ્રકરણ લખવાનું શરૂ કરો. (નોંધ: ક્વોટા અને રિસોર્સ મર્યાદાના કારણે આ પ્રકરણ લાઇટ મોડેલ દ્વારા જનરેટ કરવામાં આવ્યું છે)",
              config: fallbackConfig,
            });
          } catch (err3: any) {
            throw new Error(getFriendlyQuotaError(err3));
          }
        }
      } else {
        throw err1;
      }
    }

    const chapterText = response.text || "ભૂલ: કોઈ પ્રકરણ જનરેટ થયું નથી.";

    // Extract search grounding metadata if any
    let searchSources: any[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      searchSources = chunks
        .map((chunk: any) => {
          if (chunk.web) {
            return {
              title: chunk.web.title,
              uri: chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    res.json({
      chapter: chapterText,
      sources: searchSources,
    });
  } catch (error: any) {
    console.error("Error generating chapter:", error);
    res.status(500).json({ error: error.message || "આંતરિક સર્વર ભૂલ" });
  }
});

// Refine / Edit chapter
app.post("/api/chapters/refine", async (req, res) => {
  try {
    const { chapterContent, selectedText, instruction } = req.body;

    if (!chapterContent || !instruction) {
      res.status(400).json({ error: "Chapter content and instruction are required." });
      return;
    }

    const ai = getGeminiClient();

    const systemPrompt = `You are an expert Gujarati educational book editor.
Your task is to modify the provided chapter content according to the user's specific instruction.
The instruction is written in Gujarati or English: "${instruction}".

If specific text was selected: "${selectedText || "None"}", focus your edits, expansion, or simplification primarily on that section, while keeping the rest of the chapter context cohesive and integrated.
If no specific text was selected, apply the instruction to the entire chapter logically.

GUIDELINES:
1. Maintain the formal, high-quality academic Gujarati tone.
2. Return the COMPLETE revised chapter in Markdown, containing all sections, incorporating the requested changes seamlessly.
3. Keep all standard headings, quick facts, and MCQs intact unless explicitly asked to modify or add to them.
4. Ensure Markdown is pristine. Avoid any conversational English explanations; return only the modified Gujarati textbook chapter directly.`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { text: `અહીં હાલનું પ્રકરણ કન્ટેન્ટ છે:\n\n${chapterContent}` },
          { text: `સૂચના: ${instruction}` }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.6,
        },
      });
    } catch (err: any) {
      if (isQuotaError(err)) {
        console.warn("Quota exceeded for refine under gemini-3.5-flash. Falling back to gemini-3.1-flash-lite...");
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
              { text: `અહીં હાલનું પ્રકરણ કન્ટેન્ટ છે:\n\n${chapterContent}` },
              { text: `સૂચના: ${instruction}` }
            ],
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.6,
            },
          });
        } catch (err2: any) {
          throw new Error(getFriendlyQuotaError(err2));
        }
      } else {
        throw err;
      }
    }

    const revisedText = response.text || chapterContent;
    res.json({ chapter: revisedText });
  } catch (error: any) {
    console.error("Error refining chapter:", error);
    res.status(500).json({ error: error.message || "આંતરિક સર્વર ભૂલ" });
  }
});

// Gemini Intelligence Assistant Tasks
app.post("/api/assistant/task", async (req, res) => {
  try {
    const { taskType, content, instruction } = req.body;

    if (!content || !instruction) {
      res.status(400).json({ error: "Content and instruction are required." });
      return;
    }

    const ai = getGeminiClient();

    let modelToUse = "gemini-3.5-flash";
    let systemInstruction = "";

    if (taskType === "analyze") {
      modelToUse = "gemini-3.1-pro-preview";
      systemInstruction = `You are an expert Gujarati educational content reviewer.
Analyze the following educational content according to the user's instructions.
Provide a clear, highly structured analysis, detailing strengths, weaknesses, factuality check, and constructive improvements. Write entirely in beautiful, professional Gujarati.`;
    } else if (taskType === "grammar") {
      modelToUse = "gemini-3.1-flash-lite";
      systemInstruction = `You are an expert Gujarati linguist and editor.
Fix any spelling, grammar, syntax, or phrasing errors in the provided Gujarati text.
Keep the core content exactly the same, but polish the language. Return the complete corrected text. Do not add conversational explanations.`;
    } else {
      modelToUse = "gemini-3.5-flash";
      systemInstruction = `You are an expert AI assistant.
Help the user with their request regarding the provided Gujarati educational content.
Respond in a helpful, clear, and highly structured manner in elegant Gujarati.`;
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          { text: `કન્ટેન્ટ:\n\n${content}` },
          { text: `સૂચના / પ્રશ્ન: ${instruction}` }
        ],
        config: {
          systemInstruction,
          temperature: 0.6
        }
      });
    } catch (err1: any) {
      if (isQuotaError(err1)) {
        console.warn(`Quota exceeded for model ${modelToUse} in assistant.`);
        
        if (modelToUse !== "gemini-3.5-flash") {
          console.warn("Attempting fallback to gemini-3.5-flash...");
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: [
                { text: `કન્ટેન્ટ:\n\n${content}` },
                { text: `સૂચના / પ્રશ્ન: ${instruction}` }
              ],
              config: {
                systemInstruction,
                temperature: 0.6
              }
            });
          } catch (err2: any) {
            if (isQuotaError(err2)) {
              console.warn("Fallback to gemini-3.5-flash also failed. Trying gemini-3.1-flash-lite...");
              try {
                response = await ai.models.generateContent({
                  model: "gemini-3.1-flash-lite",
                  contents: [
                    { text: `કન્ટેન્ટ:\n\n${content}` },
                    { text: `સૂચના / પ્રશ્ન: ${instruction}` }
                  ],
                  config: {
                    systemInstruction,
                    temperature: 0.6
                  }
                });
              } catch (err3: any) {
                throw new Error(getFriendlyQuotaError(err3));
              }
            } else {
              throw err2;
            }
          }
        } else {
          console.warn("Attempting fallback from gemini-3.5-flash to gemini-3.1-flash-lite...");
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: [
                { text: `કન્ટેન્ટ:\n\n${content}` },
                { text: `સૂચના / પ્રશ્ન: ${instruction}` }
              ],
              config: {
                systemInstruction,
                temperature: 0.6
              }
            });
          } catch (err3: any) {
            throw new Error(getFriendlyQuotaError(err3));
          }
        }
      } else {
        throw err1;
      }
    }

    res.json({ result: response.text || "ભૂલ: કોઈ પરિણામ મળ્યું નથી." });
  } catch (error: any) {
    console.error("Error running assistant task:", error);
    res.status(500).json({ error: error.message || "આંતરિક સર્વર ભૂલ" });
  }
});

// Start server and handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
