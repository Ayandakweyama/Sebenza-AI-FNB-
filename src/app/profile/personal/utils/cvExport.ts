import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { ProfileFormData } from '../profile.schema';
import type { CVCustomizationOptions } from '../components/CustomizableCVTemplate';

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'docx';
  template: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive';
  colorScheme: string;
  fontFamily: string;
  showPhoto: boolean;
  customization?: CVCustomizationOptions;
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

const normalizeHex = (hex: string) => hex.replace('#', '').trim();

const extractFontName = (fontFamily: string) => {
  const first = fontFamily.split(',')[0]?.trim() ?? fontFamily;
  return first.replace(/^['"]|['"]$/g, '');
};

const getAlignment = (alignment: CVCustomizationOptions['sectionStyle']['headerAlignment']) => {
  if (alignment === 'center') return AlignmentType.CENTER;
  if (alignment === 'right') return AlignmentType.RIGHT;
  return AlignmentType.LEFT;
};

const getTitleCase = (title: string, headerCase: CVCustomizationOptions['sectionStyle']['headerCase']) => {
  if (headerCase === 'uppercase') return title.toUpperCase();
  if (headerCase === 'capitalize') return title.replace(/\b\w/g, (c) => c.toUpperCase());
  return title;
};

const getMarginTwips = (margins?: CVCustomizationOptions['margins']) => {
  if (margins === 'narrow') return 720;
  if (margins === 'wide') return 1800;
  return 1440;
};

const formatDate = (date: Date | undefined, current: boolean, dateFormat: CVCustomizationOptions['dateFormat']) => {
  if (current) return 'Present';
  if (!date) return '';

  const d = new Date(date);
  if (dateFormat === 'YYYY') return `${d.getFullYear()}`;
  if (dateFormat === 'MM/YYYY') {
    const mm = `${d.getMonth() + 1}`.padStart(2, '0');
    return `${mm}/${d.getFullYear()}`;
  }

  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const getBulletChar = (bulletStyle: CVCustomizationOptions['bulletStyle']) => {
  if (bulletStyle === 'circle') return '○';
  if (bulletStyle === 'square') return '▪';
  if (bulletStyle === 'dash') return '–';
  if (bulletStyle === 'arrow') return '→';
  return '•';
};

export const exportToWord = async (data: Partial<ProfileFormData>, options: ExportOptions): Promise<void> => {
  try {
    const filename = options.filename || `cv-${Date.now()}.docx`;

    const customization: CVCustomizationOptions = options.customization ?? {
      layout: 'single-column',
      sidebarPosition: 'left',
      fontFamily: options.fontFamily,
      fontSize: 'medium',
      lineHeight: 'normal',
      primaryColor: options.colorScheme,
      secondaryColor: '#64748b',
      textColor: '#111827',
      backgroundColor: '#ffffff',
      accentColor: options.colorScheme,
      sectionOrder: ['summary', 'experience', 'education', 'skills', 'projects', 'references'],
      visibleSections: {
        photo: options.showPhoto,
        summary: true,
        experience: true,
        education: true,
        skills: true,
        languages: false,
        certifications: false,
        projects: false,
        references: true
      },
      sectionStyle: {
        headerStyle: 'underline',
        headerAlignment: 'left',
        headerCase: 'capitalize',
        spacing: 'normal'
      },
      dateFormat: 'Month YYYY',
      bulletStyle: 'disc',
      skillDisplay: 'tags',
      borderRadius: 'medium',
      shadow: 'none',
      margins: 'normal'
    };

    const primaryHex = normalizeHex(customization.primaryColor);
    const secondaryHex = normalizeHex(customization.secondaryColor);
    const fontName = extractFontName(customization.fontFamily);
    const titleAlignment = getAlignment(customization.sectionStyle.headerAlignment);

    const children: Paragraph[] = [];

    const fullName = `${data.firstName || 'First Name'} ${data.lastName || 'Last Name'}`.trim();
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: fullName,
            bold: true,
            size: 32,
            color: primaryHex,
            font: fontName
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 }
      })
    );

    if (data.jobTitle) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: data.jobTitle,
              size: 22,
              color: secondaryHex,
              font: fontName
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 }
        })
      );
    }

    if (data.email || data.phone || data.location) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: [data.email, data.phone, data.location].filter(Boolean).join(' | '),
              size: 20,
              font: fontName
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 260 }
        })
      );
    }

    const sectionHeading = (title: string) => {
      const text = getTitleCase(title, customization.sectionStyle.headerCase);
      const base = {
        children: [
          new TextRun({
            text,
            bold: true,
            size: 24,
            color: customization.sectionStyle.headerStyle === 'background' ? 'FFFFFF' : primaryHex,
            font: fontName
          })
        ],
        heading: HeadingLevel.HEADING_2,
        alignment: titleAlignment,
        spacing: { before: 200, after: 100 }
      } as const;

      if (customization.sectionStyle.headerStyle === 'underline') {
        return new Paragraph({
          ...base,
          border: {
            bottom: {
              style: BorderStyle.SINGLE,
              size: 6,
              color: primaryHex
            }
          }
        });
      }

      if (customization.sectionStyle.headerStyle === 'border-left') {
        return new Paragraph({
          ...base,
          border: {
            left: {
              style: BorderStyle.SINGLE,
              size: 12,
              color: primaryHex
            }
          }
        });
      }

      if (customization.sectionStyle.headerStyle === 'background') {
        return new Paragraph({
          ...base,
          shading: {
            type: ShadingType.CLEAR,
            fill: primaryHex,
            color: 'auto'
          }
        });
      }

      return new Paragraph(base);
    };

    const bulletChar = getBulletChar(customization.bulletStyle);

    const renderSummary = (): Paragraph[] => {
      if (!customization.visibleSections.summary || !data.bio) return [];
      return [
        sectionHeading('Professional Summary'),
        new Paragraph({
          children: [new TextRun({ text: data.bio, size: 20, font: fontName })],
          spacing: { after: 200 }
        })
      ];
    };

    const renderExperience = (): Paragraph[] => {
      if (!customization.visibleSections.experience || !data.workExperience?.length) return [];
      const paragraphs: Paragraph[] = [sectionHeading('Professional Experience')];

      data.workExperience.forEach((exp) => {
        const header = [exp.position, exp.company].filter(Boolean).join(' - ');
        if (!header) return;

        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: header, bold: true, size: 22, font: fontName })],
            spacing: { before: 100, after: 50 }
          })
        );

        const dateText = [
          formatDate(exp.startDate, false, customization.dateFormat),
          formatDate(exp.endDate, !!exp.current, customization.dateFormat)
        ].filter(Boolean).join(' - ');

        if (dateText) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: dateText, italics: true, size: 18, font: fontName })],
              spacing: { after: 50 }
            })
          );
        }

        if (exp.description) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: exp.description, size: 20, font: fontName })],
              spacing: { after: 80 }
            })
          );
        }

        exp.achievements?.filter((a) => a.trim()).forEach((achievement) => {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: `${bulletChar} ${achievement}`, size: 20, font: fontName })],
              spacing: { after: 40 }
            })
          );
        });

        paragraphs.push(new Paragraph({ children: [new TextRun({ text: '', size: 12, font: fontName })], spacing: { after: 140 } }));
      });

      return paragraphs;
    };

    const renderEducation = (): Paragraph[] => {
      if (!customization.visibleSections.education || !data.education?.length) return [];
      const paragraphs: Paragraph[] = [sectionHeading('Education')];

      data.education.forEach((edu) => {
        const degreeLine = [edu.degree, edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''].filter(Boolean).join(' ');
        const institution = edu.institution || '';
        if (!degreeLine && !institution) return;

        if (degreeLine) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: degreeLine, bold: true, size: 22, font: fontName })],
              spacing: { before: 80, after: 40 }
            })
          );
        }

        if (institution) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: institution, size: 20, font: fontName })],
              spacing: { after: 40 }
            })
          );
        }

        const dateText = [
          formatDate(edu.startDate, false, customization.dateFormat),
          formatDate(edu.endDate, !!edu.current, customization.dateFormat)
        ].filter(Boolean).join(' - ');

        if (dateText) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: dateText, italics: true, size: 18, font: fontName })],
              spacing: { after: 140 }
            })
          );
        } else {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: '', size: 12, font: fontName })], spacing: { after: 140 } }));
        }
      });

      return paragraphs;
    };

    const renderSkills = (): Paragraph[] => {
      if (!customization.visibleSections.skills) return [];
      const hasCore = !!data.technicalSkills?.length;
      const hasSoft = !!data.softSkills?.length;
      if (!hasCore && !hasSoft) return [];

      const paragraphs: Paragraph[] = [sectionHeading('Skills')];

      if (hasCore) {
        const items = data.technicalSkills!.filter((s) => s.name.trim()).map((s) => `${s.name} (${s.level})`);
        if (items.length) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: 'Core Skills', bold: true, size: 22, font: fontName })], spacing: { before: 80, after: 40 } }));
          if (customization.skillDisplay === 'list') {
            items.forEach((t) => paragraphs.push(new Paragraph({ children: [new TextRun({ text: `${bulletChar} ${t}`, size: 20, font: fontName })], spacing: { after: 40 } })));
          } else {
            paragraphs.push(new Paragraph({ children: [new TextRun({ text: items.join(', '), size: 20, font: fontName })], spacing: { after: 120 } }));
          }
        }
      }

      if (hasSoft) {
        const items = data.softSkills!.filter((s) => s.trim());
        if (items.length) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: 'Soft Skills', bold: true, size: 22, font: fontName })], spacing: { before: 80, after: 40 } }));
          if (customization.skillDisplay === 'list') {
            items.forEach((t) => paragraphs.push(new Paragraph({ children: [new TextRun({ text: `${bulletChar} ${t}`, size: 20, font: fontName })], spacing: { after: 40 } })));
          } else {
            paragraphs.push(new Paragraph({ children: [new TextRun({ text: items.join(', '), size: 20, font: fontName })], spacing: { after: 120 } }));
          }
        }
      }

      return paragraphs;
    };

    const renderProjects = (): Paragraph[] => {
      if (!customization.visibleSections.projects || !data.projects?.length) return [];
      const paragraphs: Paragraph[] = [sectionHeading('Projects')];

      data.projects.forEach((project) => {
        if (!project.name) return;

        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: project.name, bold: true, size: 22, font: fontName })],
            spacing: { before: 80, after: 40 }
          })
        );

        if (project.technologies) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: project.technologies, size: 18, color: secondaryHex, font: fontName })],
              spacing: { after: 40 }
            })
          );
        }

        if (project.link) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: project.link, size: 18, font: fontName })],
              spacing: { after: 40 }
            })
          );
        }

        if (project.description) {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: project.description, size: 20, font: fontName })],
              spacing: { after: 120 }
            })
          );
        } else {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: '', size: 12, font: fontName })], spacing: { after: 120 } }));
        }
      });

      return paragraphs;
    };

    const renderReferences = (): Paragraph[] => {
      if (!customization.visibleSections.references || !data.references?.length) return [];
      const paragraphs: Paragraph[] = [sectionHeading('References')];

      data.references.forEach((ref) => {
        const meta = [ref.title, ref.company].filter(Boolean).join(' • ');
        const contact = [ref.email ? `Email: ${ref.email}` : '', ref.phone ? `Phone: ${ref.phone}` : ''].filter(Boolean).join(' • ');

        if (ref.name) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: ref.name, bold: true, size: 20, font: fontName })], spacing: { before: 80, after: 40 } }));
        }
        if (meta) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: meta, size: 18, color: secondaryHex, font: fontName })], spacing: { after: 40 } }));
        }
        if (ref.relationship) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: ref.relationship, italics: true, size: 18, font: fontName })], spacing: { after: 40 } }));
        }
        if (contact) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: contact, size: 18, font: fontName })], spacing: { after: 40 } }));
        }
        if (ref.recommendation) {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: `"${ref.recommendation}"`, size: 18, font: fontName })], spacing: { after: 140 } }));
        } else {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: '', size: 12, font: fontName })], spacing: { after: 140 } }));
        }
      });

      return paragraphs;
    };

    const renderByKey: Record<string, () => Paragraph[]> = {
      summary: renderSummary,
      experience: renderExperience,
      education: renderEducation,
      skills: renderSkills,
      projects: renderProjects,
      references: renderReferences
    };

    const sectionOrder = customization.sectionOrder?.length
      ? customization.sectionOrder
      : ['summary', 'experience', 'education', 'skills', 'projects', 'references'];

    sectionOrder.forEach((key) => {
      const render = renderByKey[key];
      if (!render) return;
      children.push(...render());
    });

    // Create the document
    const margin = getMarginTwips(customization.margins);
    const columnCount = customization.layout === 'two-column' ? 2 : 1;
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: margin, right: margin, bottom: margin, left: margin }
          },
          column: columnCount === 2 ? { count: 2, space: 720, equalWidth: true } : undefined
        },
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
