import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Enhanced markdown parser for better formatting
  const parseMarkdown = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    let key = 0;

    // Parse headers (# ## ###)
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;

    while ((match = headerRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          key: key++
        });
      }

      // Add the header
      const level = match[1].length;
      parts.push({
        type: 'header',
        content: match[2],
        level,
        key: key++
      });

      lastIndex = match.index + match[0].length;
    }

    // Parse italic text (single asterisks)
    const italicRegex = /\*(.*?)\*/g;
    let italicMatch;
    const italicParts = [];

    while ((italicMatch = italicRegex.exec(text)) !== null) {
      italicParts.push({
        start: italicMatch.index,
        end: italicMatch.index + italicMatch[0].length,
        content: italicMatch[1],
        type: 'italic'
      });
    }

    // Parse bullet points
    const bulletRegex = /^\s*[-*+]\s+(.+)$/gm;
    let bulletMatch;
    const bulletPoints = [];

    while ((bulletMatch = bulletRegex.exec(text)) !== null) {
      bulletPoints.push({
        start: bulletMatch.index,
        end: bulletMatch.index + bulletMatch[0].length,
        content: bulletMatch[1],
        type: 'bullet'
      });
    }

    // Parse numbered lists
    const numberRegex = /^\s*\d+\.\s+(.+)$/gm;
    let numberMatch;
    const numberedPoints = [];

    while ((numberMatch = numberRegex.exec(text)) !== null) {
      numberedPoints.push({
        start: numberMatch.index,
        end: numberMatch.index + numberMatch[0].length,
        content: numberMatch[1],
        type: 'numbered'
      });
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
        key: key++
      });
    }

    return { parts, italicParts, bulletPoints, numberedPoints };
  };

  const renderContent = (text: string) => {
    const { parts, italicParts, bulletPoints, numberedPoints } = parseMarkdown(text);
    const uniqueId = Date.now(); // Add timestamp for uniqueness

    return parts.map((part) => {
      if (part.type === 'header') {
        const headerSizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
        const headerColors = ['text-pink-400', 'text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400'];
        const level = part.level || 1;
        
        return (
          <h2
            key={`${part.key}-${uniqueId}`}
            className={`font-bold ${headerSizes[level - 1]} ${headerColors[level - 1]} mb-4 mt-6`}
          >
            {part.content}
          </h2>
        );
      }

      if (part.type === 'text') {
        let content = part.content;
        let elements = [];
        let lastIndex = 0;

        // Sort all formatting parts by start position
        const allFormats = [
          ...italicParts.map((p: any) => ({ ...p, tag: 'em' })),
          ...bulletPoints.map((p: any) => ({ ...p, tag: 'bullet' })),
          ...numberedPoints.map((p: any) => ({ ...p, tag: 'numbered' }))
        ].sort((a, b) => a.start - b.start);

        allFormats.forEach((format, index) => {
          // Add text before this format
          if (format.start > lastIndex) {
            const textBefore = content.slice(lastIndex, format.start);
            elements.push(...textBefore.split('\n').map((line, i) => (
              <React.Fragment key={`${part.key}-${uniqueId}-text-${i}`}>
                {line}
                {i < textBefore.split('\n').length - 1 && <br />}
              </React.Fragment>
            )));
          }

          // Add the formatted content
          if (format.tag === 'bullet') {
            elements.push(
              <div key={`${part.key}-${uniqueId}-bullet-${index}`} className="flex items-start mb-2">
                <span className="text-pink-400 mr-2 mt-1">•</span>
                <span className="text-slate-300">{format.content}</span>
              </div>
            );
          } else if (format.tag === 'numbered') {
            elements.push(
              <div key={`${part.key}-${uniqueId}-numbered-${index}`} className="flex items-start mb-2">
                <span className="text-blue-400 mr-2 mt-1 font-semibold">1.</span>
                <span className="text-slate-300">{format.content}</span>
              </div>
            );
          } else if (format.tag === 'em') {
            elements.push(
              <em
                key={`${part.key}-${uniqueId}-italic-${index}`}
                className="italic text-slate-200"
              >
                {format.content}
              </em>
            );
          }

          lastIndex = format.end;
        });

        // Add remaining text
        if (lastIndex < content.length) {
          const remainingText = content.slice(lastIndex);
          elements.push(...remainingText.split('\n').map((line, i) => (
            <React.Fragment key={`${part.key}-${uniqueId}-remaining-${i}`}>
              {line}
              {i < remainingText.split('\n').length - 1 && <br />}
            </React.Fragment>
          )));
        }

        return <React.Fragment key={`${part.key}-${uniqueId}`}>{elements}</React.Fragment>;
      }

      return null;
    });
  };

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <div className="text-slate-300 leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.7' }}>
        {renderContent(content)}
      </div>
    </div>
  );
};
