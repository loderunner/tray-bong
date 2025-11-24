import type { Conversation } from './main';

declare global {
  var Conversations: {
    saveConversation: (conversation: Conversation) => Promise<void>;
  };
}

export {};
