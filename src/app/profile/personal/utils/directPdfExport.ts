import { ProfileFormData } from '../profile.schema';

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'docx';
  template?: string;
  colorScheme?: string;
  fontFamily?: string;
  showPhoto?: boolean;
}

export const downloadPDFDirectly = async (elementId: string, options: ExportOptions): Promise<void> => {
  try {
    // Dynamic imports to avoid SSR issues
    const jsPDF = (await import('jspdf')).default;
    const html2canvas = (await import('html2canvas')).default;
    
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('CV element not found');
    }

    // Show loading state
    const originalDisplay = element.style.display;
    
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '210mm';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.appendChild(clonedElement);
    document.body.appendChild(tempContainer);

    // Apply print-specific styles to the cloned element
    clonedElement.style.width = '210mm';
    clonedElement.style.padding = '20mm';
    clonedElement.style.margin = '0';
    clonedElement.style.boxShadow = 'none';
    clonedElement.style.border = 'none';
    clonedElement.style.backgroundColor = 'white';
    
    // Convert oklch colors to hex for html2canvas compatibility
    const convertOklchColors = (element: HTMLElement) => {
      // First, set a white background on the main element
      element.style.backgroundColor = '#ffffff';
      
      const allElements = element.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        
        // Get inline styles and replace oklch
        const inlineStyle = htmlEl.getAttribute('style');
        if (inlineStyle && inlineStyle.includes('oklch')) {
          let newStyle = inlineStyle;
          // Replace common oklch patterns with hex colors
          newStyle = newStyle.replace(/oklch\([^)]+\)/g, (match) => {
            if (match.includes('0.98') || match.includes('0.99')) return '#ffffff';
            if (match.includes('0.96')) return '#f9fafb';
            if (match.includes('0.89')) return '#e5e7eb';
            if (match.includes('0.71')) return '#6b7280';
            if (match.includes('0.45')) return '#374151';
            if (match.includes('0.23')) return '#111827';
            if (match.includes('0.15')) return '#0f172a';
            if (match.includes('262')) return '#2563eb';
            if (match.includes('308')) return '#9333ea';
            return '#000000';
          });
          htmlEl.setAttribute('style', newStyle);
        }
        
        const computedStyle = window.getComputedStyle(htmlEl);
        
        // Check and convert color properties
        const colorProperties = [
          'backgroundColor',
          'color',
          'borderColor',
          'borderTopColor',
          'borderRightColor',
          'borderBottomColor',
          'borderLeftColor'
        ];
        
        colorProperties.forEach(prop => {
          const value = computedStyle[prop as any];
          if (value && value.includes('oklch')) {
            // Convert oklch to fallback colors based on common Tailwind values
            let fallbackColor = '#000000';
            
            if (prop.includes('background')) {
              // Background colors
              if (value.includes('0.98') || value.includes('0.99')) {
                fallbackColor = '#ffffff'; // white
              } else if (value.includes('0.96')) {
                fallbackColor = '#f9fafb'; // gray-50
              } else if (value.includes('0.89')) {
                fallbackColor = '#e5e7eb'; // gray-200
              } else if (value.includes('0.1') || value.includes('0.15')) {
                fallbackColor = '#0f172a'; // slate-900
              } else if (value.includes('0.2')) {
                fallbackColor = '#1e293b'; // slate-800
              } else {
                fallbackColor = '#ffffff'; // default to white
              }
            } else {
              // Text colors
              if (value.includes('0.98') || value.includes('0.96')) {
                fallbackColor = '#f9fafb'; // light text
              } else if (value.includes('0.71') || value.includes('0.58')) {
                fallbackColor = '#6b7280'; // gray-500
              } else if (value.includes('0.45') || value.includes('0.32')) {
                fallbackColor = '#374151'; // gray-700
              } else if (value.includes('0.23') || value.includes('0.15')) {
                fallbackColor = '#111827'; // gray-900
              } else if (value.includes('262')) {
                fallbackColor = '#2563eb'; // blue
              } else if (value.includes('308')) {
                fallbackColor = '#9333ea'; // purple
              } else {
                fallbackColor = '#000000'; // default to black
              }
            }
            
            // Apply the fallback color
            htmlEl.style[prop as any] = fallbackColor;
          }
        });
        
        // Ensure text is visible
        if (computedStyle.color === 'transparent' || computedStyle.color === 'rgba(0, 0, 0, 0)') {
          htmlEl.style.color = '#000000';
        }
        
        // Remove shadows for cleaner PDF
        htmlEl.style.boxShadow = 'none';
        
        // Handle Tailwind classes that might use oklch
        const classList = htmlEl.className;
        if (classList) {
          // Background classes
          if (classList.includes('bg-slate-')) {
            if (classList.includes('bg-slate-950')) htmlEl.style.backgroundColor = '#020617';
            else if (classList.includes('bg-slate-900')) htmlEl.style.backgroundColor = '#0f172a';
            else if (classList.includes('bg-slate-800')) htmlEl.style.backgroundColor = '#1e293b';
            else if (classList.includes('bg-slate-700')) htmlEl.style.backgroundColor = '#334155';
            else if (classList.includes('bg-slate-600')) htmlEl.style.backgroundColor = '#475569';
            else if (classList.includes('bg-slate-500')) htmlEl.style.backgroundColor = '#64748b';
            else if (classList.includes('bg-slate-400')) htmlEl.style.backgroundColor = '#94a3b8';
            else if (classList.includes('bg-slate-300')) htmlEl.style.backgroundColor = '#cbd5e1';
            else if (classList.includes('bg-slate-200')) htmlEl.style.backgroundColor = '#e2e8f0';
            else if (classList.includes('bg-slate-100')) htmlEl.style.backgroundColor = '#f1f5f9';
            else if (classList.includes('bg-slate-50')) htmlEl.style.backgroundColor = '#f8fafc';
          }
          
          // Text classes
          if (classList.includes('text-slate-')) {
            if (classList.includes('text-slate-950')) htmlEl.style.color = '#020617';
            else if (classList.includes('text-slate-900')) htmlEl.style.color = '#0f172a';
            else if (classList.includes('text-slate-800')) htmlEl.style.color = '#1e293b';
            else if (classList.includes('text-slate-700')) htmlEl.style.color = '#334155';
            else if (classList.includes('text-slate-600')) htmlEl.style.color = '#475569';
            else if (classList.includes('text-slate-500')) htmlEl.style.color = '#64748b';
            else if (classList.includes('text-slate-400')) htmlEl.style.color = '#94a3b8';
            else if (classList.includes('text-slate-300')) htmlEl.style.color = '#cbd5e1';
            else if (classList.includes('text-slate-200')) htmlEl.style.color = '#e2e8f0';
            else if (classList.includes('text-slate-100')) htmlEl.style.color = '#f1f5f9';
            else if (classList.includes('text-slate-50')) htmlEl.style.color = '#f8fafc';
          }
          
          // Common color classes
          if (classList.includes('text-white')) htmlEl.style.color = '#ffffff';
          if (classList.includes('text-black')) htmlEl.style.color = '#000000';
          if (classList.includes('bg-white')) htmlEl.style.backgroundColor = '#ffffff';
          if (classList.includes('bg-black')) htmlEl.style.backgroundColor = '#000000';
          if (classList.includes('bg-transparent')) htmlEl.style.backgroundColor = 'transparent';
        }
      });
    };
    
    convertOklchColors(clonedElement);

    // Additional safety: remove all style attributes that might contain oklch
    const allStyleElements = clonedElement.querySelectorAll('[style]');
    allStyleElements.forEach(el => {
      const style = el.getAttribute('style');
      if (style && style.includes('oklch')) {
        // Remove the problematic style completely
        el.removeAttribute('style');
      }
    });

    let canvas;
    try {
      // Generate canvas from the cloned element
      canvas = await html2canvas(clonedElement, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: 1123, // A4 height in pixels at 96 DPI
        ignoreElements: (element) => {
          // Ignore any element that might still have oklch colors
          const style = window.getComputedStyle(element);
          return style.backgroundColor?.includes('oklch') || 
                 style.color?.includes('oklch') || 
                 false;
        }
      });
    } catch (canvasError) {
      console.error('html2canvas error:', canvasError);
      // Fallback: try with simpler options
      canvas = await html2canvas(clonedElement, {
        scale: 1,
        backgroundColor: '#ffffff',
        logging: false
      });
    }

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add image to PDF, handling multiple pages if needed
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download the PDF
    const filename = options.filename || `CV_${Date.now()}.pdf`;
    pdf.save(filename);

    return Promise.resolve();
  } catch (error) {
    console.error('Detailed PDF generation error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error; // Throw the original error for better debugging
  }
};

