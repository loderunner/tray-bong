import type { Conversation } from '@/services/conversations/main';

declare global {
  var PromptWindow: {
    getPromptInfo: () => Promise<Conversation>;
    getSFSymbol: (symbolName: string) => Promise<string | null>;
    copyToClipboard: (text: string) => Promise<void>;
  };
  var Conversations: {
    saveConversation: (conversation: Conversation) => Promise<void>;
  };
}

export {};
