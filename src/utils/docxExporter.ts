import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Header,
  Footer,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  UnderlineType,
  PageNumber,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";

interface DocxExportOptions {
  title: string;
  content: string;
  headerText: string;
  footerText: string;
  watermarkType: "none" | "text" | "picture";
  watermarkText: string;
  watermarkFont: string;
  watermarkSize: string | number;
  watermarkColor: string;
  watermarkSemitransparent: boolean;
  watermarkLayout: "diagonal" | "horizontal";
  fontFamily: string;
  baseFontSize: number;
  themeColor: string; // Hex color string, e.g. "0F766E" for Teal
  watermarkImage?: string | null; // Base64 or Data URL of the custom logo
}

export async function exportToDocx(options: DocxExportOptions) {
  let {
    title,
    content,
    headerText,
    footerText,
    watermarkType = "none",
    watermarkText = "",
    watermarkFont = "Calibri",
    watermarkSize = "Auto",
    watermarkColor = "CBD5E1",
    watermarkSemitransparent = true,
    watermarkLayout = "diagonal",
    fontFamily = "Calibri",
    baseFontSize = 11,
    themeColor = "0F766E", // Default teal
    watermarkImage = null,
  } = options;

  if (fontFamily === "Hind Vadodara SemiBold") {
    fontFamily = "Hind Vadodara";
  }

  // Split lines
  const lines = content.split(/\r?\n/);
  const docElements: any[] = [];

  // Title section
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
      children: [
        new TextRun({
          text: title || "પ્રકરણ સામગ્રી",
          bold: true,
          font: fontFamily,
          size: (baseFontSize + 10) * 2, // docx uses half-points
          color: themeColor,
        }),
      ],
    })
  );

  // Parse Markdown lines into docx paragraphs
  let inList = false;
  let inTable = false;
  let tableRowsData: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inTable && tableRowsData.length > 0) {
        // Render the table
        const docxTable = createDocxTable(tableRowsData, fontFamily, baseFontSize, themeColor);
        docElements.push(docxTable);
        docElements.push(new Paragraph({ spacing: { after: 120 } }));
        inTable = false;
        tableRowsData = [];
      }
      continue;
    }

    // Skip any separator, divider, or decorative lines entirely (e.g., ---, ***, #####, *****)
    if (/^[-*_#\s]{3,}$/.test(line)) {
      continue;
    }

    // Check Table
    if (line.startsWith("|")) {
      inTable = true;
      // Skip separator lines e.g. |---|---|
      if (line.includes("---") || line.includes("-|-")) {
        continue;
      }
      const cols = line
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      tableRowsData.push(cols);
      continue;
    } else {
      if (inTable && tableRowsData.length > 0) {
        const docxTable = createDocxTable(tableRowsData, fontFamily, baseFontSize, themeColor);
        docElements.push(docxTable);
        docElements.push(new Paragraph({ spacing: { after: 120 } }));
        inTable = false;
        tableRowsData = [];
      }
    }

    // Check Headers (supporting levels 1-6)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const hashes = headingMatch[1];
      const text = headingMatch[2].trim();
      const level = hashes.length; // 1 to 6
      
      // Clean up any trailing hashes or formatting within the heading text
      let cleanText = text.replace(/#+$/, "").trim();
      // Also clean up bold indicators around heading text if any e.g. **Heading**
      cleanText = cleanText.replace(/^\*\*|\*\*$/g, "").trim();

      // Map HeadingLevel based on level
      let headingLevel: any = HeadingLevel.HEADING_1;
      let size = (baseFontSize + 6) * 2;
      let color = themeColor;
      let spacingBefore = 300;
      let spacingAfter = 120;

      if (level === 2) {
        headingLevel = HeadingLevel.HEADING_2;
        size = (baseFontSize + 3) * 2;
        color = "334155";
        spacingBefore = 240;
        spacingAfter = 100;
      } else if (level === 3) {
        headingLevel = HeadingLevel.HEADING_3;
        size = (baseFontSize + 1) * 2;
        color = "475569";
        spacingBefore = 180;
        spacingAfter = 80;
      } else if (level >= 4) {
        headingLevel = HeadingLevel.HEADING_4;
        size = baseFontSize * 2;
        color = "475569";
        spacingBefore = 120;
        spacingAfter = 60;
      }

      docElements.push(
        new Paragraph({
          heading: headingLevel,
          spacing: { before: spacingBefore, after: spacingAfter },
          children: [
            new TextRun({
              text: cleanText,
              bold: true,
              font: fontFamily,
              size,
              color,
            }),
          ],
        })
      );
      continue;
    }
    // Blockquote
    else if (line.startsWith(">")) {
      const text = line.replace(/^>\s*/, "");
      docElements.push(
        new Paragraph({
          indent: { left: 720 }, // Indent in dxa (1 inch = 1440 dxa)
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text,
              italics: true,
              font: fontFamily,
              size: baseFontSize * 2,
              color: "115E59", // Teal-800
            }),
          ],
        })
      );
    }
    // Bullet list items
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.replace(/^[\-\*]\s+/, "");
      docElements.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
          children: [
            parseTextWithFormatting(text, fontFamily, baseFontSize),
          ].flat(),
        })
      );
    }
    // Numbered list items
    else if (/^\d+\.\s+/.test(line)) {
      const text = line.replace(/^\d+\.\s+/, "");
      docElements.push(
        new Paragraph({
          bullet: { level: 0 }, // Convert numbered lists to bullet lists as requested to remove numbering from formatting
          spacing: { before: 60, after: 60 },
          children: [
            ...parseTextWithFormatting(text, fontFamily, baseFontSize),
          ],
        })
      );
    }
    // Normal paragraph
    else {
      docElements.push(
        new Paragraph({
          spacing: { before: 120, after: 120 },
          children: parseTextWithFormatting(line, fontFamily, baseFontSize),
        })
      );
    }
  }

  // Handle trailing table if any
  if (inTable && tableRowsData.length > 0) {
    const docxTable = createDocxTable(tableRowsData, fontFamily, baseFontSize, themeColor);
    docElements.push(docxTable);
  }

  // Configure Watermark
  const headerChildren: any[] = [];
  if (headerText) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text: headerText,
            font: "Hind Vadodara",
            size: 10 * 2,
            bold: true,
            color: "000000",
            highlight: "yellow",
          }),
        ],
      })
    );
  }

  if (watermarkType === "text" && watermarkText) {
    const textToShow = watermarkLayout === "diagonal"
      ? `* * * ${watermarkText} * * * (DIAGONAL)`
      : `--- ${watermarkText} ---`;
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [
          new TextRun({
            text: textToShow,
            font: watermarkFont || fontFamily,
            size: (typeof watermarkSize === "number" ? watermarkSize : 11) * 2,
            bold: true,
            color: watermarkSemitransparent ? "E2E8F0" : watermarkColor,
          }),
        ],
      })
    );
  } else if (watermarkType === "picture") {
    if (watermarkImage) {
      try {
        let srcUrl = watermarkImage;
        if (!srcUrl.startsWith("data:")) {
          srcUrl = `data:image/png;base64,${srcUrl}`;
        }
        const fadedBase64 = await fadeImageToOpacity(srcUrl, 0.25);

        const base64Part = fadedBase64.includes("base64,")
          ? fadedBase64.split("base64,")[1]
          : fadedBase64;
        const binaryString = atob(base64Part);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        headerChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: bytes.buffer,
                transformation: {
                  width: 350,
                  height: 350,
                },
                floating: {
                  horizontalPosition: {
                    relative: "page",
                    align: "center",
                  },
                  verticalPosition: {
                    relative: "page",
                    align: "center",
                  },
                  behindText: true,
                },
              } as any),
            ],
          })
        );
      } catch (err) {
        console.error("Failed to parse and embed watermark image", err);
        headerChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80 },
            children: [
              new TextRun({
                text: `● [ KNOWLEDGE SANKUL - CUSTOM LOGO WATERMARK ] ●`,
                font: fontFamily,
                size: 10 * 2,
                bold: true,
                color: "E2E8F0",
              }),
            ],
          })
        );
      }
    } else {
      headerChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80 },
          children: [
            new TextRun({
              text: `● [ KNOWLEDGE SANKUL - OFFICIAL DIGITAL EMBLEM LOGO WATERMARK ] ●`,
              font: fontFamily,
              size: 10 * 2,
              bold: true,
              color: "E2E8F0",
            }),
          ],
        })
      );
    }
  }

  // Create Document with Section options (header, footer, watermark)
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips (approximately 210mm)
              height: 16838, // A4 height in twips (approximately 297mm)
            },
            margin: {
              top: 720, // 0.5 in = 720 twips (Narrow)
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        },
        headers: {
          default: new Header({
            children: headerChildren.length > 0 ? headerChildren : [
              new Paragraph({
                children: [new TextRun({ text: "", font: fontFamily })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: "auto" },
                  bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
                  left: { style: BorderStyle.NONE, size: 0, color: "auto" },
                  right: { style: BorderStyle.NONE, size: 0, color: "auto" },
                  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
                  insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                              new TextRun({
                                text: footerText ? footerText.replace(/\s*\|\s*પેજ નં\.?\s*/gi, "").trim() : `${title || "સામગ્રી"} - નોલેજ સંકુલ`,
                                font: "Hind Vadodara",
                                size: 9.5 * 2,
                                bold: true,
                                color: "000000",
                              }),
                            ],
                          }),
                        ],
                      }),
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: "પેજ નં. ",
                                font: "Hind Vadodara",
                                size: 9.5 * 2,
                                bold: true,
                                color: "000000",
                              }),
                              new TextRun({
                                children: [PageNumber.CURRENT],
                                font: "Hind Vadodara",
                                size: 9.5 * 2,
                                bold: true,
                                color: "000000",
                              }),
                              new TextRun({
                                text: " / ",
                                font: "Hind Vadodara",
                                size: 9.5 * 2,
                                bold: true,
                                color: "000000",
                              }),
                              new TextRun({
                                children: [PageNumber.TOTAL_PAGES],
                                font: "Hind Vadodara",
                                size: 9.5 * 2,
                                bold: true,
                                color: "000000",
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: docElements,
      },
    ],
  });

  // Pack document to base64 or blob and download
  const blob = await Packer.toBlob(doc);
  const cleanTitle = title.trim().replace(/\s+/g, "_") || "X-Ray_Technician_Material";
  saveAs(blob, `${cleanTitle}_નોલેજ_સંકુલ.docx`);
}

