interface ATSReportData {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  jobTitle?: string;
  jobCompany?: string;
  analysisDate: string;
  recommendations: string[];
  strengths?: string[];
  improvements?: string[];
  breakdown?: any;
  atsCompatibility?: {
    score: number;
    issues: string[];
  };
}

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType } from 'docx';
import jsPDF from 'jspdf';

export const generateAtsReport = (data: ATSReportData) => {
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
      pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      pdf.rect(0, 0, pageWidth, 2.5, 'F');
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

  const sectionHeader = (title: string, color: { r: number; g: number; b: number }) => {
    checkPageBreak(18);
    y += 4;
    drawRoundedRect(margin, y - 5, 3, 8, 1.5, color);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(color.r, color.g, color.b);
    pdf.text(title, margin + 7, y);
    pdf.setDrawColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y + 3, pageWidth - margin, y + 3);
    y += 10;
  };

  const addFooter = () => {
    const footerY = pageHeight - 12;
    pdf.setDrawColor(colors.primaryLight.r, colors.primaryLight.g, colors.primaryLight.b);
    pdf.setLineWidth(0.4);
    pdf.line(margin, footerY - 2, pageWidth - margin, footerY - 2);
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.text('Sebenza-AI', margin, footerY + 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
    pdf.text('  |  ATS Compatibility Report', margin + 19, footerY + 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    pdf.text(`Page ${pageNum}`, pageWidth - margin, footerY + 2, { align: 'right' });
    pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.rect(0, pageHeight - 2.5, pageWidth, 2.5, 'F');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER HEADER
  // ════════════════════════════════════════════════════════════════════════════

  // Full-width header band
  pdf.setFillColor(colors.dark.r, colors.dark.g, colors.dark.b);
  pdf.rect(0, 0, pageWidth, 52, 'F');
  // Pink accent overlay on right half
  pdf.setFillColor(colors.primaryDark.r, colors.primaryDark.g, colors.primaryDark.b);
  pdf.rect(pageWidth * 0.55, 0, pageWidth * 0.45, 52, 'F');
  // Decorative circles
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
  pdf.text('ATS COMPATIBILITY', pageWidth - margin - 2, y - 6, { align: 'right' });
  pdf.text('REPORT', pageWidth - margin - 2, y + 1, { align: 'right' });

  // Date
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.primaryLight.r, colors.primaryLight.g, colors.primaryLight.b);
  pdf.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    pageWidth - margin - 2, y + 8, { align: 'right' }
  );

  // Left sidebar accent
  pdf.setFillColor(colors.primaryBg.r, colors.primaryBg.g, colors.primaryBg.b);
  pdf.rect(0, 52, 4, pageHeight - 52, 'F');

  // ════════════════════════════════════════════════════════════════════════════
  // JOB DETAILS CARD
  // ════════════════════════════════════════════════════════════════════════════
  y = 60;
  if (data.jobTitle || data.jobCompany) {
    const cardH = 22;
    drawRoundedRect(margin, y, contentWidth, cardH, 3, colors.lightGray);
    drawRoundedRect(margin, y, 3, cardH, 1.5, colors.primary);
    drawCardBorder(margin, y, contentWidth, cardH, 3, colors.primaryLight);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    let infoY = y + 6;
    if (data.jobTitle) {
      pdf.text('TARGET ROLE', margin + 8, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      pdf.setFontSize(10);
      pdf.text(data.jobTitle, margin + 38, infoY);
    }
    if (data.jobCompany) {
      infoY += 7;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      pdf.text('COMPANY', margin + 8, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      pdf.setFontSize(10);
      pdf.text(data.jobCompany, margin + 38, infoY);
    }
    y += cardH + 8;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCORE SECTION — DONUT CHART + STAT CARDS
  // ════════════════════════════════════════════════════════════════════════════
  const matchedCount = data.matchedKeywords.length;
  const missingCount = data.missingKeywords.length;
  const totalKw = matchedCount + missingCount;
  const kwScore = data.score;

  const scoreColor = kwScore >= 75 ? colors.success : kwScore >= 50 ? colors.warning : colors.danger;

  // Donut chart center
  const cx = pageWidth / 2;
  const cy = y + 22;
  const outerR = 16;
  const innerR = 11;

  // Background ring
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const a1 = (i / steps) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / steps) * 2 * Math.PI - Math.PI / 2;
    pdf.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
    pdf.triangle(
      cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
      cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR,
      cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR, 'F'
    );
    pdf.triangle(
      cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
      cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR,
      cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR, 'F'
    );
  }

  // Filled arc
  const filledSteps = Math.round((kwScore / 100) * steps);
  for (let i = 0; i < filledSteps; i++) {
    const a1 = (i / steps) * 2 * Math.PI - Math.PI / 2;
    const a2 = ((i + 1) / steps) * 2 * Math.PI - Math.PI / 2;
    pdf.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
    pdf.triangle(
      cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
      cx + Math.cos(a1) * outerR, cy + Math.sin(a1) * outerR,
      cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR, 'F'
    );
    pdf.triangle(
      cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR,
      cx + Math.cos(a2) * outerR, cy + Math.sin(a2) * outerR,
      cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR, 'F'
    );
  }

  // Center text
  pdf.setFillColor(255, 255, 255);
  pdf.circle(cx, cy, innerR - 0.5, 'F');
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  pdf.text(`${kwScore}%`, cx, cy + 2, { align: 'center' });
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text('SCORE', cx, cy + 6, { align: 'center' });

  // Stat cards flanking the donut
  const cardW = 42;
  const cardH2 = 28;
  const leftCardX = margin;
  const rightCardX = pageWidth - margin - cardW;
  const cardY = y + 8;

  // Left card — Matched
  drawRoundedRect(leftCardX, cardY, cardW, cardH2, 3, colors.successBg);
  drawCardBorder(leftCardX, cardY, cardW, cardH2, 3, colors.success);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
  pdf.text(`${matchedCount}`, leftCardX + cardW / 2, cardY + 13, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MATCHED', leftCardX + cardW / 2, cardY + 20, { align: 'center' });

  // Right card — Missing
  drawRoundedRect(rightCardX, cardY, cardW, cardH2, 3, colors.dangerBg);
  drawCardBorder(rightCardX, cardY, cardW, cardH2, 3, colors.danger);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
  pdf.text(`${missingCount}`, rightCardX + cardW / 2, cardY + 13, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MISSING', rightCardX + cardW / 2, cardY + 20, { align: 'center' });

  // Total keywords label
  y += 46;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text(`${totalKw} total keywords analysed`, cx, y, { align: 'center' });
  y += 6;

  // Score description
  const scoreDesc = kwScore >= 80 ? 'Excellent ATS Optimization' :
                    kwScore >= 60 ? 'Good ATS Compatibility' :
                    kwScore >= 40 ? 'Needs Improvement' :
                    'Significant Optimization Required';
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  pdf.text(scoreDesc, cx, y, { align: 'center' });
  y += 10;

  // ════════════════════════════════════════════════════════════════════════════
  // KEYWORD COVERAGE BAR
  // ════════════════════════════════════════════════════════════════════════════
  if (totalKw > 0) {
    sectionHeader('Keyword Coverage Breakdown', colors.primary);

    const barH = 8;
    const barW = contentWidth;
    const matchedW = Math.max((matchedCount / totalKw) * barW, 1);

    drawRoundedRect(margin, y - 2, barW, barH, 4, { r: 230, g: 230, b: 230 });
    if (matchedW > 4) {
      drawRoundedRect(margin, y - 2, matchedW, barH, 4, colors.success);
    }

    y += barH + 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
    const matchPct = totalKw > 0 ? Math.round((matchedCount / totalKw) * 100) : 0;
    const missPct = totalKw > 0 ? 100 - matchPct : 0;
    pdf.text(`- ${matchedCount} matched (${matchPct}%)`, margin, y);
    pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
    pdf.text(`- ${missingCount} missing (${missPct}%)`, margin + 55, y);
    y += 8;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SCORE BREAKDOWN (progress bars)
  // ════════════════════════════════════════════════════════════════════════════
  if (data.breakdown && Object.keys(data.breakdown).length > 0) {
    sectionHeader('Score Breakdown', colors.primary);

    const entries = Object.entries(data.breakdown);
    entries.forEach(([key, value], idx) => {
      checkPageBreak(14);
      const rowY = y;
      const barBgH = 7;
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const val = Number(value);
      const barColor = val >= 80 ? colors.success : val >= 60 ? colors.warning : colors.danger;

      // Alternating row background
      if (idx % 2 === 0) {
        drawRoundedRect(margin, rowY - 4, contentWidth, 12, 2, colors.lightGray);
      }

      // Label
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      pdf.text(label, margin + 3, rowY + 1);

      // Progress bar
      const barX = margin + 55;
      const barMaxW = contentWidth - 75;
      drawRoundedRect(barX, rowY - 2, barMaxW, barBgH, 3, { r: 230, g: 230, b: 230 });
      const fillW = Math.max((val / 100) * barMaxW, 2);
      if (fillW > 3) {
        drawRoundedRect(barX, rowY - 2, fillW, barBgH, 3, barColor);
      }

      // Percentage
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(barColor.r, barColor.g, barColor.b);
      pdf.text(`${val}%`, pageWidth - margin - 2, rowY + 1, { align: 'right' });

      y += 13;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MATCHED KEYWORDS (pills)
  // ════════════════════════════════════════════════════════════════════════════
  if (data.matchedKeywords.length > 0) {
    checkPageBreak(22);
    sectionHeader(`Matched Keywords (${data.matchedKeywords.length})`, colors.success);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    let xPos = margin;
    const pillH = 6;
    const pillGap = 3;
    const pillPad = 4;

    data.matchedKeywords.forEach(kw => {
      const tw = pdf.getTextWidth(kw) + pillPad * 2 + 4;
      if (xPos + tw > pageWidth - margin) {
        xPos = margin;
        y += pillH + 3;
        checkPageBreak(pillH + 3);
      }
      drawRoundedRect(xPos, y - 4, tw, pillH, 3, colors.successBg);
      // Dot indicator
      pdf.setFillColor(colors.success.r, colors.success.g, colors.success.b);
      pdf.circle(xPos + 4, y - 1, 1.2, 'F');
      pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
      pdf.text(kw, xPos + 7, y - 0.5);
      xPos += tw + pillGap;
    });
    y += pillH + 6;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MISSING KEYWORDS (pills)
  // ════════════════════════════════════════════════════════════════════════════
  if (data.missingKeywords.length > 0) {
    checkPageBreak(22);
    sectionHeader(`Missing Keywords (${data.missingKeywords.length})`, colors.danger);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    let xPos = margin;
    const pillH = 6;
    const pillGap = 3;
    const pillPad = 4;

    data.missingKeywords.forEach(kw => {
      const tw = pdf.getTextWidth(kw) + pillPad * 2 + 4;
      if (xPos + tw > pageWidth - margin) {
        xPos = margin;
        y += pillH + 3;
        checkPageBreak(pillH + 3);
      }
      drawRoundedRect(xPos, y - 4, tw, pillH, 3, colors.dangerBg);
      pdf.setFillColor(colors.danger.r, colors.danger.g, colors.danger.b);
      pdf.circle(xPos + 4, y - 1, 1.2, 'F');
      pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
      pdf.text(kw, xPos + 7, y - 0.5);
      xPos += tw + pillGap;
    });
    y += pillH + 6;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STRENGTHS (card section with green accent)
  // ════════════════════════════════════════════════════════════════════════════
  if (data.strengths && data.strengths.length > 0) {
    checkPageBreak(20);
    sectionHeader('Strengths', colors.success);

    data.strengths.forEach((item, idx) => {
      checkPageBreak(12);
      const lines = wrapText(item, contentWidth - 16);
      const blockH = lines.length * 5 + 4;

      if (idx % 2 === 0) {
        drawRoundedRect(margin, y - 4, contentWidth, blockH, 2, colors.successBg);
      }

      // Green check indicator
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
      pdf.text('+', margin + 4, y);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      lines.forEach((line: string, li: number) => {
        pdf.text(line, margin + 10, y + li * 5);
      });
      y += blockH + 1;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // AREAS FOR IMPROVEMENT (card section with warning accent)
  // ════════════════════════════════════════════════════════════════════════════
  if (data.improvements && data.improvements.length > 0) {
    checkPageBreak(20);
    sectionHeader('Areas for Improvement', colors.warning);

    data.improvements.forEach((item, idx) => {
      checkPageBreak(12);
      const lines = wrapText(item, contentWidth - 16);
      const blockH = lines.length * 5 + 4;

      if (idx % 2 === 0) {
        drawRoundedRect(margin, y - 4, contentWidth, blockH, 2, colors.warningBg);
      }

      // Warning triangle indicator
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.warning.r, colors.warning.g, colors.warning.b);
      pdf.text('!', margin + 4, y);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      lines.forEach((line: string, li: number) => {
        pdf.text(line, margin + 10, y + li * 5);
      });
      y += blockH + 1;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ATS COMPATIBILITY ISSUES
  // ════════════════════════════════════════════════════════════════════════════
  if (data.atsCompatibility && data.atsCompatibility.issues && data.atsCompatibility.issues.length > 0) {
    checkPageBreak(20);
    sectionHeader('ATS Compatibility Issues', colors.danger);

    data.atsCompatibility.issues.forEach((item, idx) => {
      checkPageBreak(12);
      const lines = wrapText(item, contentWidth - 16);
      const blockH = lines.length * 5 + 4;

      if (idx % 2 === 0) {
        drawRoundedRect(margin, y - 4, contentWidth, blockH, 2, colors.dangerBg);
      }

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
      pdf.text('X', margin + 4, y);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      lines.forEach((line: string, li: number) => {
        pdf.text(line, margin + 10, y + li * 5);
      });
      y += blockH + 1;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS (numbered cards with purple accent)
  // ════════════════════════════════════════════════════════════════════════════
  if (data.recommendations.length > 0) {
    checkPageBreak(20);
    sectionHeader('Recommendations', colors.purple);

    data.recommendations.forEach((rec, idx) => {
      checkPageBreak(14);
      const lines = wrapText(rec, contentWidth - 18);
      const blockH = lines.length * 5 + 4;

      if (idx % 2 === 0) {
        drawRoundedRect(margin, y - 4, contentWidth, blockH, 2, colors.purpleBg);
      }

      // Number badge
      pdf.setFillColor(colors.purple.r, colors.purple.g, colors.purple.b);
      pdf.circle(margin + 5, y - 0.5, 3, 'F');
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${idx + 1}`, margin + 5, y + 0.5, { align: 'center' });

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.darkText.r, colors.darkText.g, colors.darkText.b);
      lines.forEach((line: string, li: number) => {
        pdf.text(line, margin + 12, y + li * 5);
      });
      y += blockH + 1;
    });
    y += 4;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SUMMARY DASHBOARD (4-column mini stat cards)
  // ════════════════════════════════════════════════════════════════════════════
  checkPageBreak(40);
  sectionHeader('Summary Dashboard', colors.primary);

  const cols = 4;
  const gap = 4;
  const cw = (contentWidth - gap * (cols - 1)) / cols;
  const cardH3 = 22;

  const summaryItems = [
    { label: 'ATS Score', value: `${kwScore}%`, color: scoreColor },
    { label: 'Matched', value: `${matchedCount}`, color: colors.success },
    { label: 'Missing', value: `${missingCount}`, color: colors.danger },
    { label: 'Recommendations', value: `${data.recommendations.length}`, color: colors.purple },
  ];

  summaryItems.forEach((item, i) => {
    const sx = margin + i * (cw + gap);
    drawRoundedRect(sx, y, cw, cardH3, 3, colors.white);
    drawCardBorder(sx, y, cw, cardH3, 3, colors.primaryLight);
    // Top accent line
    drawRoundedRect(sx + 2, y, cw - 4, 1.5, 0.75, item.color);
    // Value
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(item.color.r, item.color.g, item.color.b);
    pdf.text(item.value, sx + cw / 2, y + 11, { align: 'center' });
    // Label
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
    pdf.text(item.label, sx + cw / 2, y + 17, { align: 'center' });
  });

  y += cardH3 + 10;

  // ── Disclaimer ──
  checkPageBreak(16);
  drawRoundedRect(margin, y - 2, contentWidth, 12, 2, colors.lightGray);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(colors.grayLight.r, colors.grayLight.g, colors.grayLight.b);
  pdf.text(
    'This report was generated by Sebenza-AI. For optimal ATS performance, aim for scores above 70%.',
    margin + 4, y + 2
  );
  pdf.text(
    `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    margin + 4, y + 6
  );

  // ── Add footer to last page ──
  addFooter();

  // Save the PDF
  const fileName = `ATS_Report_${data.score}pct_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};

// Generate Word document report
export const generateWordReport = async (data: ATSReportData) => {
  try {
    const sections: any[] = [];

    // Header with title
    sections.push(
      new Paragraph({
        text: 'ATS Compatibility Report',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: `Generated by Sebenza AI • Analysis Score: ${data.score}%`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Score section
    sections.push(
      new Paragraph({
        text: `ATS Compatibility Score: ${data.score}%`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: data.score >= 80 ? 'Excellent ATS optimization' :
              data.score >= 60 ? 'Good ATS compatibility' :
              data.score >= 40 ? 'Fair performance - needs improvement' :
              'Significant optimization needed',
        spacing: { after: 300 }
      })
    );

    // Job Information
    if (data.jobTitle || data.jobCompany) {
      sections.push(
        new Paragraph({
          text: 'Job Information',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
      if (data.jobTitle) {
        sections.push(
          new Paragraph({
            text: `Position: ${data.jobTitle}`,
            spacing: { after: 100 }
          })
        );
      }
      if (data.jobCompany) {
        sections.push(
          new Paragraph({
            text: `Company: ${data.jobCompany}`,
            spacing: { after: 100 }
          })
        );
      }
      sections.push(
        new Paragraph({
          text: `Analysis Date: ${data.analysisDate}`,
          spacing: { after: 300 }
        })
      );
    }

    // Detailed Breakdown
    if (data.breakdown && Object.keys(data.breakdown).length > 0) {
      sections.push(
        new Paragraph({
          text: 'Detailed Score Breakdown',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      Object.entries(data.breakdown).forEach(([key, value]) => {
        sections.push(
          new Paragraph({
            text: `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}%`,
            spacing: { after: 100 }
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    // Strengths
    if (data.strengths && data.strengths.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Strengths',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      data.strengths.forEach(strength => {
        sections.push(
          new Paragraph({
            text: `• ${strength}`,
            spacing: { after: 100 }
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    // Areas for Improvement
    if (data.improvements && data.improvements.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Areas for Improvement',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      data.improvements.forEach(improvement => {
        sections.push(
          new Paragraph({
            text: `• ${improvement}`,
            spacing: { after: 100 }
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    // Matched Keywords
    if (data.matchedKeywords.length > 0) {
      sections.push(
        new Paragraph({
          text: `Matched Keywords (${data.matchedKeywords.length})`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: 'Keywords found in both your resume and the job description:',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: data.matchedKeywords.join(', '),
          spacing: { after: 300 }
        })
      );
    }

    // Missing Keywords
    if (data.missingKeywords.length > 0) {
      sections.push(
        new Paragraph({
          text: `Missing Keywords (${data.missingKeywords.length})`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: 'Important keywords from the job description not found in your resume:',
          spacing: { after: 100 }
        }),
        new Paragraph({
          text: data.missingKeywords.join(', '),
          spacing: { after: 300 }
        })
      );
    }

    // ATS Compatibility Issues
    if (data.atsCompatibility && data.atsCompatibility.issues && data.atsCompatibility.issues.length > 0) {
      sections.push(
        new Paragraph({
          text: 'ATS Compatibility Issues',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      data.atsCompatibility.issues.forEach(issue => {
        sections.push(
          new Paragraph({
            text: `• ${issue}`,
            spacing: { after: 100 }
          })
        );
      });

      sections.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    // Recommendations
    if (data.recommendations.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Recommendations',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      data.recommendations.forEach(rec => {
        sections.push(
          new Paragraph({
            text: `• ${rec}`,
            spacing: { after: 100 }
          })
        );
      });
    }

    // Footer
    sections.push(
      new Paragraph({
        text: `Generated by Sebenza AI on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 100 }
      }),
      new Paragraph({
        text: 'For optimal ATS performance, aim for scores above 70%',
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ATS_Report_${data.score}%.docx`;
    link.click();
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw new Error('Failed to generate Word document. Please try again.');
  }
};
