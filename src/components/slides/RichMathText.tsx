import { KaTeX } from '../KaTeX';

interface RichMathTextProps {
  text: string;
  className?: string;
}

/**
 * Renders plain text with inline $...$ LaTeX segments via KaTeX.
 */
export function RichMathText({ text, className = '' }: RichMathTextProps) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
          return <KaTeX key={idx} math={part.slice(1, -1)} />;
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}
