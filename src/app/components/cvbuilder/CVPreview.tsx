"use client";

import React from "react";

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
}

interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  duration: string;
  gpa: string;
}

interface FormData {
  personalInfo: PersonalInfo;
  experience: Experience[];
  education: Education[];
  skills: string[];
}

interface CVPreviewProps {
  formData: FormData;
  selectedTemplate: string;
}

// Define styles per template
const templateStyles = {
  professional: {
    wrapper: "bg-white text-gray-800",
    heading: "text-gray-900",
    sectionTitle: "text-gray-900 border-gray-300",
    pill: "bg-gray-100 text-gray-800",
  },
  modern: {
    wrapper: "bg-slate-100 text-slate-800",
    heading: "text-slate-900",
    sectionTitle: "text-slate-800 border-slate-400",
    pill: "bg-slate-300 text-slate-900",
  },
  creative: {
    wrapper: "bg-gradient-to-br from-indigo-700 to-pink-500 text-white",
    heading: "text-white",
    sectionTitle: "text-white border-white",
    pill: "bg-white text-indigo-700",
  },
  minimal: {
    wrapper: "bg-white text-black",
    heading: "text-black",
    sectionTitle: "text-black border-black",
    pill: "bg-black text-white",
  },
};

const CVPreview: React.FC<CVPreviewProps> = ({ formData, selectedTemplate }) => {
  const style = templateStyles[selectedTemplate as keyof typeof templateStyles] || templateStyles.professional;

  return (
    <div className={`${style.wrapper} rounded-xl shadow-2xl overflow-hidden h-[800px] overflow-y-auto`}>
      <div className="p-8">
        {/* Header */}
        <div className="border-b-2 pb-6 mb-6">
          <h1 className={`text-3xl font-bold mb-2 ${style.heading}`}>
            {formData.personalInfo.name || "Your Name"}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm">
            {formData.personalInfo.email && <span>{formData.personalInfo.email}</span>}
            {formData.personalInfo.phone && <span>{formData.personalInfo.phone}</span>}
            {formData.personalInfo.location && <span>{formData.personalInfo.location}</span>}
          </div>
        </div>

        {/* Summary */}
        {formData.personalInfo.summary && (
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-3 border-b pb-1 ${style.sectionTitle}`}>
              Professional Summary
            </h2>
            <p className="leading-relaxed">{formData.personalInfo.summary}</p>
          </div>
        )}

        {/* Experience */}
        {formData.experience.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-3 border-b pb-1 ${style.sectionTitle}`}>
              Work Experience
            </h2>
            {formData.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className={`font-semibold ${style.heading}`}>{exp.position || "Position"}</h3>
                    <p>{exp.company || "Company Name"}</p>
                  </div>
                  <span className="text-sm">{exp.duration}</span>
                </div>
                {exp.description && <p className="text-sm leading-relaxed">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {formData.education.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-3 border-b pb-1 ${style.sectionTitle}`}>
              Education
            </h2>
            {formData.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-semibold ${style.heading}`}>{edu.degree || "Degree"}</h3>
                    <p>{edu.institution || "Institution"}</p>
                    {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                  </div>
                  <span className="text-sm">{edu.duration}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {formData.skills.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-3 border-b pb-1 ${style.sectionTitle}`}>
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm ${style.pill}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVPreview;
