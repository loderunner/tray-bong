import type { ModelInfo, Provider, ProviderSettings } from './main';

declare global {
  var Settings: {
    getSettings: () => Promise<ProviderSettings>;
    getProviderSettings: (
      provider: Provider,
    ) => Promise<Omit<ProviderSettings, 'provider'>>;
    saveSettings: (settings: ProviderSettings) => Promise<void>;
    PROVIDER_MODELS: Record<Provider, ModelInfo[]>;
  };
}

export {};