// Helper to parse text with rich scientific formatting (equations, formulas, bold, italics)
function parseTextWithFormatting(
  text: string,
  fontFamily: string,
  baseFontSize: number,
  color?: string,
  forceBold?: boolean
): TextRun[] {
  if (!text) return [];

  if (fontFamily === "Hind Vadodara SemiBold") {
    fontFamily = "Hind Vadodara";
    forceBold = true;
  }

  // 1. Preprocess: Convert Unicode subscripts/superscripts and HTML sub/sup tags to unified markup
  let processed = text;

  // Convert HTML tags
  processed = processed.replace(/<sup>(.*?)<\/sup>/gi, "^$1^");
  processed = processed.replace(/<sub>(.*?)<\/sub>/gi, "~$1~");

  // Convert LaTeX math delimiters to clean inline spans
  processed = processed.replace(/\$\$(.*?)\$\$/gs, " $1 ");
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, " $1 ");
  processed = processed.replace(/\$([^\$]+)\$/g, " $1 ");
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, " $1 ");

  // Convert LaTeX fractions: \frac{num}{den} to (num)/(den) and \frac12 to (1)/(2)
  processed = processed.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "($1)/($2)");
  processed = processed.replace(/\\frac\s*([0-9a-zA-Z])\s*([0-9a-zA-Z])/g, "($1)/($2)");

  // Convert roots: \sqrt{x} -> √(x)
  processed = processed.replace(/\\sqrt\s*\{([^}]*)\}/g, "√($1)");
  processed = processed.replace(/\\sqrt\s*([0-9a-zA-Z]+)/g, "√$1");

  // Remove common math styling wrappers: \text{...}, \mathrm{...}, \mathbf{...}, \mathit{...}
  processed = processed.replace(/\\text\s*\{([^}]*)\}/g, "$1");
  processed = processed.replace(/\\mathrm\s*\{([^}]*)\}/g, "$1");
  processed = processed.replace(/\\mathbf\s*\{([^}]*)\}/g, "$1");
  processed = processed.replace(/\\mathit\s*\{([^}]*)\}/g, "$1");

  // Convert combining accents: \bar{x} -> x̄, \vec{x} -> x⃗, \hat{x} -> x̂
  processed = processed.replace(/\\bar\s*\{([^}]*)\}/g, "$1\u0304");
  processed = processed.replace(/\\vec\s*\{([^}]*)\}/g, "$1\u20D7");
  processed = processed.replace(/\\hat\s*\{([^}]*)\}/g, "$1\u0302");

  // Remove common LaTeX math spacing
  processed = processed.replace(/\\([,;! ])/g, "$1");

  // Convert LaTeX Greek symbols and math operators to standard Unicode equivalents
  const greekSymbols: Record<string, string> = {
    "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε",
    "\\zeta": "ζ", "\\eta": "η", "\\theta": "θ", "\\iota": "ι", "\\kappa": "κ",
    "\\lambda": "λ", "\\mu": "μ", "\\nu": "ν", "\\xi": "ξ", "\\omicron": "ο",
    "\\pi": "π", "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\upsilon": "υ",
    "\\phi": "φ", "\\chi": "χ", "\\psi": "ψ", "\\omega": "ω",
    "\\Delta": "Δ", "\\Theta": "Θ", "\\Lambda": "Λ", "\\Xi": "Ξ", "\\Pi": "Π",
    "\\Sigma": "Σ", "\\Upsilon": "Υ", "\\Phi": "Φ", "\\Psi": "Ψ", "\\Omega": "Ω",
    "\\times": "×", "\\div": "÷", "\\pm": "±", "\\mp": "∓", "\\neq": "≠", "\\leq": "≤",
    "\\geq": "≥", "\\infty": "∞", "\\approx": "≈", "\\partial": "∂", "\\nabla": "∇",
    "\\cdot": "·", "\\deg": "°", "\\rightarrow": "→", "\\to": "→", "\\leftarrow": "←", "\\leftrightarrow": "↔",
    "\\Rightarrow": "⇒", "\\Leftarrow": "⇐", "\\Leftrightarrow": "⇔", "\\forall": "∀", "\\exists": "∃",
    "\\propto": "∝", "\\hbar": "ħ", "\\angle": "∠", "\\triangle": "△", "\\parallel": "∥", "\\perp": "⊥",
    "\\in": "∈", "\\notin": "∉", "\\ni": "∋", "\\subset": "⊂", "\\supset": "⊃", "\\subseteq": "⊆",
    "\\supseteq": "⊇", "\\cap": "∩", "\\cup": "∪"
  };
  Object.entries(greekSymbols).forEach(([latex, uni]) => {
    const escaped = latex.replace(/\\/g, "\\\\");
    processed = processed.replace(new RegExp(escaped, "g"), uni);
  });

  // Convert LaTeX superscripts/subscripts with braces: ^{abc} -> ^abc^, _{abc} -> ~abc~
  processed = processed.replace(/\^\{([^}]*)\}/g, "^$1^");
  processed = processed.replace(/_\{([^}]*)\}/g, "~$1~");

  // Convert simple single-character/digit superscript/subscript patterns (avoiding matching word boundaries)
  processed = processed.replace(/\^([0-9a-zA-Z+-=]+)/g, "^$1^");
  processed = processed.replace(/_([0-9a-zA-Z+-=]+)/g, "~$1~");

  // Convert Unicode superscripts
  const uniSupers: Record<string, string> = {
    "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
    "⁺": "+", "⁻": "-", "⁼": "=", "⁽": "(", "⁾": ")"
  };
  processed = processed.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾]/g, (m) => `^${uniSupers[m]}^`);

  // Convert Unicode subscripts
  const uniSubs: Record<string, string> = {
    "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
    "₊": "+", "₋": "-", "₌": "=", "₍": "(", "₎": ")"
  };
  processed = processed.replace(/[₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎]/g, (m) => `~${uniSubs[m]}~`);

  // Auto-detect chemical formulas: Any capital letter (or capital + lowercase) followed by a digit.
  // E.g., H2O -> H~2~O, CO2 -> CO~2~, CuSO4 -> CuSO~4~, C6H12O6 -> C~6~H~12~O~6~
  processed = processed.replace(/\b(H|He|Li|Be|B|C|N|O|F|Ne|Na|Mg|Al|Si|P|S|Cl|Ar|K|Ca|Sc|Ti|V|Cr|Mn|Fe|Co|Ni|Cu|Zn|Ga|Ge|As|Se|Br|Kr|Rb|Sr|Y|Zr|Nb|Mo|Tc|Ru|Rh|Pd|Ag|Cd|In|Sn|Sb|Te|I|Xe|Cs|Ba|La|Ce|Pr|Nd|Pm|Sm|Eu|Gd|Tb|Dy|Ho|Er|Tm|Yb|Lu|Hf|Ta|W|Re|Os|Ir|Pt|Au|Hg|Tl|Pb|Bi|Po|At|Rn|Fr|Ra|Ac|Th|Pa|U|Np|Pu|Am|Cm|Bk|Cf|Es|Fm|Md|No|Lr|Rf|Db|Sg|Bh|Hs|Mt|Ds|Rg|Cn|Nh|Fl|Mc|Lv|Ts|Og|X|Y|Z)([0-9]+)/g, "$1~$2~");

  // Normalize nested or duplicate subscript markers, e.g. ~~2~~ -> ~2~
  processed = processed.replace(/~~+/g, "~");
  processed = processed.replace(/\^\^+/g, "^");

  // Tokenizer state
  const runs: TextRun[] = [];
  let currentText = "";
  
  let isBold = false;
  let isItalic = false;
  let isSub = false;
  let isSuper = false;

  let i = 0;
  while (i < processed.length) {
    // Bold Check (double asterisk or double underscore)
    if (processed.substring(i, i + 2) === "**" || processed.substring(i, i + 2) === "__") {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, font: fontFamily, size: baseFontSize * 2, bold: forceBold || isBold, italics: isItalic, subScript: isSub, superScript: isSuper, color }));
        currentText = "";
      }
      isBold = !isBold;
      i += 2;
    }
    // Bold Italic Check (triple asterisk or triple underscore)
    else if (processed.substring(i, i + 3) === "***" || processed.substring(i, i + 3) === "___") {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, font: fontFamily, size: baseFontSize * 2, bold: forceBold || isBold, italics: isItalic, subScript: isSub, superScript: isSuper, color }));
        currentText = "";
      }
      isBold = !isBold;
      isItalic = !isItalic;
      i += 3;
    }
    // Italic Check (single asterisk only - do not use single underscore to avoid breaking LaTeX/scientific variables with subscripts)
    else if (processed[i] === "*") {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, font: fontFamily, size: baseFontSize * 2, bold: forceBold || isBold, italics: isItalic, subScript: isSub, superScript: isSuper, color }));
        currentText = "";
      }
      isItalic = !isItalic;
      i += 1;
    }
    // Subscript Check
    else if (processed[i] === "~") {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, font: fontFamily, size: baseFontSize * 2, bold: forceBold || isBold, italics: isItalic, subScript: isSub, superScript: isSuper, color }));
        currentText = "";
      }
      isSub = !isSub;
      i += 1;
    }
    // Superscript Check
    else if (processed[i] === "^") {
      if (currentText) {
        runs.push(new TextRun({ text: currentText, font: fontFamily, size: baseFontSize * 2, bold: forceBold || isBold, italics: isItalic, subScript: isSub, superScript: isSuper, color }));
        currentText = "";
      }
      isSuper = !isSuper;
      i += 1;
    }
    // Normal character
    else {
      currentText += processed[i];
      i += 1;
    }
  }

  if (currentText) {
    runs.push(new TextRun({ text: currentText, font: fontFamily, size: baseFontSize * 2, bold: forceBold || isBold, italics: isItalic, subScript: isSub, superScript: isSuper, color }));
  }

  return runs;
}

