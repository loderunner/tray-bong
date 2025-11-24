import type { SystemPrompt } from './main';

declare global {
  var Prompts: {
    listPrompts: () => Promise<SystemPrompt[]>;
  };
}

export {};
