import { ProfileFormData } from '../profile.schema';

export interface ExportOptions {
  filename?: string;
  format: 'pdf' | 'docx';
  template: 'Professional' | 'Modern' | 'Creative' | 'Minimalist' | 'Executive';
  colorScheme: string;
  fontFamily: string;
  showPhoto: boolean;
}

// Alternative PDF export using data-driven HTML generation with download
export const exportToPDFDirect = async (data: Partial<ProfileFormData>, options: ExportOptions): Promise<void> => {
  try {
    // Generate a clean HTML version of the CV
    const htmlContent = generateCleanHTML(data, options);
    
    // Create a Blob from the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary iframe to render and print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    // Load the content
    iframe.onload = () => {
      setTimeout(() => {
        // Focus and print
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      }, 500);
    };
    
    iframe.src = url;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

// Generate clean HTML without oklch colors
function generateCleanHTML(data: Partial<ProfileFormData>, options: ExportOptions): string {
  const name = `${data.firstName || 'First Name'} ${data.lastName || 'Last Name'}`;
  const colorHex = options.colorScheme || '#2563eb';
  
  let experienceHTML = '';
  if (data.workExperience && data.workExperience.length > 0) {
    experienceHTML = `
      <section class="section">
        <h2>Professional Experience</h2>
        ${data.workExperience.map(exp => {
          if (!exp.position || !exp.company) return '';
          const startDate = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '';
          const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : '');
          
          return `
            <div class="experience-item">
              <h3>${exp.position} - ${exp.company}</h3>
              ${startDate ? `<div class="date">${startDate} - ${endDate}</div>` : ''}
              ${exp.description ? `<p>${exp.description}</p>` : ''}
              ${exp.achievements && exp.achievements.length > 0 ? `
                <ul>
                  ${exp.achievements.filter(a => a.trim()).map(achievement => `<li>${achievement}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `;
        }).join('')}
      </section>
    `;
  }
  
  let educationHTML = '';
  if (data.education && data.education.length > 0) {
    educationHTML = `
      <section class="section">
        <h2>Education</h2>
        ${data.education.map(edu => {
          if (!edu.degree || !edu.institution) return '';
          const degreeText = edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : edu.degree;
          const startYear = edu.startDate ? new Date(edu.startDate).getFullYear() : '';
          const endYear = edu.current ? 'Present' : (edu.endDate ? new Date(edu.endDate).getFullYear() : '');
          
          return `
            <div class="education-item">
              <h3>${degreeText}</h3>
              <p>${edu.institution}</p>
              ${startYear ? `<div class="date">${startYear} - ${endYear}</div>` : ''}
            </div>
          `;
        }).join('')}
      </section>
    `;
  }
  
  let skillsHTML = '';
  if ((data.technicalSkills && data.technicalSkills.length > 0) || (data.softSkills && data.softSkills.length > 0)) {
    skillsHTML = `
      <section class="section">
        <h2>Skills</h2>
        ${data.technicalSkills && data.technicalSkills.length > 0 ? `
          <div>
            <h3>Technical Skills</h3>
            <div class="skills-container">
              ${data.technicalSkills.filter(s => s.name && s.name.trim()).map(skill => 
                `<span class="skill-badge">${skill.name} (${skill.level || 'Intermediate'})</span>`
              ).join('')}
            </div>
          </div>
        ` : ''}
        ${data.softSkills && data.softSkills.length > 0 ? `
          <div style="margin-top: 10px;">
            <h3>Soft Skills</h3>
            <div class="skills-container">
              ${data.softSkills.filter(s => s && s.trim()).map(skill => 
                `<span class="skill-badge">${skill}</span>`
              ).join('')}
            </div>
          </div>
        ` : ''}
      </section>
    `;
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${name} - CV</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: white;
            padding: 20mm;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #e5e7eb;
          }
          
          h1 { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 8px;
            color: #111827;
          }
          
          h2 { 
            font-size: 18px; 
            font-weight: bold; 
            margin-top: 20px;
            margin-bottom: 10px;
            color: ${colorHex};
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 4px;
          }
          
          h3 { 
            font-size: 14px; 
            font-weight: bold; 
            margin-top: 12px;
            margin-bottom: 4px;
            color: #374151;
          }
          
          p { 
            margin-bottom: 8px;
            color: #4b5563;
          }
          
          ul {
            margin-left: 20px;
            margin-bottom: 8px;
          }
          
          li {
            margin-bottom: 4px;
            color: #4b5563;
          }
          
          .contact-info {
            font-size: 12px;
            color: #6b7280;
            margin-top: 8px;
          }
          
          .job-title {
            font-size: 16px;
            color: #4b5563;
            margin-top: 4px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .experience-item,
          .education-item {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .date {
            font-size: 11px;
            color: #9ca3af;
            font-style: italic;
          }
          
          .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }
          
          .skill-badge {
            background: #f3f4f6;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            color: #374151;
            display: inline-block;
          }
          
          @media print {
            body {
              padding: 15mm;
            }
            
            @page {
              size: A4;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${name}</h1>
          ${data.jobTitle ? `<div class="job-title">${data.jobTitle}</div>` : ''}
          <div class="contact-info">
            ${[data.email, data.phone, data.location].filter(Boolean).join(' | ')}
          </div>
        </div>
        
        ${data.bio ? `
          <section class="section">
            <h2>Professional Summary</h2>
            <p>${data.bio}</p>
          </section>
        ` : ''}
        
        ${experienceHTML}
        ${educationHTML}
        ${skillsHTML}
      </body>
    </html>
  `;
}

// Browser Print Method (Most Reliable)
export const exportUsingBrowserPrint = (elementId: string, options: ExportOptions): void => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('CV element not found');
    }

    // Clone the element and prepare it for printing
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Remove any elements that shouldn't be printed
    const noPrintElements = clonedElement.querySelectorAll('.no-print, .export-buttons, .cv-preview-controls');
    noPrintElements.forEach(el => el.remove());

    // Build the print document with proper filename hint
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>CV - ${options.filename || 'Resume'}</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              background: white;
              padding: 20mm;
            }
            
            h1 { 
              font-size: 28px; 
              font-weight: bold; 
              margin-bottom: 8px;
              color: #111827;
            }
            
            h2 { 
              font-size: 18px; 
              font-weight: bold; 
              margin-top: 20px;
              margin-bottom: 10px;
              color: ${options.colorScheme || '#2563eb'};
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 4px;
            }
            
            h3 { 
              font-size: 14px; 
              font-weight: bold; 
              margin-top: 12px;
              margin-bottom: 4px;
              color: #374151;
            }
            
            p { 
              margin-bottom: 8px;
              color: #4b5563;
            }
            
            ul {
              margin-left: 20px;
              margin-bottom: 8px;
            }
            
            li {
              margin-bottom: 4px;
              color: #4b5563;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #e5e7eb;
            }
            
            .contact-info {
              font-size: 12px;
              color: #6b7280;
              margin-top: 8px;
            }
            
            .job-title {
              font-size: 16px;
              color: #4b5563;
              margin-top: 4px;
            }
            
            .section {
              margin-bottom: 25px;
            }
            
            .experience-item,
            .education-item {
              margin-bottom: 20px;
            }
            
            .date {
              font-size: 11px;
              color: #9ca3af;
              font-style: italic;
            }
            
            .skills-container {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 8px;
            }
            
            .skill-badge {
              background: #f3f4f6;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 12px;
              color: #374151;
            }
            
            /* Ensure colors print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            @media print {
              body {
                padding: 15mm;
              }
              
              .pagebreak {
                page-break-before: always;
              }
              
              h2 {
                page-break-after: avoid;
              }
              
              .experience-item,
              .education-item {
                page-break-inside: avoid;
              }
            }
            
            /* Override any oklch colors with hex */
            .text-white { color: #ffffff !important; }
            .text-gray-900 { color: #111827 !important; }
            .text-gray-800 { color: #1f2937 !important; }
            .text-gray-700 { color: #374151 !important; }
            .text-gray-600 { color: #4b5563 !important; }
            .text-gray-500 { color: #6b7280 !important; }
            .bg-white { background-color: #ffffff !important; }
            .bg-gray-100 { background-color: #f3f4f6 !important; }
            .bg-gray-200 { background-color: #e5e7eb !important; }
          </style>
        </head>
        <body>
          ${clonedElement.innerHTML}
        </body>
      </html>
    `;

    // Create a Blob and trigger download through iframe
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 1000);
      }, 500);
    };
    
    iframe.src = url;
  } catch (error) {
    console.error('Error preparing print:', error);
    throw new Error('Failed to prepare document for printing. Please try again.');
  }
};