// Alternative method using just jsPDF without html2canvas for better text quality
export const generatePDFFromData = async (data: Partial<ProfileFormData>, options: ExportOptions): Promise<void> => {
  // Dynamic import to avoid SSR issues
  const jsPDF = (await import('jspdf')).default;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 7;
  let yPosition = margin;

  // Helper function to add text with word wrap
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    
    const lines = pdf.splitTextToSize(text, pageWidth - 2 * margin);
    
    lines.forEach((line: string) => {
      if (yPosition + lineHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += lineHeight;
    });
  };

  // Add name as header
  const name = `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Your Name';
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(name, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 12;

  // Add contact info
  const contactInfo = [];
  if (data.email) contactInfo.push(data.email);
  if (data.phone) contactInfo.push(data.phone);
  if (data.location) contactInfo.push(data.location);
  
  if (contactInfo.length > 0) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(contactInfo.join(' • '), pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Add job title
  if (data.jobTitle) {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(data.jobTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  }

  // Add a line separator
  pdf.setLineWidth(0.5);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Add Professional Summary
  if (data.bio) {
    addText('PROFESSIONAL SUMMARY', 14, true);
    yPosition += 5;
    addText(data.bio, 11, false);
    yPosition += 10;
  }

  // Add Work Experience
  if (data.workExperience && data.workExperience.length > 0) {
    addText('WORK EXPERIENCE', 14, true);
    yPosition += 5;
    
    data.workExperience.forEach((exp: any) => {
      if (exp.position || exp.company) {
        addText(`${exp.position || 'Position'} at ${exp.company || 'Company'}`, 12, true);
        yPosition += 3;
        
        if (exp.startDate || exp.endDate) {
          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
          const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '');
          if (startDate || endDate) {
            addText(`${startDate} - ${endDate}`, 10, false);
            yPosition += 3;
          }
        }
        
        if (exp.description) {
          addText(exp.description, 11, false);
          yPosition += 3;
        }
        
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement: string) => {
            if (achievement) {
              addText(`• ${achievement}`, 11, false);
              yPosition += 2;
            }
          });
        }
        
        yPosition += 5;
      }
    });
  }

  // Add Education
  if (data.education && data.education.length > 0) {
    addText('EDUCATION', 14, true);
    yPosition += 5;
    
    data.education.forEach((edu: any) => {
      if (edu.degree || edu.institution) {
        addText(`${edu.degree || 'Degree'}${edu.fieldOfStudy ? ' in ' + edu.fieldOfStudy : ''}`, 12, true);
        yPosition += 3;
        
        if (edu.institution) {
          addText(edu.institution, 11, false);
          yPosition += 3;
        }
        
        if (edu.startDate || edu.endDate) {
          const startDate = edu.startDate ? new Date(edu.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
          const endDate = edu.current ? 'Present' : (edu.endDate ? new Date(edu.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '');
          if (startDate || endDate) {
            addText(`${startDate} - ${endDate}`, 10, false);
            yPosition += 3;
          }
        }
        
        yPosition += 5;
      }
    });
  }

  // Add Skills
  if ((data.technicalSkills && data.technicalSkills.length > 0) || (data.softSkills && data.softSkills.length > 0)) {
    addText('SKILLS', 14, true);
    yPosition += 5;
    
    if (data.technicalSkills && data.technicalSkills.length > 0) {
      addText('Technical Skills:', 12, true);
      yPosition += 3;
      const techSkills = data.technicalSkills.map((skill: any) => `${skill.name} (${skill.level})`).join(', ');
      addText(techSkills, 11, false);
      yPosition += 5;
    }
    
    if (data.softSkills && data.softSkills.length > 0) {
      addText('Soft Skills:', 12, true);
      yPosition += 3;
      const softSkills = data.softSkills.join(', ');
      addText(softSkills, 11, false);
      yPosition += 5;
    }
  }

  // Save the PDF
  const filename = options.filename || `CV_${Date.now()}.pdf`;
  pdf.save(filename);
};
