import type { UIMessageChunk } from 'ai';

export type StreamChatMessageData =
  | { chunk: UIMessageChunk }
  | { done: true }
  | { error: string };

export type StreamChatControlMessage = { abort: true };
