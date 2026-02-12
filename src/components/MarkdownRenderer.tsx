import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses inline markdown (bold, italic, inline code) within a line of text.
 */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  // Match: **bold**, *italic*, `code`
  const inlineRegex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      elements.push(
        <React.Fragment key={`${keyPrefix}-t-${lastIndex}`}>
          {text.slice(lastIndex, match.index)}
        </React.Fragment>
      );
    }

    if (match[2]) {
      // **bold**
      elements.push(
        <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-white">
          {match[2]}
        </strong>
      );
    } else if (match[4]) {
      // *italic*
      elements.push(
        <em key={`${keyPrefix}-i-${match.index}`} className="italic text-slate-200">
          {match[4]}
        </em>
      );
    } else if (match[6]) {
      // `inline code`
      elements.push(
        <code
          key={`${keyPrefix}-c-${match.index}`}
          className="px-1.5 py-0.5 bg-slate-700 text-pink-300 rounded text-sm font-mono"
        >
          {match[6]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key={`${keyPrefix}-t-${lastIndex}`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return elements.length > 0 ? elements : [<React.Fragment key={keyPrefix}>{text}</React.Fragment>];
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const renderContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let listCounter = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // --- Fenced code block ---
      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        elements.push(
          <pre
            key={`code-${i}`}
            className="bg-slate-900 border border-slate-700 rounded-lg p-4 my-3 overflow-x-auto"
          >
            <code className="text-sm font-mono text-green-300 whitespace-pre">
              {codeLines.join('\n')}
            </code>
          </pre>
        );
        continue;
      }

      // --- Headers ---
      const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const headerContent = headerMatch[2];
        const sizes = ['text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
        const colors = ['text-pink-400', 'text-purple-400', 'text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400'];
        const Tag = `h${level}` as keyof JSX.IntrinsicElements;

        elements.push(
          <Tag
            key={`h-${i}`}
            className={`font-bold ${sizes[level - 1]} ${colors[level - 1]} mb-3 mt-5`}
          >
            {renderInline(headerContent, `h-${i}`)}
          </Tag>
        );
        listCounter = 0;
        i++;
        continue;
      }

      // --- Bullet list item ---
      const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bulletMatch) {
        listCounter = 0;
        elements.push(
          <div key={`bl-${i}`} className="flex items-start mb-1.5 ml-1">
            <span className="text-pink-400 mr-2.5 mt-0.5 text-sm">•</span>
            <span className="text-slate-300">{renderInline(bulletMatch[1], `bl-${i}`)}</span>
          </div>
        );
        i++;
        continue;
      }

      // --- Numbered list item ---
      const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (numberMatch) {
        listCounter++;
        elements.push(
          <div key={`nl-${i}`} className="flex items-start mb-1.5 ml-1">
            <span className="text-blue-400 mr-2.5 mt-0.5 font-semibold text-sm min-w-[1.25rem]">
              {listCounter}.
            </span>
            <span className="text-slate-300">{renderInline(numberMatch[2], `nl-${i}`)}</span>
          </div>
        );
        i++;
        continue;
      }

      // --- Horizontal rule ---
      if (/^[-*_]{3,}$/.test(trimmed)) {
        elements.push(
          <hr key={`hr-${i}`} className="border-slate-700 my-4" />
        );
        listCounter = 0;
        i++;
        continue;
      }

      // --- Empty line (paragraph break) ---
      if (trimmed === '') {
        elements.push(<div key={`br-${i}`} className="h-3" />);
        listCounter = 0;
        i++;
        continue;
      }

      // --- Regular paragraph ---
      listCounter = 0;
      elements.push(
        <p key={`p-${i}`} className="text-slate-300 mb-2">
          {renderInline(trimmed, `p-${i}`)}
        </p>
      );
      i++;
    }

    return elements;
  };

  return (
    <div className={`prose prose-invert max-w-none ${className}`}>
      <div className="leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.7' }}>
        {renderContent(content)}
      </div>
    </div>
  );
};
