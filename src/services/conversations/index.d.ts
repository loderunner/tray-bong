import type { Conversation, ConversationMetadata } from './main';

declare global {
  var Conversations: {
    saveConversation: (conversation: Conversation) => Promise<void>;
    listConversations: (
      limit: number,
      offset: number,
    ) => Promise<ConversationMetadata[]>;
  };
}

export {};
