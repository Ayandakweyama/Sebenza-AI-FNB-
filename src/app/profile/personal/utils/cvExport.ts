import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { ProfileFormData } from '../profile.schema';

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'docx';
  template: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive';
  colorScheme: string;
  fontFamily: string;
  showPhoto: boolean;
}

// PDF Export Configuration
const pdfOptions = {
  margin: 0.5,
  filename: 'cv.pdf',
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { 
    scale: 2,
    useCORS: true,
    letterRendering: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
    ignoreElements: (element: Element) => {
      // Ignore elements that might cause issues
      return element.classList.contains('no-print') || 
             element.classList.contains('export-buttons') ||
             element.classList.contains('cv-preview-controls');
    }
  },
  jsPDF: { 
    unit: 'in', 
    format: 'a4', 
    orientation: 'portrait' as const,
    compress: true
  }
};

// Convert oklch colors to hex for html2canvas compatibility
const convertOklchToHex = (element: HTMLElement): void => {
  // First, apply inline styles to override any oklch colors
  const allElements = element.querySelectorAll('*');
  
  // Apply white background to the main container
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#000000';
  
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    
    // Get all color-related properties
    const colorProperties = [
      'backgroundColor',
      'color',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor',
      'textDecorationColor',
      'fill',
      'stroke'
    ];
    
    colorProperties.forEach(prop => {
      const value = computedStyle[prop as any];
      if (value && value.includes('oklch')) {
        // Convert oklch to a safe fallback based on the property
        let fallbackColor = '#000000';
        
        // Determine appropriate fallback based on the original value
        if (value.includes('0.98') || value.includes('0.96')) {
          fallbackColor = '#f9fafb'; // Very light gray
        } else if (value.includes('0.89') || value.includes('0.83')) {
          fallbackColor = '#e5e7eb'; // Light gray
        } else if (value.includes('0.71') || value.includes('0.58')) {
          fallbackColor = '#6b7280'; // Medium gray
        } else if (value.includes('0.45') || value.includes('0.32')) {
          fallbackColor = '#374151'; // Dark gray
        } else if (value.includes('0.23') || value.includes('0.15')) {
          fallbackColor = '#1f2937'; // Very dark gray
        } else if (value.includes('262.75')) {
          fallbackColor = '#2563eb'; // Blue
        } else if (value.includes('308.66')) {
          fallbackColor = '#9333ea'; // Purple
        } else if (value.includes('142.71')) {
          fallbackColor = '#10b981'; // Green/Emerald
        } else if (value.includes('24.57')) {
          fallbackColor = '#f59e0b'; // Amber
        } else if (value.includes('351.36')) {
          fallbackColor = '#e11d48'; // Rose
        }
        
        // Apply the fallback color
        if (prop === 'backgroundColor') {
          htmlEl.style.backgroundColor = fallbackColor;
        } else if (prop === 'color') {
          htmlEl.style.color = fallbackColor;
        } else if (prop.includes('border')) {
          htmlEl.style[prop as any] = fallbackColor;
        } else {
          htmlEl.style[prop as any] = fallbackColor;
        }
      }
    });
    
    // Also check for any gradients with oklch
    const backgroundImage = computedStyle.backgroundImage;
    if (backgroundImage && backgroundImage.includes('oklch')) {
      // Replace gradient with solid color
      htmlEl.style.backgroundImage = 'none';
      htmlEl.style.backgroundColor = '#2563eb'; // Default to blue for gradients
    }
    
    // Ensure text is visible
    if (computedStyle.color === 'transparent' || computedStyle.color === 'rgba(0, 0, 0, 0)') {
      htmlEl.style.color = '#000000';
    }
    
    // Ensure backgrounds are set
    if (computedStyle.backgroundColor === 'transparent' || computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)') {
      // Don't override transparent backgrounds unless necessary
      if (htmlEl.tagName === 'BODY' || htmlEl.tagName === 'HTML') {
        htmlEl.style.backgroundColor = '#ffffff';
      }
    }
  });
  
  // Force specific classes to have proper colors
  const textWhiteElements = element.querySelectorAll('.text-white');
  textWhiteElements.forEach(el => {
    (el as HTMLElement).style.color = '#ffffff';
  });
  
  const bgWhiteElements = element.querySelectorAll('.bg-white');
  bgWhiteElements.forEach(el => {
    (el as HTMLElement).style.backgroundColor = '#ffffff';
  });
  
  const grayTextElements = element.querySelectorAll('[class*="text-gray-"]');
  grayTextElements.forEach(el => {
    const className = el.className;
    const htmlEl = el as HTMLElement;
    if (className.includes('text-gray-900')) htmlEl.style.color = '#111827';
    else if (className.includes('text-gray-800')) htmlEl.style.color = '#1f2937';
    else if (className.includes('text-gray-700')) htmlEl.style.color = '#374151';
    else if (className.includes('text-gray-600')) htmlEl.style.color = '#4b5563';
    else if (className.includes('text-gray-500')) htmlEl.style.color = '#6b7280';
    else if (className.includes('text-gray-400')) htmlEl.style.color = '#9ca3af';
    else if (className.includes('text-gray-300')) htmlEl.style.color = '#d1d5db';
    else if (className.includes('text-gray-200')) htmlEl.style.color = '#e5e7eb';
    else if (className.includes('text-gray-100')) htmlEl.style.color = '#f3f4f6';
  });
  
  const grayBgElements = element.querySelectorAll('[class*="bg-gray-"]');
  grayBgElements.forEach(el => {
    const className = el.className;
    const htmlEl = el as HTMLElement;
    if (className.includes('bg-gray-100')) htmlEl.style.backgroundColor = '#f3f4f6';
    else if (className.includes('bg-gray-200')) htmlEl.style.backgroundColor = '#e5e7eb';
    else if (className.includes('bg-gray-300')) htmlEl.style.backgroundColor = '#d1d5db';
    else if (className.includes('bg-gray-400')) htmlEl.style.backgroundColor = '#9ca3af';
    else if (className.includes('bg-gray-500')) htmlEl.style.backgroundColor = '#6b7280';
    else if (className.includes('bg-gray-600')) htmlEl.style.backgroundColor = '#4b5563';
    else if (className.includes('bg-gray-700')) htmlEl.style.backgroundColor = '#374151';
    else if (className.includes('bg-gray-800')) htmlEl.style.backgroundColor = '#1f2937';
    else if (className.includes('bg-gray-900')) htmlEl.style.backgroundColor = '#111827';
  });
};

