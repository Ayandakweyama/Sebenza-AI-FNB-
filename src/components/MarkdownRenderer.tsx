import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Simple markdown parser for basic formatting
  const parseMarkdown = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    let key = 0;

    // Parse bold text (double asterisks)
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.slice(lastIndex, match.index),
          key: key++
        });
      }

      // Add the bold text
      parts.push({
        type: 'bold',
        content: match[1],
        key: key++
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex),
        key: key++
      });
    }

    return parts;
  };

  const renderContent = (text: string) => {
    const parts = parseMarkdown(text);

    return parts.map((part) => {
      if (part.type === 'bold') {
        return (
          <strong
            key={part.key}
            className="font-semibold text-white bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            {part.content}
          </strong>
        );
      }

      // Handle line breaks and paragraphs
      return part.content.split('\n\n').map((paragraph, pIndex) =>
        paragraph.split('\n').map((line, lIndex, lineArray) => (
          <React.Fragment key={`${part.key}-p${pIndex}-l${lIndex}`}>
            {line}
            {lIndex < lineArray.length - 1 && <br />}
          </React.Fragment>
        )).concat(pIndex < paragraph.split('\n\n').length - 1 ? [<br key={`${part.key}-br${pIndex}`} />, <br key={`${part.key}-br2${pIndex}`} />] : [])
      );
    });
  };

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <div className="text-slate-300 leading-relaxed" style={{ fontSize: '14px', lineHeight: '1.6' }}>
        {renderContent(content)}
      </div>
    </div>
  );
};
