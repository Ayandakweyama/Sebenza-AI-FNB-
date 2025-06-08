"use client";

import React from "react";

type TemplateOption = {
  id: string;
  name: string;
  description: string;
  image: string;
};

interface CustomizationPanelProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

const templates: TemplateOption[] = [
  {
    id: "professional",
    name: "Professional",
    description: "Clean and traditional design perfect for corporate roles",
    image: "/templates/professional.png",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Sleek design with a contemporary look for all industries",
    image: "/templates/modern.png",
  },
  {
    id: "creative",
    name: "Creative",
    description: "Bold design for creative professionals and designers",
    image: "/templates/creative.png",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Simple and clean layout that focuses on your content",
    image: "/templates/minimal.png",
  },
];

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  selectedTemplate,
  onSelectTemplate,
}) => {
  return (
    <div className="w-full">
      <h2 className="text-xl font-bold text-slate-100 mb-4">Choose a Template</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template.id)}
            className={`cursor-pointer border-2 rounded-xl p-4 transition duration-300 shadow-xl bg-slate-800 hover:scale-105 ${
              selectedTemplate === template.id
                ? "border-yellow-400"
                : "border-transparent"
            }`}
          >
            <img
              src={template.image}
              alt={template.name}
              className="w-full h-40 object-cover rounded-lg mb-3"
            />
            <h3 className="text-lg font-semibold text-white">
              {template.name}
            </h3>
            <p className="text-sm text-slate-300">{template.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomizationPanel;
