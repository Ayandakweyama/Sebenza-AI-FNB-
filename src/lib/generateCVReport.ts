import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import jsPDF from 'jspdf';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedCVResponse {
  enhancedCV: string;
  changesMade: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  gapAnalysis: string[];
  additionalTips: string[];
}

// ─── Response Parser ─────────────────────────────────────────────────────────

export function parseCVResponse(raw: string): ParsedCVResponse {
  const result: ParsedCVResponse = {
    enhancedCV: '',
    changesMade: [],
    matchedKeywords: [],
    missingKeywords: [],
    gapAnalysis: [],
    additionalTips: [],
  };

  // Split by H2 headers (## )
  const sectionRegex = /^##\s+.+$/gm;
  const headers: { title: string; index: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = sectionRegex.exec(raw)) !== null) {
    headers.push({ title: match[0], index: match.index });
  }

  for (let i = 0; i < headers.length; i++) {
    const start = headers[i].index + headers[i].title.length;
    const end = i + 1 < headers.length ? headers[i + 1].index : raw.length;
    const body = raw.slice(start, end).trim();
    const title = headers[i].title.toLowerCase();

    if (title.includes('enhanced cv')) {
      result.enhancedCV = body;
    } else if (title.includes('what was changed')) {
      result.changesMade = extractBullets(body);
    } else if (title.includes('ats keyword') || title.includes('keyword')) {
      // This section has two sub-lists: matched and missing
      const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
      let currentBucket: 'matched' | 'missing' = 'matched';
      for (const line of lines) {
        const lower = line.toLowerCase();

        // Detect sub-header lines (### or bold labels) to switch bucket
        const isHeader = line.startsWith('#') || (line.startsWith('**') && line.endsWith('**'));
        if (isHeader) {
          // Missing bucket triggers (check BEFORE matched to avoid "not matched" false positive)
          if (lower.includes('missing') || lower.includes('not found') || lower.includes('not in') || lower.includes('absent') || lower.includes('not present') || lower.includes('not match')) {
            currentBucket = 'missing';
          } else if (lower.includes('found') || lower.includes('present') || lower.includes('highlighted') || lower.includes('matched') || lower.includes('in cv')) {
            currentBucket = 'matched';
          }
          continue; // Don't parse the header line itself as a keyword
        }

        // For non-header lines, also check for inline label switches
        if (!line.startsWith('-') && !line.startsWith('*') && !line.startsWith('•')) {
          if (lower.includes('missing') || lower.includes('not found') || lower.includes('not in') || lower.includes('not present')) {
            currentBucket = 'missing';
          } else if (lower.includes('found in') || lower.includes('present in') || lower.includes('highlighted')) {
            currentBucket = 'matched';
          }
          continue;
        }

        // Parse bullet items
        const clean = line.replace(/^[-*•]\s*/, '').trim();
        if (clean) {
          const stripped = stripMarkdown(clean);
          const kwList = extractKeywordsFromLine(stripped);
          kwList.forEach(kw => {
            if (currentBucket === 'matched') {
              result.matchedKeywords.push(kw);
            } else {
              result.missingKeywords.push(kw);
            }
          });
        }
      }
      // Fallback if nothing was parsed
      if (result.missingKeywords.length === 0 && result.matchedKeywords.length === 0) {
        result.matchedKeywords = extractBullets(body);
      }
    } else if (title.includes('gap analysis')) {
      result.gapAnalysis = extractBullets(body);
    } else if (title.includes('additional tips') || title.includes('tips')) {
      result.additionalTips = extractBullets(body);
    }
  }

  // Fallback: if no enhanced CV section found, use everything before first non-CV header
  if (!result.enhancedCV && headers.length > 0) {
    result.enhancedCV = raw.slice(0, headers[0].index).trim();
  }

  return result;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^#+\s+/, '')
    .trim();
}

function extractKeywordsFromLine(line: string): string[] {
  // If the line contains a colon, treat text after the colon as comma-separated keywords
  const colonIdx = line.indexOf(':');
  const kwPart = colonIdx >= 0 ? line.slice(colonIdx + 1).trim() : line;
  // If there are commas, split into individual keywords
  if (kwPart.includes(',')) {
    return kwPart
      .split(',')
      .map(k => k.replace(/\.$/, '').trim())
      .filter(k => k.length > 0 && k.length < 80);
  }
  // Otherwise return the whole cleaned line as a single keyword (if short enough)
  const cleaned = kwPart.replace(/\.$/, '').trim();
  return cleaned.length > 0 && cleaned.length < 80 ? [cleaned] : [];
}

