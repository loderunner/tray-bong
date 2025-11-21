import type { UIMessage, UIMessageChunk } from 'ai';

declare global {
  var AI: {
    streamChat: (params: {
      messages: UIMessage[];
      onChunk: (chunk: UIMessageChunk) => void;
      onDone: () => void;
      onError: (error: string) => void;
    }) => () => void;
    generateText: (prompt: string) => Promise<string>;
  };
}

export {};
