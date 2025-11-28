import type { ModelInfo, Provider } from './models';
import type { Settings as SettingsType } from './settings';

declare global {
  var Settings: {
    getSettings: () => Promise<SettingsType>;
    saveSettings: (settings: SettingsType) => Promise<void>;
    Models: Record<Provider, ModelInfo[]>;
  };
}

export {};
