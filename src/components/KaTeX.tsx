import { useMemo } from 'react';
import katex from 'katex';

interface KaTeXProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export function KaTeX({ math, displayMode = false, className = '' }: KaTeXProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return math;
    }
  }, [math, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
