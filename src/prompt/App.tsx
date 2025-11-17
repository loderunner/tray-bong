import { useEffect, useRef, useState } from 'react';

type PromptAPI = {
  getPromptLabel: () => Promise<string>;
};

declare global {
  interface Window {
    promptAPI: PromptAPI;
  }
}

export default function App() {
  const [label, setLabel] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function init(): Promise<void> {
      const promptLabel = await window.promptAPI.getPromptLabel();
      setLabel(promptLabel);
      document.title = promptLabel;
    }

    void init();
  }, []);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <>
      <h1>{label}</h1>
      <textarea ref={textareaRef} id="prompt-input" autoFocus />
    </>
  );
}
