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

export const generateAtsReport = (data: ATSReportData) => {
  // Create a new window with the report content
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up was blocked. Please allow pop-ups for this site and try again.');
    return;
  }

  // Generate the report HTML with enhanced content
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>ATS Compatibility Report - ${data.score}%</title>
      <meta charset="UTF-8">
      <style>
        @media print {
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; background: white; }
          .header { text-align: center; margin-bottom: 2rem; border-bottom: 3px solid #ec4899; padding-bottom: 1rem; }
          .title { font-size: 28px; color: #ec4899; margin-bottom: 0.5rem; font-weight: bold; }
          .subtitle { color: #64748b; margin-bottom: 2rem; font-size: 16px; }

          .score-container {
            text-align: center;
            margin: 2rem 0;
            padding: 2rem;
            border-radius: 15px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 2px solid #ec4899;
          }
          .score-circle {
            display: inline-block;
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ec4899 0%, #f97316 100%);
            color: white;
            text-align: center;
            line-height: 140px;
            font-size: 36px;
            font-weight: bold;
            margin-bottom: 1rem;
            box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
          }

          .section {
            margin: 2rem 0;
            page-break-inside: avoid;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1.5rem;
            background: white;
          }
          .section-title {
            font-size: 20px;
            color: #1e293b;
            border-bottom: 2px solid #ec4899;
            padding-bottom: 0.5rem;
            margin-bottom: 1rem;
            font-weight: bold;
          }

          .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
          }
          .breakdown-item {
            background: #f8fafc;
            padding: 1rem;
            border-radius: 8px;
            border-left: 4px solid #ec4899;
          }
          .breakdown-label { font-weight: bold; color: #374151; margin-bottom: 0.5rem; }
          .breakdown-score {
            font-size: 24px;
            font-weight: bold;
            color: #ec4899;
          }

          .keyword-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 0.5rem;
            margin: 1rem 0;
          }
          .keyword {
            display: inline-block;
            background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
            color: #7e22ce;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
            border: 1px solid #d8b4fe;
            text-align: center;
          }
          .missing-keyword {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            color: #b91c1c;
            border-color: #fca5a5;
          }

          .list-item {
            margin-bottom: 0.75rem;
            padding-left: 1.5rem;
            position: relative;
            line-height: 1.5;
          }
          .list-item:before {
            content: '•';
            position: absolute;
            left: 0;
            color: #ec4899;
            font-weight: bold;
            font-size: 1.2em;
          }

          .footer {
            margin-top: 3rem;
            padding-top: 1rem;
            border-top: 2px solid #e2e8f0;
            text-align: center;
            font-size: 0.75rem;
            color: #64748b;
          }

          .strengths-list, .improvements-list {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
          }

          .issues-list {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
          }
        }

        @media screen {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">ATS Compatibility Report</h1>
        <p class="subtitle">Generated by Sebenza AI • Analysis Score: ${data.score}%</p>
      </div>

      <div class="score-container">
        <div class="score-circle">${data.score}%</div>
        <div style="font-weight: bold; font-size: 1.25rem; color: #374151;">ATS Compatibility Score</div>
        <div style="color: #64748b; margin-top: 0.5rem;">
          ${data.score >= 80 ? 'Excellent ATS optimization' :
            data.score >= 60 ? 'Good ATS compatibility' :
            data.score >= 40 ? 'Fair performance - needs improvement' :
            'Significant optimization needed'}
        </div>
      </div>

      ${data.jobTitle || data.jobCompany ? `
        <div class="section">
          <h2 class="section-title">Job Information</h2>
          ${data.jobTitle ? `<p><strong>Position:</strong> ${data.jobTitle}</p>` : ''}
          ${data.jobCompany ? `<p><strong>Company:</strong> ${data.jobCompany}</p>` : ''}
          <p><strong>Analysis Date:</strong> ${data.analysisDate}</p>
        </div>
      ` : ''}

      ${data.breakdown && Object.keys(data.breakdown).length > 0 ? `
        <div class="section">
          <h2 class="section-title">Detailed Score Breakdown</h2>
          <div class="breakdown-grid">
            ${Object.entries(data.breakdown).map(([key, value]) => `
              <div class="breakdown-item">
                <div class="breakdown-label">${key.charAt(0).toUpperCase() + key.slice(1)}</div>
                <div class="breakdown-score">${value}%</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${data.strengths && data.strengths.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Strengths</h2>
          <div class="strengths-list">
            ${data.strengths.map(strength => `<div class="list-item">${strength}</div>`).join('')}
          </div>
        </div>
      ` : ''}

      ${data.improvements && data.improvements.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Areas for Improvement</h2>
          <div class="improvements-list">
            ${data.improvements.map(improvement => `<div class="list-item">${improvement}</div>`).join('')}
          </div>
        </div>
      ` : ''}

      ${data.matchedKeywords.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Matched Keywords (${data.matchedKeywords.length})</h2>
          <p>Keywords found in both your resume and the job description:</p>
          <div class="keyword-grid">
            ${data.matchedKeywords.slice(0, 50).map(keyword =>
              `<span class="keyword">${keyword}</span>`
            ).join('')}
          </div>
          ${data.matchedKeywords.length > 50 ? `<p><em>... and ${data.matchedKeywords.length - 50} more keywords</em></p>` : ''}
        </div>
      ` : ''}

      ${data.missingKeywords.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Missing Keywords (${data.missingKeywords.length})</h2>
          <p>Important keywords from the job description not found in your resume:</p>
          <div class="keyword-grid">
            ${data.missingKeywords.slice(0, 30).map(keyword =>
              `<span class="keyword missing-keyword">${keyword}</span>`
            ).join('')}
          </div>
          ${data.missingKeywords.length > 30 ? `<p><em>... and ${data.missingKeywords.length - 30} more keywords</em></p>` : ''}
        </div>
      ` : ''}

      ${data.atsCompatibility && data.atsCompatibility.issues && data.atsCompatibility.issues.length > 0 ? `
        <div class="section">
          <h2 class="section-title">ATS Compatibility Issues</h2>
          <div class="issues-list">
            ${data.atsCompatibility.issues.map(issue => `<div class="list-item">${issue}</div>`).join('')}
          </div>
        </div>
      ` : ''}

      ${data.recommendations.length > 0 ? `
        <div class="section">
          <h2 class="section-title">Recommendations</h2>
          <div>
            ${data.recommendations.map(rec =>
              `<div class="list-item">${rec}</div>`
            ).join('')}
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <div style="margin-bottom: 0.5rem;"><strong>Sebenza AI ATS Checker</strong></div>
        <div>Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        <div style="margin-top: 0.5rem; color: #9ca3af;">For optimal ATS performance, aim for scores above 70%</div>
      </div>

      <script>
        // Auto-print when the page loads
        window.onload = function() {
          setTimeout(function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          }, 500);
        };
      </script>
    </body>
    </html>
  `;

  // Write the HTML to the new window
  printWindow.document.write(reportHTML);
  printWindow.document.close();
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