function extractBullets(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('-') || l.startsWith('*') || l.startsWith('•') || /^\d+\./.test(l))
    .map(l => stripMarkdown(l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim()))
    .filter(Boolean);
}

// ─── Word Export (Enhanced CV only) ──────────────────────────────────────────

export async function downloadCVAsWord(
  cvMarkdown: string,
  jobTitle?: string,
  companyName?: string
): Promise<void> {
  const children: Paragraph[] = [];

  const lines = cvMarkdown.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      continue;
    }

    // H3 header
    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h3) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: h3[1].replace(/\*\*/g, ''), bold: true, size: 22, color: '1e293b' })],
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      );
      continue;
    }

    // H2 header
    const h2 = trimmed.match(/^##\s+(.+)$/);
    if (h2) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: h2[1].replace(/\*\*/g, ''), bold: true, size: 26, color: '0e7490' })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '0e7490', space: 4 } },
        })
      );
      continue;
    }

    // H1 header
    const h1 = trimmed.match(/^#\s+(.+)$/);
    if (h1) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: h1[1].replace(/\*\*/g, ''), bold: true, size: 32, color: '0e7490' })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 200 },
        })
      );
      continue;
    }

    // Bullet
    const bullet = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      children.push(
        new Paragraph({
          children: buildInlineRuns(bullet[1]),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Numbered list
    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      children.push(
        new Paragraph({
          children: buildInlineRuns(numbered[1]),
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Regular paragraph
    children.push(
      new Paragraph({
        children: buildInlineRuns(trimmed),
        spacing: { after: 80 },
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (jobTitle || 'Enhanced_CV').replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `${safeName}_${new Date().toISOString().split('T')[0]}.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

function buildInlineRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) {
      runs.push(new TextRun({ text: text.slice(last, m.index), size: 20 }));
    }
    if (m[2]) {
      runs.push(new TextRun({ text: m[2], bold: true, size: 20 }));
    } else if (m[4]) {
      runs.push(new TextRun({ text: m[4], italics: true, size: 20 }));
    } else if (m[6]) {
      runs.push(new TextRun({ text: m[6], font: 'Courier New', size: 18 }));
    }
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    runs.push(new TextRun({ text: text.slice(last), size: 20 }));
  }

  return runs.length > 0 ? runs : [new TextRun({ text, size: 20 })];
}

// ─── PDF Analysis Report ─────────────────────────────────────────────────────

export function downloadAnalysisAsPDF(
  parsed: ParsedCVResponse,
  jobTitle?: string,
  companyName?: string
): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ── Brand palette (pink-primary, matching UI) ──
  const colors = {
    primary: { r: 236, g: 72, b: 153 },      // Pink-500 #ec4899
    primaryDark: { r: 190, g: 24, b: 93 },    // Pink-700 #be185d
    primaryLight: { r: 251, g: 207, b: 232 }, // Pink-200 #fbcfe8
    primaryBg: { r: 253, g: 242, b: 248 },    // Pink-50  #fdf2f8
    dark: { r: 15, g: 23, b: 42 },            // Slate-900
    darkText: { r: 30, g: 41, b: 59 },        // Slate-800
    gray: { r: 100, g: 116, b: 139 },         // Slate-500
    grayLight: { r: 148, g: 163, b: 184 },    // Slate-400
    lightGray: { r: 241, g: 245, b: 249 },    // Slate-100
    white: { r: 255, g: 255, b: 255 },
    success: { r: 22, g: 163, b: 74 },        // Green-600
    successBg: { r: 220, g: 252, b: 231 },    // Green-100
    warning: { r: 234, g: 88, b: 12 },        // Orange-600
    warningBg: { r: 255, g: 237, b: 213 },    // Orange-100
    danger: { r: 220, g: 38, b: 38 },         // Red-600
    dangerBg: { r: 254, g: 226, b: 226 },     // Red-100
    purple: { r: 147, g: 51, b: 234 },        // Purple-600
    purpleBg: { r: 243, g: 232, b: 255 },     // Purple-100
    blue: { r: 37, g: 99, b: 235 },           // Blue-600
    blueBg: { r: 219, g: 234, b: 254 },       // Blue-100
  };

  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;
  let pageNum = 1;

  // ── Helpers ──
  const checkPageBreak = (needed: number = 20) => {
    if (y + needed > pageHeight - 22) {
      addFooter();
      pdf.addPage();
      pageNum++;
      y = 16;
      // Thin pink accent bar on continuation pages
      pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      pdf.rect(0, 0, pageWidth, 2.5, 'F');
      // Left sidebar accent
      pdf.setFillColor(colors.primaryBg.r, colors.primaryBg.g, colors.primaryBg.b);
      pdf.rect(0, 2.5, 4, pageHeight - 2.5, 'F');
    }
  };

  const wrapText = (text: string, maxWidth: number): string[] => pdf.splitTextToSize(text, maxWidth);

  const drawRoundedRect = (x: number, ry: number, w: number, h: number, r: number, fill: { r: number; g: number; b: number }) => {
    pdf.setFillColor(fill.r, fill.g, fill.b);
    pdf.roundedRect(x, ry, w, h, r, r, 'F');
  };

  const drawCardBorder = (x: number, ry: number, w: number, h: number, r: number, borderColor: { r: number; g: number; b: number }) => {
    pdf.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, ry, w, h, r, r, 'S');
  };

  const sectionHeader = (title: string, color: { r: number; g: number; b: number }, icon?: string) => {
    checkPageBreak(18);
    y += 4;
    // Accent bar left of title
    drawRoundedRect(margin, y - 5, 3, 8, 1.5, color);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color.r, color.g, color.b);
    if (icon) {
      pdf.text(icon, margin + 6, y);
      pdf.text(title, margin + 12, y);
    } else {
      pdf.text(title, margin + 7, y);
    }
    // Subtle full-width divider
    pdf.setDrawColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 10;
  };

  const addFooter = () => {
    const footerY = pageHeight - 12;
    // Divider line
    pdf.setDrawColor(colors.primaryLight.r, colors.primaryLight.g, colors.primaryLight.b);
    pdf.setLineWidth(0.4);
    pdf.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
    // Left: brand
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.text('Sebenza-AI', margin, footerY + 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
    pdf.text('  |  CV Enhancement Analysis', margin + 19, footerY + 2);
    // Right: page number
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    pdf.text(`Page ${pageNum}`, pageWidth - margin, footerY + 2, { align: 'right' });
    // Bottom accent bar
    pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.rect(0, pageHeight - 2.5, pageWidth, 2.5, 'F');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER HEADER
  // ════════════════════════════════════════════════════════════════════════════

  // Full-width header band with gradient simulation
  pdf.setFillColor(colors.dark.r, colors.dark.g, colors.dark.b);
  pdf.rect(0, 0, pageWidth, 52, 'F');
  // Pink accent overlay on right half
  pdf.setFillColor(colors.primaryDark.r, colors.primaryDark.g, colors.primaryDark.b);
  pdf.rect(pageWidth * 0.55, 0, pageWidth * 0.45, 52, 'F');
  // Decorative circle
  pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  pdf.circle(pageWidth - 30, 26, 40, 'F');
  pdf.setGState(new (pdf as any).GState({ opacity: 0.15 }));
  pdf.setFillColor(255, 255, 255);
  pdf.circle(pageWidth - 15, 10, 25, 'F');
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // Brand name
  y = 20;
  pdf.setFontSize(26);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Sebenza-AI', margin + 2, y);

  // Tagline
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
  pdf.text('Your Career Success Partner', margin + 2, y + 6);

  // Report title (right side)
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('CV ANALYSIS', pageWidth - margin - 2, y - 4, { align: 'right' });
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.primaryLight.r, colors.primaryLight.g, colors.primaryLight.b);
  pdf.text('ENHANCEMENT REPORT', pageWidth - margin - 2, y + 2, { align: 'right' });

  // Date
  pdf.setFontSize(8);
  pdf.setTextColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
  pdf.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    pageWidth - margin - 2, y + 8, { align: 'right' }
  );

  y = 62;

  // Left sidebar accent for page 1
  pdf.setFillColor(colors.primaryBg.r, colors.primaryBg.g, colors.primaryBg.b);
  pdf.rect(0, 52, 4, pageHeight - 52, 'F');

  // ── Job details card ──
  if (jobTitle || companyName) {
    checkPageBreak(28);
    drawRoundedRect(margin, y - 2, contentWidth, 20, 3, colors.primaryBg);
    drawCardBorder(margin, y - 2, contentWidth, 20, 3, colors.primaryLight);
    // Pink left accent inside card
    drawRoundedRect(margin + 1, y, 2.5, 16, 1, colors.primary);
    pdf.setFontSize(10);
    let infoY = y + 5;
    if (jobTitle) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      pdf.text('TARGET ROLE', margin + 8, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      pdf.text(jobTitle, margin + 38, infoY);
    }
    if (companyName) {
      infoY += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      pdf.text('COMPANY', margin + 8, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      pdf.text(companyName, margin + 38, infoY);
    }
    y += 26;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // KEYWORD MATCH SCORE — Hero section
  // ════════════════════════════════════════════════════════════════════════════
  const matchedCount = parsed.matchedKeywords.length;
  const missingCount = parsed.missingKeywords.length;
  const totalKw = matchedCount + missingCount;
  const kwScore = totalKw > 0 ? Math.round((matchedCount / totalKw) * 100) : 0;
  const scoreColor = kwScore >= 70 ? colors.success : kwScore >= 40 ? colors.warning : colors.danger;
  const scoreBgColor = kwScore >= 70 ? colors.successBg : kwScore >= 40 ? colors.warningBg : colors.dangerBg;

  checkPageBreak(68);
  // Outer card
  drawRoundedRect(margin, y - 2, contentWidth, 62, 4, colors.lightGray);
  drawCardBorder(margin, y - 2, contentWidth, 62, 4, { r: 226, g: 232, b: 240 });

  // ── Donut chart (center) ──
  const cx = pageWidth / 2;
  const cy = y + 24;
  const outerR = 18;
  const innerR = 13;

  // Background ring
  pdf.setFillColor(230, 230, 230);
  pdf.circle(cx, cy, outerR, 'F');
  pdf.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
  pdf.circle(cx, cy, innerR, 'F');

  // Colored arc — draw as filled segments
  if (kwScore > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (kwScore / 100) * Math.PI * 2;
    const steps = Math.max(36, Math.round(kwScore * 1.5));
    for (let i = 0; i < steps; i++) {
      const a1 = startAngle + (i / steps) * (endAngle - startAngle);
      const a2 = startAngle + ((i + 1) / steps) * (endAngle - startAngle);
      const points = [
        cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
        cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR,
        cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR,
        cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR,
      ];
      pdf.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
      pdf.triangle(points[0], points[1], points[2], points[3], points[4], points[5], 'F');
      pdf.triangle(points[0], points[1], points[4], points[5], points[6], points[7], 'F');
    }
    // Clean inner circle
    pdf.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    pdf.circle(cx, cy, innerR, 'F');
  }

  // Score text inside donut
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  pdf.text(`${kwScore}%`, cx, cy + 2, { align: 'center' });
  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text('MATCH RATE', cx, cy + 7, { align: 'center' });

  // ── Left stat card — Matched ──
  const leftCardX = margin + 6;
  const leftCardW = (contentWidth / 2) - 30;
  drawRoundedRect(leftCardX, cy - 14, leftCardW, 28, 3, colors.successBg);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
  pdf.text(`${matchedCount}`, leftCardX + leftCardW / 2, cy + 1, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
  pdf.text('MATCHED', leftCardX + leftCardW / 2, cy + 8, { align: 'center' });

  // ── Right stat card — Missing ──
  const rightCardX = pageWidth - margin - 6 - leftCardW;
  drawRoundedRect(rightCardX, cy - 14, leftCardW, 28, 3, colors.dangerBg);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
  pdf.text(`${missingCount}`, rightCardX + leftCardW / 2, cy + 1, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
  pdf.text('MISSING', rightCardX + leftCardW / 2, cy + 8, { align: 'center' });

  // Bottom label
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text(`${totalKw} total keywords analysed`, cx, cy + 20, { align: 'center' });

  y += 68;

  // ════════════════════════════════════════════════════════════════════════════
  // KEYWORD COVERAGE BAR
  // ════════════════════════════════════════════════════════════════════════════
  if (totalKw > 0) {
    checkPageBreak(28);
    sectionHeader('Keyword Coverage Breakdown', colors.primary);

    const barH = 8;
    const barW = contentWidth;
    const matchedW = Math.max((matchedCount / totalKw) * barW, 1);
    const missingW = barW - matchedW;

    // Background track
    drawRoundedRect(margin, y - 2, barW, barH, 4, { r: 230, g: 230, b: 230 });
    // Matched portion
    if (matchedW > 4) {
      drawRoundedRect(margin, y - 2, matchedW, barH, 4, colors.success);
    }

    // Labels below bar
    y += barH + 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
    pdf.text(`- ${matchedCount} matched (${kwScore}%)`, margin, y);
    pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
    const missingPct = totalKw > 0 ? 100 - kwScore : 0;
    pdf.text(`- ${missingCount} missing (${missingPct}%)`, margin + 55, y);
    y += 8;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MATCHED KEYWORDS
  // ════════════════════════════════════════════════════════════════════════════
  if (parsed.matchedKeywords.length > 0) {
    checkPageBreak(22);
    sectionHeader(`Matched Keywords (${parsed.matchedKeywords.length})`, colors.success);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    let xPos = margin;
    parsed.matchedKeywords.forEach((kw) => {
      const tw = pdf.getTextWidth(kw) + 8;
      if (xPos + tw > pageWidth - margin) {
        xPos = margin;
        y += 9;
        checkPageBreak(9);
      }
      drawRoundedRect(xPos, y - 4.5, tw, 7, 3.5, colors.successBg);
      // Tiny dot
      pdf.setFillColor(colors.success.r, colors.success.g, colors.success.b);
      pdf.circle(xPos + 3.5, y - 1, 1, 'F');
      pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
      pdf.text(kw, xPos + 6, y);
      xPos += tw + 3;
    });
    y += 12;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MISSING KEYWORDS
  // ════════════════════════════════════════════════════════════════════════════
  if (parsed.missingKeywords.length > 0) {
    checkPageBreak(22);
    sectionHeader(`Missing Keywords (${parsed.missingKeywords.length})`, colors.danger);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    let xPos = margin;
    parsed.missingKeywords.forEach((kw) => {
      const tw = pdf.getTextWidth(kw) + 8;
      if (xPos + tw > pageWidth - margin) {
        xPos = margin;
        y += 9;
        checkPageBreak(9);
      }
      drawRoundedRect(xPos, y - 4.5, tw, 7, 3.5, colors.dangerBg);
      // Tiny X dot
      pdf.setFillColor(colors.danger.r, colors.danger.g, colors.danger.b);
      pdf.circle(xPos + 3.5, y - 1, 1, 'F');
      pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
      pdf.text(kw, xPos + 6, y);
      xPos += tw + 3;
    });
    y += 12;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // CHANGES MADE
  // ════════════════════════════════════════════════════════════════════════════
  if (parsed.changesMade.length > 0) {
    checkPageBreak(22);
    sectionHeader('Changes Applied to Your CV', colors.primary);

    parsed.changesMade.forEach((item, idx) => {
      checkPageBreak(16);
      // Card row background (alternating)
      const rowBg = idx % 2 === 0 ? colors.primaryBg : colors.white;
      const rowH = Math.max(wrapText(item, contentWidth - 18).length * 5 + 4, 10);
      drawRoundedRect(margin, y - 5, contentWidth, rowH, 2, rowBg);

      // Number badge
      pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      pdf.circle(margin + 5, y - 1, 3.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${idx + 1}`, margin + 5, y + 0.5, { align: 'center' });

      // Text
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      const lines = wrapText(item, contentWidth - 18);
      lines.forEach((line, li) => {
        checkPageBreak(5);
        pdf.text(line, margin + 12, y + li * 5);
      });
      y += lines.length * 5 + 4;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // GAP ANALYSIS
  // ════════════════════════════════════════════════════════════════════════════
  if (parsed.gapAnalysis.length > 0) {
    checkPageBreak(22);
    sectionHeader('Gap Analysis', colors.warning);

    parsed.gapAnalysis.forEach((item, idx) => {
      checkPageBreak(16);
      const lines = wrapText(item, contentWidth - 16);
      const rowH = lines.length * 5 + 4;
      // Card with left warning accent
      drawRoundedRect(margin, y - 5, contentWidth, rowH, 2, colors.warningBg);
      drawRoundedRect(margin, y - 5, 3, rowH, 1, colors.warning);

      // Warning triangle indicator
      pdf.setFillColor(colors.warning.r, colors.warning.g, colors.warning.b);
      pdf.triangle(margin + 8, y - 3, margin + 5.5, y + 1, margin + 10.5, y + 1, 'F');
      pdf.setFontSize(5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text('!', margin + 8, y + 0.5, { align: 'center' });

      // Text
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      lines.forEach((line, li) => {
        checkPageBreak(5);
        pdf.text(line, margin + 14, y + li * 5);
      });
      y += lines.length * 5 + 5;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ADDITIONAL TIPS
  // ════════════════════════════════════════════════════════════════════════════
  if (parsed.additionalTips.length > 0) {
    checkPageBreak(22);
    sectionHeader('Enhancement Tips & Recommendations', colors.purple);

    parsed.additionalTips.forEach((tip, idx) => {
      checkPageBreak(16);
      const lines = wrapText(tip, contentWidth - 18);
      const rowH = lines.length * 5 + 4;
      // Card
      const tipBg = idx % 2 === 0 ? colors.purpleBg : colors.white;
      drawRoundedRect(margin, y - 5, contentWidth, rowH, 2, tipBg);

      // Star/lightbulb badge
      pdf.setFillColor(colors.purple.r, colors.purple.g, colors.purple.b);
      pdf.circle(margin + 5, y - 1, 3.5, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text('★', margin + 5, y + 0.8, { align: 'center' });

      // Text
      pdf.setFontSize(9.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      lines.forEach((line, li) => {
        checkPageBreak(5);
        pdf.text(line, margin + 12, y + li * 5);
      });
      y += lines.length * 5 + 4;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  checkPageBreak(50);
  y += 6;

  // Section title
  sectionHeader('Enhancement Summary', colors.primaryDark);

  // 4 mini stat cards in a row
  const cardW = (contentWidth - 9) / 4;
  const cardH = 22;
  const stats = [
    { label: 'KEYWORD\nMATCH', value: `${kwScore}%`, color: scoreColor, bg: scoreBgColor },
    { label: 'KEYWORDS\nMATCHED', value: `${matchedCount}/${totalKw}`, color: colors.success, bg: colors.successBg },
    { label: 'CHANGES\nAPPLIED', value: `${parsed.changesMade.length}`, color: colors.primary, bg: colors.primaryBg },
    { label: 'GAPS\nFOUND', value: `${parsed.gapAnalysis.length}`, color: colors.warning, bg: colors.warningBg },
  ];

  stats.forEach((stat, i) => {
    const sx = margin + i * (cardW + 3);
    drawRoundedRect(sx, y - 2, cardW, cardH, 3, stat.bg);
    drawCardBorder(sx, y - 2, cardW, cardH, 3, stat.color);
    // Top accent
    drawRoundedRect(sx + cardW / 2 - 8, y - 2, 16, 2, 1, stat.color);

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(stat.color.r, stat.color.g, stat.color.b);
    pdf.text(stat.value, sx + cardW / 2, y + 8, { align: 'center' });

    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    const labelLines = stat.label.split('\n');
    labelLines.forEach((l, li) => {
      pdf.text(l, sx + cardW / 2, y + 14 + li * 3.5, { align: 'center' });
    });
  });

  y += cardH + 10;

  // ── Disclaimer ──
  checkPageBreak(16);
  drawRoundedRect(margin, y - 2, contentWidth, 12, 2, colors.lightGray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
  pdf.text(
    'This report was generated by Sebenza-AI. Analysis is based on keyword matching and may not reflect all aspects of CV quality.',
    margin + 4, y + 2
  );
  pdf.text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    margin + 4, y + 6
  );

  // ── Add footer to last page ──
  addFooter();

  const safeName = (jobTitle || 'CV_Analysis').replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`${safeName}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}
