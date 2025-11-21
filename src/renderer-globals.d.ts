/**
 * Global type declarations for renderer processes only.
 * These APIs are exposed via the context bridge and should NOT be available
 * in main process or preload script contexts.
 */

import type { UIMessage, UIMessageChunk } from 'ai';

import type { SystemPrompt } from './services/prompts/main';
import type {
  ModelInfo,
  Provider,
  ProviderSettings,
} from './services/settings/main';

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

  var logger: {
    error: (message: string) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
  };

  var Prompts: {
    listPrompts: () => Promise<SystemPrompt[]>;
    revealPromptsFile: () => Promise<void>;
  };

  var Settings: {
    getSettings: () => Promise<ProviderSettings>;
    saveSettings: (settings: ProviderSettings) => Promise<void>;
    PROVIDER_MODELS: Record<Provider, ModelInfo[]>;
  };

  var PromptWindow: {
    getPromptInfo: () => Promise<{ label: string; systemPrompt: string }>;
    getSFSymbol: (symbolName: string) => Promise<string | null>;
    copyToClipboard: (text: string) => Promise<void>;
  };
}

export {};
