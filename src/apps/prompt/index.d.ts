import type { Conversation } from '@/services/conversations/conversation';

declare global {
  var PromptWindow: {
    getPromptInfo: () => Promise<Conversation>;
    getSFSymbol: (symbolName: string) => Promise<string | null>;
    copyToClipboard: (text: string) => Promise<void>;
    startDrag: (mouseX: number, mouseY: number) => void;
    dragMove: (x: number, y: number) => void;
    endDrag: () => void;
  };
}

export {};
