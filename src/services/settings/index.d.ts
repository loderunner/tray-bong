import type { ModelInfo, Provider, ProviderSettings } from './main';

type SettingsFile = {
  version: number;
  currentProvider: Provider;
  openai: { model: string; apiKey: string; ollamaEndpoint?: string };
  anthropic: { model: string; apiKey: string; ollamaEndpoint?: string };
  google: { model: string; apiKey: string; ollamaEndpoint?: string };
  ollama: { model: string; apiKey: string; ollamaEndpoint?: string };
};

declare global {
  var Settings: {
    getSettings: () => Promise<ProviderSettings>;
    getAllSettings: () => Promise<SettingsFile>;
    saveSettings: (settings: ProviderSettings) => Promise<void>;
    PROVIDER_MODELS: Record<Provider, ModelInfo[]>;
  };
}

export {};
