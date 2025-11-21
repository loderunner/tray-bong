declare global {
  var PromptWindow: {
    getPromptInfo: () => Promise<{ label: string; systemPrompt: string }>;
    getSFSymbol: (symbolName: string) => Promise<string | null>;
    copyToClipboard: (text: string) => Promise<void>;
  };
}

export {};