// Helper to construct formatted docx Table
function createDocxTable(
  rows: string[][],
  fontFamily: string,
  baseFontSize: number,
  themeColor: string
): Table {
  const tableRows: TableRow[] = [];

  for (let r = 0; r < rows.length; r++) {
    const isHeader = r === 0;
    const cells: TableCell[] = [];

    for (let c = 0; c < rows[r].length; c++) {
      const cellText = rows[r][c];
      
      // Parse markdown inside each cell (renders sub/sup/bold/italic and strips *)
      const cellRuns = parseTextWithFormatting(
        cellText,
        fontFamily,
        isHeader ? baseFontSize : baseFontSize - 1,
        isHeader ? "FFFFFF" : "1E293B",
        isHeader
      );

      cells.push(
        new TableCell({
          shading: isHeader
            ? { fill: themeColor, color: "auto" }
            : r % 2 === 0
            ? { fill: "F8FAFC", color: "auto" } // light grey row zebra striping
            : undefined,
          children: [
            new Paragraph({
              spacing: { before: 80, after: 80 },
              children: cellRuns,
            }),
          ],
        })
      );
    }
    tableRows.push(new TableRow({ children: cells }));
  }

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: tableRows,
  });
}

// Utility to fade any image to a specified opacity using HTML Canvas
function fadeImageToOpacity(base64OrUrl: string, opacity: number): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve(base64OrUrl);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = opacity;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } else {
          resolve(base64OrUrl);
        }
      } catch (err) {
        console.error("Error drawing image on canvas to fade opacity", err);
        resolve(base64OrUrl);
      }
    };
    img.onerror = () => {
      resolve(base64OrUrl);
    };
    img.src = base64OrUrl;
  });
}

