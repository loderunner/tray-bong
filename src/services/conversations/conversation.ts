import type { UIMessage } from 'ai';

export type Conversation = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  messages: UIMessage[];
};

export type ConversationMetadata = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
};
