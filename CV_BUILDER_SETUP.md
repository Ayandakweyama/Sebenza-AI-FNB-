# CV Builder Setup Instructions

## 📦 Required Packages

To enable PDF and Word document downloads, you need to install these packages:

```bash
npm install html2pdf.js docx file-saver
npm install --save-dev @types/html2pdf.js
```

### Package Details:

1. **html2pdf.js** - Converts HTML to PDF
   - Purpose: Generate PDF from CV preview
   - Size: ~100KB
   - Browser-compatible

2. **docx** - Creates Word documents (.docx)
   - Purpose: Generate formatted Word documents
   - Full .docx file creation
   - Professional document structure

3. **file-saver** - Save files in browser
   - Purpose: Helper for downloading files
   - Cross-browser compatible

## 🎨 Features Implemented

### ✅ PDF Download
- Click "Download PDF" button
- High-quality PDF generation
- Preserves template styling
- File naming: `YourName_CV.pdf`

### ✅ Word Download
- Click "Download Word" button
- Professional .docx format
- ATS-friendly structure
- File naming: `YourName_CV.docx`

### ✅ Multiple Templates
Each template generates different styled CVs:

1. **Professional** - Traditional corporate design
2. **Modern** - Contemporary sleek look
3. **Creative** - Bold design for creatives
4. **Minimal** - Clean and simple

### ✅ Responsive Design
- Mobile: Forms stack vertically, preview toggleable
- Tablet: Side-by-side layout
- Desktop: Full split view

## 🚀 Usage

1. Navigate to `/cvbuilder`
2. Select a template
3. Fill in your information
4. Click "Download PDF" or "Download Word"
5. CV downloads automatically!

## 🎯 Features

- ✅ Real-time preview
- ✅ Multiple export formats (PDF & Word)
- ✅ 4 professional templates
- ✅ Dark theme matching project
- ✅ Mobile responsive
- ✅ Form validation
- ✅ Toast notifications
- ✅ Auto-save capability (can be added)

## 📝 Form Sections

1. **Personal Information**
   - Name, Email, Phone, Location
   - Professional Summary
   - Website, LinkedIn, GitHub

2. **Work Experience**
   - Company, Position, Duration
   - Location, Description
   - Key Achievements

3. **Education**
   - Institution, Degree
   - Duration, GPA, Location
   - Honors

4. **Skills**
   - Add/remove skills dynamically
   - Organized display

5. **Projects** (Optional)
   - Project name, Technologies
   - Description, Link

## 🔧 Technical Implementation

### PDF Generation Flow:
1. User fills form
2. Data renders in preview (HTML)
3. html2pdf.js converts HTML → Canvas → PDF
4. Browser downloads file

### Word Generation Flow:
1. User fills form
2. docx library creates Document object
3. Structured sections added programmatically
4. File packaged as .docx
5. Browser downloads file

## 🎨 Template Customization

Each template has unique styling in `CVPreview.tsx`:
- Professional: Traditional gray/black
- Modern: Slate tones
- Creative: Colorful gradients
- Minimal: Pure black & white

## 🐛 Troubleshooting

### PDF Download Issues:
- Ensure cv-preview element has id="cv-preview"
- Check browser console for errors
- Try on desktop (mobile has limitations)

### Word Download Issues:
- Ensure all required fields are filled
- Check console for docx errors
- Verify package is installed correctly

### Package Installation Issues:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm install html2pdf.js docx file-saver
```

## 🔮 Future Enhancements

- [ ] Save CV to database (Prisma)
- [ ] Load saved CVs
- [ ] AI-powered content suggestions
- [ ] ATS score checking
- [ ] More templates (10+ total)
- [ ] Custom color schemes
- [ ] LinkedIn import
- [ ] Email CV directly
- [ ] Share CV link

## 📚 Resources

- [html2pdf.js docs](https://ekoopmans.github.io/html2pdf.js/)
- [docx library](https://docx.js.org/)
- [CV best practices](https://www.indeed.com/career-advice/resumes-cover-letters)
