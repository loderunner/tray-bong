import type { ModelInfo, Provider, ProviderSettings } from './main';

declare global {
  var Settings: {
    getSettings: () => Promise<ProviderSettings>;
    saveSettings: (settings: ProviderSettings) => Promise<void>;
    PROVIDER_MODELS: Record<Provider, ModelInfo[]>;
  };
}

export {};