// Export CV as PDF
export const exportToPDF = async (elementId: string, options: ExportOptions): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('CV element not found');
    }

    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Apply print-specific styles
    clonedElement.style.width = '210mm';
    clonedElement.style.minHeight = '297mm';
    clonedElement.style.padding = '20mm';
    clonedElement.style.margin = '0';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.border = 'none';
    clonedElement.style.backgroundColor = 'white';
    
    // Convert oklch colors to hex for html2canvas compatibility
    convertOklchToHex(clonedElement);
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    const filename = options.filename || `cv-${Date.now()}.pdf`;
    
    // Use browser print as the primary method
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { margin: 0; padding: 20mm; font-family: Arial, sans-serif; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${clonedElement.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
    } else {
      throw new Error('Could not open print window. Please check your popup blocker.');
    }
    
    // Clean up
    if (tempContainer.parentNode) {
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
};

// Export CV as Word Document
export const exportToWord = async (data: Partial<ProfileFormData>, options: ExportOptions): Promise<void> => {
  try {
    const filename = options.filename || `cv-${Date.now()}.docx`;
    
    // Create document sections
    const children: any[] = [];

    // Header Section
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${data.firstName || 'First Name'} ${data.lastName || 'Last Name'}`,
            bold: true,
            size: 32,
            color: options.colorScheme.replace('#', '')
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    // Contact Information
    if (data.email || data.phone || data.location) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [data.email, data.phone, data.location].filter(Boolean).join(' | '),
              size: 20
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        })
      );
    }

    // Professional Summary
    if (data.bio) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Professional Summary',
              bold: true,
              size: 24,
              color: options.colorScheme.replace('#', '')
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: data.bio,
              size: 20
            })
          ],
          spacing: { after: 300 }
        })
      );
    }

    // Work Experience
    if (data.workExperience && data.workExperience.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Professional Experience',
              bold: true,
              size: 24,
              color: options.colorScheme.replace('#', '')
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      data.workExperience.forEach((exp) => {
        if (exp.position && exp.company) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: exp.position,
                  bold: true,
                  size: 22
                }),
                new TextRun({
                  text: ` - ${exp.company}`,
                  size: 22
                })
              ],
              spacing: { before: 100, after: 50 }
            })
          );

          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString() : '';
          const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString() : '');
          
          if (startDate) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${startDate} - ${endDate}`,
                    italics: true,
                    size: 18
                  })
                ],
                spacing: { after: 50 }
              })
            );
          }

          if (exp.description) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: exp.description,
                    size: 20
                  })
                ],
                spacing: { after: 100 }
              })
            );
          }

          if (exp.achievements && exp.achievements.length > 0) {
            exp.achievements.forEach((achievement) => {
              if (achievement.trim()) {
                children.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `• ${achievement}`,
                        size: 20
                      })
                    ],
                    spacing: { after: 50 }
                  })
                );
              }
            });
          }

          children.push(
            new Paragraph({
              children: [new TextRun({ text: '', size: 20 })],
              spacing: { after: 200 }
            })
          );
        }
      });
    }

    // Education
    if (data.education && data.education.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Education',
              bold: true,
              size: 24,
              color: options.colorScheme.replace('#', '')
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      data.education.forEach((edu) => {
        if (edu.degree && edu.institution) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${edu.degree} in ${edu.fieldOfStudy || 'Field of Study'}`,
                  bold: true,
                  size: 22
                })
              ],
              spacing: { before: 100, after: 50 }
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: edu.institution,
                  size: 20
                })
              ],
              spacing: { after: 50 }
            })
          );

          const startYear = edu.startDate ? new Date(edu.startDate).getFullYear() : '';
          const endYear = edu.current ? 'Present' : (edu.endDate ? new Date(edu.endDate).getFullYear() : '');
          
          if (startYear) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${startYear} - ${endYear}`,
                    italics: true,
                    size: 18
                  })
                ],
                spacing: { after: 200 }
              })
            );
          }
        }
      });
    }

    // Skills
    if ((data.technicalSkills && data.technicalSkills.length > 0) || (data.softSkills && data.softSkills.length > 0)) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Skills',
              bold: true,
              size: 24,
              color: options.colorScheme.replace('#', '')
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );

      if (data.technicalSkills && data.technicalSkills.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Technical Skills',
                bold: true,
                size: 22
              })
            ],
            spacing: { before: 100, after: 50 }
          })
        );

        const techSkillsText = data.technicalSkills
          .filter(skill => skill.name.trim())
          .map(skill => `${skill.name} (${skill.level})`)
          .join(', ');

        if (techSkillsText) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: techSkillsText,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            })
          );
        }
      }

      if (data.softSkills && data.softSkills.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Soft Skills',
                bold: true,
                size: 22
              })
            ],
            spacing: { before: 100, after: 50 }
          })
        );

        const softSkillsText = data.softSkills
          .filter(skill => skill.trim())
          .join(', ');

        if (softSkillsText) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: softSkillsText,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            })
          );
        }
      }
    }

    // Create the document
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    // Generate and save the document
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, filename);
  } catch (error) {
    console.error('Error exporting Word document:', error);
    throw new Error('Failed to export Word document. Please try again.');
  }
};

// Utility function to prepare element for PDF export
export const prepareCVForExport = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Add print-specific styles
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      #${elementId} {
        width: 210mm !important;
        min-height: 297mm !important;
        padding: 20mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background-color: white !important;
        font-size: 12pt !important;
        line-height: 1.4 !important;
      }
      
      #${elementId} * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      #${elementId} .shadow-lg,
      #${elementId} .shadow-sm {
        box-shadow: none !important;
      }
      
      #${elementId} .rounded-lg,
      #${elementId} .rounded-full,
      #${elementId} .rounded {
        border-radius: 0 !important;
      }
    }
  `;
  
  document.head.appendChild(style);
};
