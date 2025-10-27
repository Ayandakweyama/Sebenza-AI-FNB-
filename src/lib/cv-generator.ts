import type { FormData } from '@/types/cv';

export async function downloadCVAsPDF(formData: FormData, template: string) {
  try {
    // Use html2pdf or jsPDF for PDF generation
    const { default: html2pdf } = await import('html2pdf.js');

    const element = document.getElementById('cv-preview');
    if (!element) {
      throw new Error('CV preview element not found');
    }

    // Create a clean clone for PDF generation
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.id = 'cv-preview-pdf';

    // Force all gradients and complex styles to be compatible
    const allElements = clonedElement.querySelectorAll('*');
    allElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlEl);

      // Remove all styles that might contain unsupported color functions
      const allStyleProps = [
        'background', 'backgroundImage', 'backgroundColor',
        'color', 'borderColor', 'borderTopColor', 'borderRightColor',
        'borderBottomColor', 'borderLeftColor', 'outlineColor',
        'textDecorationColor', 'fill', 'stroke'
      ];

      allStyleProps.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && (value.includes('oklch') || value.includes('oklab') || value.includes('lch') || value.includes('lab'))) {
          // Force to a safe color
          htmlEl.style.setProperty(prop, '#000000', 'important');
        }
      });

      // Convert gradients to solid colors
      const backgroundImage = computedStyle.backgroundImage;
      if (backgroundImage && backgroundImage !== 'none') {
        // For gradient backgrounds, use a solid color approximation
        if (backgroundImage.includes('linear-gradient') || backgroundImage.includes('radial-gradient')) {
          if (backgroundImage.includes('#9333ea') || backgroundImage.includes('purple')) {
            htmlEl.style.background = '#9333ea';
          } else if (backgroundImage.includes('#2563eb') || backgroundImage.includes('blue')) {
            htmlEl.style.background = '#2563eb';
          } else if (backgroundImage.includes('#faf5ff') || backgroundImage.includes('#fdf2f8')) {
            htmlEl.style.background = '#faf5ff';
          } else {
            htmlEl.style.background = '#ffffff';
          }
          htmlEl.style.backgroundImage = 'none';
        }
      }

      // Force all text colors to be safe
      const color = computedStyle.color;
      if (color && (color.includes('oklch') || color.includes('oklab'))) {
        htmlEl.style.color = '#000000';
      }
    });

    // Append to body temporarily
    document.body.appendChild(clonedElement);

    const opt = {
      margin: 0.5,
      filename: `${formData.personalInfo.name.replace(/\s+/g, '_')}_CV.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        foreignObjectRendering: false,
        ignoreElements: (element: HTMLElement) => {
          // Skip elements that might cause issues
          return element.tagName === 'SCRIPT';
        },
        onclone: (clonedDoc: Document) => {
          // Additional cleanup in cloned document
          const clonedElements = clonedDoc.querySelectorAll('*');
          clonedElements.forEach(el => {
            // Remove any remaining complex CSS
            const style = el.getAttribute('style') || '';
            let cleanStyle = style;

            // Remove backdrop-filter (not supported by html2canvas)
            cleanStyle = cleanStyle.replace(/backdrop-filter:[^;]+;?/gi, '');
            cleanStyle = cleanStyle.replace(/-webkit-backdrop-filter:[^;]+;?/gi, '');

            // Remove clip-path (can cause issues)
            cleanStyle = cleanStyle.replace(/clip-path:[^;]+;?/gi, '');

            // Remove any remaining gradient references
            cleanStyle = cleanStyle.replace(/background-image:[^;]*linear-gradient[^;]*;?/gi, 'background-image: none;');
            cleanStyle = cleanStyle.replace(/background-image:[^;]*radial-gradient[^;]*;?/gi, 'background-image: none;');

            // Force all colors to be hex if they contain unsupported functions
            const colorProps = ['color', 'background-color', 'border-color', 'background'];
            colorProps.forEach(prop => {
              const regex = new RegExp(`${prop}:\\s*([^;]+);?`, 'gi');
              cleanStyle = cleanStyle.replace(regex, (match, value) => {
                if (value.includes('oklch') || value.includes('oklab') || value.includes('lch') || value.includes('lab')) {
                  return `${prop}: #000000;`;
                }
                return match;
              });
            });

            el.setAttribute('style', cleanStyle);
          });
        },
        css: {
          ignore: true
        }
      },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(clonedElement).save();
    } catch (pdfError) {
      console.warn('PDF generation failed, trying fallback with forced colors:', pdfError);

      // Fallback: Force all colors to black and white
      const fallbackElements = clonedElement.querySelectorAll('*');
      fallbackElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.color = '#000000 !important';
        htmlEl.style.backgroundColor = '#ffffff !important';
        htmlEl.style.borderColor = '#000000 !important';
        htmlEl.style.backgroundImage = 'none !important';
      });

      // Try again with forced monochrome
      const fallbackOpt = {
        ...opt,
        html2canvas: {
          ...opt.html2canvas,
          backgroundColor: '#ffffff'
        }
      };

      await html2pdf().set(fallbackOpt).from(clonedElement).save();
    }

    // Cleanup
    document.body.removeChild(clonedElement);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function downloadCVAsWord(formData: FormData, template: string) {
  try {
    // Use docx library for Word generation
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import('docx');
    
    const sections: any[] = [];
    
    // Header with name
    sections.push(
      new Paragraph({
        text: formData.personalInfo.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );
    
    // Contact info
    const contactInfo = [
      formData.personalInfo.email,
      formData.personalInfo.phone,
      formData.personalInfo.location
    ].filter(Boolean).join(' | ');
    
    sections.push(
      new Paragraph({
        text: contactInfo,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 }
      })
    );
    
    // Summary
    if (formData.personalInfo.summary) {
      sections.push(
        new Paragraph({
          text: 'Professional Summary',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
          text: formData.personalInfo.summary,
          spacing: { after: 300 }
        })
      );
    }
    
    // Experience
    if (formData.experience && formData.experience.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Work Experience',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 }
        })
      );
      
      formData.experience.forEach((exp) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: exp.position, bold: true }),
              new TextRun({ text: ` - ${exp.company}` })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: `${exp.duration} | ${exp.location}`,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: exp.description,
            spacing: { after: 200 }
          })
        );
        
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement) => {
            sections.push(
              new Paragraph({
                text: `• ${achievement}`,
                spacing: { after: 50 }
              })
            );
          });
        }
      });
    }
    
    // Education
    if (formData.education && formData.education.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Education',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );
      
      formData.education.forEach((edu) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: edu.degree, bold: true }),
              new TextRun({ text: ` - ${edu.institution}`, italics: true })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: `${edu.duration} | ${edu.location}`,
            spacing: { after: 100 }
          })
        );
        
        if (edu.gpa) {
          sections.push(
            new Paragraph({
              text: `GPA: ${edu.gpa}`,
              spacing: { after: 200 }
            })
          );
        }
      });
    }
    
    // Skills
    if (formData.skills && formData.skills.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Skills',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        }),
        new Paragraph({
          text: formData.skills.join(' • '),
          spacing: { after: 200 }
        })
      );
    }
    
    // Projects
    if (formData.projects && formData.projects.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Projects',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 }
        })
      );
      
      formData.projects.forEach((project) => {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({ text: project.name, bold: true })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: `Technologies: ${project.technologies}`,
            spacing: { after: 50 }
          }),
          new Paragraph({
            text: project.description,
            spacing: { after: 200 }
          })
        );
      });
    }
    
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
    link.download = `${formData.personalInfo.name.replace(/\s+/g, '_')}_CV.docx`;
    link.click();
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
}
