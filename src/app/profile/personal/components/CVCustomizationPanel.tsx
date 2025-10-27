'use client';

import React, { useState } from 'react';
import { CVCustomizationOptions } from './CustomizableCVTemplate';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Palette, 
  Type, 
  Layout, 
  Eye, 
  EyeOff, 
  Move,
  Settings,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';

interface CVCustomizationPanelProps {
  customization: CVCustomizationOptions;
  onCustomizationChange: (customization: CVCustomizationOptions) => void;
}

export function CVCustomizationPanel({ 
  customization, 
  onCustomizationChange 
}: CVCustomizationPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    layout: true,
    typography: false,
    colors: false,
    sections: false,
    styling: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateCustomization = (updates: Partial<CVCustomizationOptions>) => {
    onCustomizationChange({ ...customization, ...updates });
  };

  const updateSectionStyle = (updates: Partial<CVCustomizationOptions['sectionStyle']>) => {
    onCustomizationChange({
      ...customization,
      sectionStyle: { ...customization.sectionStyle, ...updates }
    });
  };

  const updateVisibleSections = (section: keyof CVCustomizationOptions['visibleSections']) => {
    onCustomizationChange({
      ...customization,
      visibleSections: {
        ...customization.visibleSections,
        [section]: !customization.visibleSections[section]
      }
    });
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    updateCustomization({ sectionOrder: newOrder });
  };

  const moveSectionDown = (index: number) => {
    if (index === customization.sectionOrder.length - 1) return;
    const newOrder = [...customization.sectionOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    updateCustomization({ sectionOrder: newOrder });
  };

  // Preset color themes
  const colorThemes = [
    { name: 'Professional', primary: '#2563eb', secondary: '#64748b', text: '#1f2937', bg: '#ffffff', accent: '#3b82f6' },
    { name: 'Modern', primary: '#8b5cf6', secondary: '#6b7280', text: '#111827', bg: '#ffffff', accent: '#a78bfa' },
    { name: 'Elegant', primary: '#0f172a', secondary: '#475569', text: '#1e293b', bg: '#ffffff', accent: '#334155' },
    { name: 'Creative', primary: '#ec4899', secondary: '#f97316', text: '#18181b', bg: '#ffffff', accent: '#f472b6' },
    { name: 'Nature', primary: '#059669', secondary: '#84cc16', text: '#14532d', bg: '#ffffff', accent: '#10b981' },
  ];

  return (
    <div className="space-y-4 bg-slate-900 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="h-5 w-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">CV Customization</h3>
      </div>

      {/* Layout Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('layout')}
          className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Layout className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Layout</span>
          </div>
          {expandedSections.layout ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        
        {expandedSections.layout && (
          <div className="p-4 space-y-4 bg-slate-800/50">
            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Layout Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {['single-column', 'two-column', 'modern-sidebar'].map((layout) => (
                  <Button
                    key={layout}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ layout: layout as any })}
                    className={`border-slate-600 ${
                      customization.layout === layout 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {layout.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Button>
                ))}
              </div>
            </div>

            {customization.layout === 'modern-sidebar' && (
              <div>
                <Label className="text-sm text-slate-300 mb-2 block">Sidebar Position</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['left', 'right'].map((position) => (
                    <Button
                      key={position}
                      variant="outline"
                      size="sm"
                      onClick={() => updateCustomization({ sidebarPosition: position as any })}
                      className={`border-slate-600 ${
                        customization.sidebarPosition === position 
                          ? 'bg-blue-600 text-white border-blue-500' 
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {position.charAt(0).toUpperCase() + position.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Margins</Label>
              <div className="grid grid-cols-3 gap-2">
                {['narrow', 'normal', 'wide'].map((margin) => (
                  <Button
                    key={margin}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ margins: margin as any })}
                    className={`border-slate-600 ${
                      customization.margins === margin 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {margin.charAt(0).toUpperCase() + margin.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Typography Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('typography')}
          className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Typography</span>
          </div>
          {expandedSections.typography ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        
        {expandedSections.typography && (
          <div className="p-4 space-y-4 bg-slate-800/50">
            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Font Family</Label>
              <select
                value={customization.fontFamily}
                onChange={(e) => updateCustomization({ fontFamily: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="Calibri, sans-serif">Calibri</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
                <option value="'Segoe UI', sans-serif">Segoe UI</option>
              </select>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Font Size</Label>
              <div className="grid grid-cols-3 gap-2">
                {['small', 'medium', 'large'].map((size) => (
                  <Button
                    key={size}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ fontSize: size as any })}
                    className={`border-slate-600 ${
                      customization.fontSize === size 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Line Height</Label>
              <div className="grid grid-cols-3 gap-2">
                {['compact', 'normal', 'relaxed'].map((height) => (
                  <Button
                    key={height}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ lineHeight: height as any })}
                    className={`border-slate-600 ${
                      customization.lineHeight === height 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {height.charAt(0).toUpperCase() + height.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Colors Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('colors')}
          className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Colors</span>
          </div>
          {expandedSections.colors ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        
        {expandedSections.colors && (
          <div className="p-4 space-y-4 bg-slate-800/50">
            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Color Themes</Label>
              <div className="grid grid-cols-2 gap-2">
                {colorThemes.map((theme) => (
                  <Button
                    key={theme.name}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({
                      primaryColor: theme.primary,
                      secondaryColor: theme.secondary,
                      textColor: theme.text,
                      backgroundColor: theme.bg,
                      accentColor: theme.accent
                    })}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.secondary }} />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                      </div>
                      <span>{theme.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-300 mb-1 block">Primary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.primaryColor}
                    onChange={(e) => updateCustomization({ primaryColor: e.target.value })}
                    className="w-24 px-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-300 mb-1 block">Secondary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customization.secondaryColor}
                    onChange={(e) => updateCustomization({ secondaryColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.secondaryColor}
                    onChange={(e) => updateCustomization({ secondaryColor: e.target.value })}
                    className="w-24 px-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-300 mb-1 block">Text Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customization.textColor}
                    onChange={(e) => updateCustomization({ textColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.textColor}
                    onChange={(e) => updateCustomization({ textColor: e.target.value })}
                    className="w-24 px-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-slate-300 mb-1 block">Accent Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={customization.accentColor}
                    onChange={(e) => updateCustomization({ accentColor: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.accentColor}
                    onChange={(e) => updateCustomization({ accentColor: e.target.value })}
                    className="w-24 px-2 bg-slate-700 text-white rounded border border-slate-600 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sections Management */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('sections')}
          className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Move className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Sections</span>
          </div>
          {expandedSections.sections ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        
        {expandedSections.sections && (
          <div className="p-4 space-y-4 bg-slate-800/50">
            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Section Order</Label>
              <div className="space-y-2">
                {customization.sectionOrder.map((section, index) => (
                  <div key={section} className="flex items-center gap-2 p-2 bg-slate-700 rounded">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                        className="p-1 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="h-3 w-3 text-slate-300" />
                      </button>
                      <button
                        onClick={() => moveSectionDown(index)}
                        disabled={index === customization.sectionOrder.length - 1}
                        className="p-1 hover:bg-slate-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="h-3 w-3 text-slate-300" />
                      </button>
                    </div>
                    <span className="text-white text-sm flex-1">
                      {section.charAt(0).toUpperCase() + section.slice(1)}
                    </span>
                    <button
                      onClick={() => updateVisibleSections(section as any)}
                      className="p-1 hover:bg-slate-600 rounded"
                    >
                      {customization.visibleSections[section as keyof typeof customization.visibleSections] ? (
                        <Eye className="h-4 w-4 text-green-400" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Date Format</Label>
              <select
                value={customization.dateFormat}
                onChange={(e) => updateCustomization({ dateFormat: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="MM/YYYY">MM/YYYY</option>
                <option value="Month YYYY">Month YYYY</option>
                <option value="YYYY">YYYY</option>
              </select>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Skill Display</Label>
              <div className="grid grid-cols-2 gap-2">
                {['list', 'tags', 'bars', 'grid'].map((display) => (
                  <Button
                    key={display}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ skillDisplay: display as any })}
                    className={`border-slate-600 ${
                      customization.skillDisplay === display 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {display.charAt(0).toUpperCase() + display.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styling Section */}
      <div className="border border-slate-700 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('styling')}
          className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Styling</span>
          </div>
          {expandedSections.styling ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        
        {expandedSections.styling && (
          <div className="p-4 space-y-4 bg-slate-800/50">
            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Header Style</Label>
              <div className="grid grid-cols-2 gap-2">
                {['underline', 'background', 'border-left', 'minimal'].map((style) => (
                  <Button
                    key={style}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSectionStyle({ headerStyle: style as any })}
                    className={`border-slate-600 ${
                      customization.sectionStyle.headerStyle === style 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {style.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Header Alignment</Label>
              <div className="grid grid-cols-3 gap-2">
                {['left', 'center', 'right'].map((align) => (
                  <Button
                    key={align}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSectionStyle({ headerAlignment: align as any })}
                    className={`border-slate-600 ${
                      customization.sectionStyle.headerAlignment === align 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Header Case</Label>
              <div className="grid grid-cols-3 gap-2">
                {['uppercase', 'capitalize', 'normal'].map((textCase) => (
                  <Button
                    key={textCase}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSectionStyle({ headerCase: textCase as any })}
                    className={`border-slate-600 ${
                      customization.sectionStyle.headerCase === textCase 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {textCase.charAt(0).toUpperCase() + textCase.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Section Spacing</Label>
              <div className="grid grid-cols-3 gap-2">
                {['compact', 'normal', 'spacious'].map((spacing) => (
                  <Button
                    key={spacing}
                    variant="outline"
                    size="sm"
                    onClick={() => updateSectionStyle({ spacing: spacing as any })}
                    className={`border-slate-600 ${
                      customization.sectionStyle.spacing === spacing 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {spacing.charAt(0).toUpperCase() + spacing.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Border Radius</Label>
              <div className="grid grid-cols-4 gap-2">
                {['none', 'small', 'medium', 'large'].map((radius) => (
                  <Button
                    key={radius}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ borderRadius: radius as any })}
                    className={`border-slate-600 ${
                      customization.borderRadius === radius 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {radius.charAt(0).toUpperCase() + radius.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Shadow</Label>
              <div className="grid grid-cols-4 gap-2">
                {['none', 'small', 'medium', 'large'].map((shadow) => (
                  <Button
                    key={shadow}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ shadow: shadow as any })}
                    className={`border-slate-600 ${
                      customization.shadow === shadow 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {shadow.charAt(0).toUpperCase() + shadow.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm text-slate-300 mb-2 block">Bullet Style</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'disc', label: '• Disc' },
                  { value: 'circle', label: '○ Circle' },
                  { value: 'square', label: '▪ Square' },
                  { value: 'dash', label: '– Dash' },
                  { value: 'arrow', label: '→ Arrow' }
                ].map((bullet) => (
                  <Button
                    key={bullet.value}
                    variant="outline"
                    size="sm"
                    onClick={() => updateCustomization({ bulletStyle: bullet.value as any })}
                    className={`border-slate-600 ${
                      customization.bulletStyle === bullet.value 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {bullet.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CVCustomizationPanel;
