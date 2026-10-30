import { useEffect, useRef, useState } from 'react';

const COPIED_FOR_MS = 2000;

export interface CopyState {
  copied: boolean;
  /** Writes the text to the clipboard and shows "copied" for two seconds. */
  copy: () => Promise<void>;
}

/** Copy-to-clipboard with the short confirmation the command boxes show. */
export function useCopy(text: string): CopyState {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
  };

  return { copied, copy };
}
