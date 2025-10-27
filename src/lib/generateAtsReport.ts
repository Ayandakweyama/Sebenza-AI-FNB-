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
  // Create a new jsPDF instance for direct PDF download
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Sebenza AI Brand Colors
  const colors = {
    primary: { r: 236, g: 72, b: 153 },      // Pink #ec4899
    secondary: { r: 251, g: 207, b: 232 },   // Light pink #fbcfe8
    dark: { r: 30, g: 41, b: 59 },           // Dark slate #1e293b
    gray: { r: 100, g: 116, b: 139 },        // Slate gray #64748b
    lightGray: { r: 241, g: 245, b: 249 },   // Light gray #f1f5f9
    success: { r: 34, g: 197, b: 94 },       // Green #22c55e
    warning: { r: 251, g: 146, b: 60 },      // Orange #fb923c
    danger: { r: 239, g: 68, b: 68 },        // Red #ef4444
    purple: { r: 168, g: 85, b: 247 }        // Purple accent #a855f7
  };
  
  let yPosition = 15;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to add new page if needed
  const checkPageBreak = (requiredSpace: number = 20) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = 20;
      // Add subtle page header on new pages
      pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
      pdf.rect(0, 0, pageWidth, 3, 'F');
    }
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number): string[] => {
    return pdf.splitTextToSize(text, maxWidth);
  };

  // Helper function to draw rounded rectangle
  const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, fillColor?: any) => {
    if (fillColor) {
      pdf.setFillColor(fillColor.r, fillColor.g, fillColor.b);
      pdf.roundedRect(x, y, width, height, radius, radius, 'F');
    } else {
      pdf.roundedRect(x, y, width, height, radius, radius, 'S');
    }
  };

  // Top gradient bar (simulated with rectangle)
  pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  pdf.rect(0, 0, pageWidth, 5, 'F');
  
  // Logo area with brand name
  yPosition = 25;
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  pdf.text('SEBENZA', margin, yPosition);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
  pdf.text(' AI', margin + 35, yPosition);
  
  // Tagline
  pdf.setFontSize(10);
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text('Your Career Success Partner', margin, yPosition + 5);
  
  // Report title on the right
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
  pdf.text('ATS COMPATIBILITY REPORT', pageWidth - margin, yPosition - 5, { align: 'right' });
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth - margin, yPosition + 1, { align: 'right' });
  
  yPosition += 20;

  // Score Section with enhanced visual design
  yPosition += 10;
  
  // Score card background
  drawRoundedRect(margin, yPosition - 5, contentWidth, 50, 5, colors.lightGray);
  
  // Determine score color based on performance
  const scoreColor = data.score >= 80 ? colors.success :
                     data.score >= 60 ? colors.warning :
                     colors.danger;
  
  // Large score circle with gradient effect
  pdf.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
  pdf.circle(pageWidth / 2, yPosition + 20, 18, 'F');
  
  // Inner circle for depth effect
  pdf.setFillColor(255, 255, 255);
  pdf.circle(pageWidth / 2, yPosition + 20, 15, 'F');
  
  // Score text
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  pdf.text(`${data.score}%`, pageWidth / 2, yPosition + 24, { align: 'center' });
  
  // Score label
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.text('COMPATIBILITY SCORE', pageWidth / 2, yPosition + 32, { align: 'center' });
  
  // Score description with icon
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  const scoreDesc = data.score >= 80 ? '✓ Excellent ATS Optimization' :
                    data.score >= 60 ? '⚡ Good ATS Compatibility' :
                    data.score >= 40 ? '⚠ Needs Improvement' :
                    '✗ Significant Optimization Required';
  pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
  pdf.text(scoreDesc, pageWidth / 2, yPosition + 42, { align: 'center' });
  
  yPosition += 55;

  // Job Information
  if (data.jobTitle || data.jobCompany) {
    checkPageBreak(35);
    
    // Section header with underline
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.text('JOB DETAILS', margin, yPosition);
    
    // Underline
    pdf.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 2, margin + 30, yPosition + 2);
    yPosition += 10;
    
    pdf.setFontSize(10);
    pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
    if (data.jobTitle) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Position: ', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.jobTitle, margin + 20, yPosition);
      yPosition += 6;
    }
    if (data.jobCompany) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('Company: ', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(data.jobCompany, margin + 20, yPosition);
      yPosition += 6;
    }
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analysis Date: ', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.analysisDate, margin + 28, yPosition);
    yPosition += 15;
  }

  // Score Breakdown
  if (data.breakdown && Object.keys(data.breakdown).length > 0) {
    checkPageBreak(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.text('SCORE BREAKDOWN', margin, yPosition);
    
    // Underline
    pdf.setDrawColor(colors.primary.r, colors.primary.g, colors.primary.b);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition + 2, margin + 40, yPosition + 2);
    yPosition += 10;
    
    pdf.setFontSize(10);
    Object.entries(data.breakdown).forEach(([key, value]) => {
      // Progress bar background
      pdf.setFillColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
      pdf.rect(margin, yPosition - 3, contentWidth, 6, 'F');
      
      // Progress bar fill
      const barColor = Number(value) >= 80 ? colors.success : Number(value) >= 60 ? colors.warning : colors.danger;
      pdf.setFillColor(barColor.r, barColor.g, barColor.b);
      pdf.rect(margin, yPosition - 3, (contentWidth * Number(value)) / 100, 6, 'F');
      
      // Text labels
      pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${key.charAt(0).toUpperCase() + key.slice(1)}`, margin + 2, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${value}%`, pageWidth - margin - 2, yPosition, { align: 'right' });
      yPosition += 8;
    });
    yPosition += 8;
  }

  // Strengths
  if (data.strengths && data.strengths.length > 0) {
    checkPageBreak(30 + data.strengths.length * 6);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
    pdf.text('✓ STRENGTHS', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
    data.strengths.forEach(strength => {
      const lines = wrapText(`• ${strength}`, contentWidth);
      lines.forEach(line => {
        checkPageBreak(6);
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });
    });
    yPosition += 6;
  }

  // Areas for Improvement
  if (data.improvements && data.improvements.length > 0) {
    checkPageBreak(30 + data.improvements.length * 6);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.warning.r, colors.warning.g, colors.warning.b);
    pdf.text('⚠ AREAS FOR IMPROVEMENT', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
    data.improvements.forEach(improvement => {
      const lines = wrapText(`• ${improvement}`, contentWidth);
      lines.forEach(line => {
        checkPageBreak(6);
        pdf.text(line, margin, yPosition);
        yPosition += 6;
      });
    });
    yPosition += 6;
  }

  // Matched Keywords
  if (data.matchedKeywords.length > 0) {
    checkPageBreak(30);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.success.r, colors.success.g, colors.success.b);
    pdf.text(`✓ MATCHED KEYWORDS (${data.matchedKeywords.length})`, margin, yPosition);
    yPosition += 8;
    
    // Keywords in boxes
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    let xPos = margin;
    let lineHeight = 0;
    data.matchedKeywords.slice(0, 30).forEach(keyword => {
      const textWidth = pdf.getTextWidth(keyword) + 4;
      
      // Check if we need to wrap to next line
      if (xPos + textWidth > pageWidth - margin) {
        xPos = margin;
        yPosition += 7;
        checkPageBreak(7);
      }
      
      // Draw keyword box
      pdf.setFillColor(colors.secondary.r, colors.secondary.g, colors.secondary.b);
      drawRoundedRect(xPos, yPosition - 4, textWidth, 6, 1, colors.secondary);
      
      // Draw keyword text
      pdf.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
      pdf.text(keyword, xPos + 2, yPosition);
      
      xPos += textWidth + 3;
    });
    
    if (data.matchedKeywords.length > 30) {
      yPosition += 7;
      pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`... and ${data.matchedKeywords.length - 30} more keywords`, margin, yPosition);
    }
    yPosition += 10;
  }

  // Missing Keywords
  if (data.missingKeywords.length > 0) {
    checkPageBreak(30);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
    pdf.text(`✗ MISSING KEYWORDS (${data.missingKeywords.length})`, margin, yPosition);
    yPosition += 8;
    
    // Keywords in boxes
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    let xPos = margin;
    let lineHeight = 0;
    data.missingKeywords.slice(0, 20).forEach(keyword => {
      const textWidth = pdf.getTextWidth(keyword) + 4;
      
      // Check if we need to wrap to next line
      if (xPos + textWidth > pageWidth - margin) {
        xPos = margin;
        yPosition += 7;
        checkPageBreak(7);
      }
      
      // Draw keyword box with light red background
      pdf.setFillColor(255, 240, 240);
      drawRoundedRect(xPos, yPosition - 4, textWidth, 6, 1, { r: 255, g: 240, b: 240 });
      
      // Draw keyword text
      pdf.setTextColor(colors.danger.r, colors.danger.g, colors.danger.b);
      pdf.text(keyword, xPos + 2, yPosition);
      
      xPos += textWidth + 3;
    });
    
    if (data.missingKeywords.length > 20) {
      yPosition += 7;
      pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`... and ${data.missingKeywords.length - 20} more keywords`, margin, yPosition);
    }
    yPosition += 10;
  }

  // Recommendations
  if (data.recommendations.length > 0) {
    checkPageBreak(30 + data.recommendations.length * 6);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.purple.r, colors.purple.g, colors.purple.b);
    pdf.text('💡 RECOMMENDATIONS', margin, yPosition);
    yPosition += 8;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
    data.recommendations.forEach((rec, index) => {
      checkPageBreak(10);
      
      // Number circle
      pdf.setFillColor(colors.purple.r, colors.purple.g, colors.purple.b);
      pdf.circle(margin + 3, yPosition - 2, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(`${index + 1}`, margin + 3, yPosition - 0.5, { align: 'center' });
      
      // Recommendation text
      pdf.setFontSize(10);
      pdf.setTextColor(colors.dark.r, colors.dark.g, colors.dark.b);
      const lines = wrapText(rec, contentWidth - 10);
      lines.forEach((line, lineIndex) => {
        checkPageBreak(6);
        pdf.text(line, margin + 10, yPosition + (lineIndex * 5));
      });
      yPosition += lines.length * 5 + 3;
    });
    yPosition += 6;
  }

  // Footer
  checkPageBreak(25);
  yPosition = pageHeight - 25;
  
  // Footer separator line
  pdf.setDrawColor(colors.lightGray.r, colors.lightGray.g, colors.lightGray.b);
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  // Footer content
  pdf.setFontSize(9);
  pdf.setTextColor(colors.gray.r, colors.gray.g, colors.gray.b);
  pdf.setFont('helvetica', 'normal');
  pdf.text('SEBENZA AI ATS CHECKER', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  pdf.setFontSize(8);
  pdf.text(`Report generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 4;
  pdf.setFont('helvetica', 'italic');
  pdf.text('For optimal ATS performance, aim for scores above 70%', pageWidth / 2, yPosition, { align: 'center' });
  
  // Bottom accent bar
  pdf.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  pdf.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  // Save the PDF with a descriptive filename
  const fileName = `ATS_Report_${data.score}%_${new Date().toISOString().split('T')[0]}.pdf`;
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
