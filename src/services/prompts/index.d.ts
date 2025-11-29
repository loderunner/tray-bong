import type { SystemPrompt } from './prompt';

declare global {
  var Prompts: {
    listPrompts: () => Promise<SystemPrompt[]>;
  };
}

export {};
