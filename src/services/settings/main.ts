import fs from 'node:fs/promises';
import path from 'node:path';

import { app, safeStorage } from 'electron';
import { z } from 'zod';

import { useLogger } from '@/services/logger/useLogger';

const CURRENT_VERSION = 1;

export type Provider = 'openai' | 'anthropic' | 'google' | 'ollama';

export type ModelInfo = {
  id: string;
  displayName: string;
};

export const PROVIDER_MODELS: Record<Provider, ModelInfo[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-5', displayName: 'Claude Sonnet 4.5' },
    { id: 'claude-opus-4-1', displayName: 'Claude Opus 4.1' },
    { id: 'claude-haiku-4-5', displayName: 'Claude Haiku 4.5' },
  ],
  openai: [
    { id: 'gpt-5.1', displayName: 'GPT-5.1' },
    { id: 'gpt-5-mini', displayName: 'GPT-5 mini' },
    { id: 'gpt-5-nano', displayName: 'GPT-5 nano' },
    { id: 'gpt-5-pro', displayName: 'GPT-5 pro' },
    { id: 'gpt-5', displayName: 'GPT-5' },
    { id: 'gpt-4.1', displayName: 'GPT-4.1' },
  ],
  google: [
    { id: 'gemini-3-pro', displayName: 'Gemini 3 Pro' },
    { id: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro' },
    { id: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash' },
  ],
  ollama: [],
};

const ProviderSettingsSchema = z.object({
  model: z.string(),
  apiKey: z.string(), // encrypted
  ollamaEndpoint: z.string().optional(),
});

const SettingsFileSchema = z.object({
  version: z.number(),
  currentProvider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  providers: z.record(
    z.enum(['openai', 'anthropic', 'google', 'ollama']),
    ProviderSettingsSchema,
  ),
});
type SettingsFile = z.infer<typeof SettingsFileSchema>;

export type ProviderSettings = {
  provider: Provider;
  model: string;
  apiKey: string;
  ollamaEndpoint?: string;
};

export function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'userData', 'settings.json');
}

function getDefaultProviderSettings(
  provider: Provider,
): z.infer<typeof ProviderSettingsSchema> {
  const models = PROVIDER_MODELS[provider];
  const defaultModel = models.length > 0 ? models[0].id : '';
  return {
    model: defaultModel,
    apiKey: encryptAPIKey(''),
    ollamaEndpoint: provider === 'ollama' ? 'http://localhost:11434' : undefined,
  };
}

function getDefaultSettings(): SettingsFile {
  return {
    version: CURRENT_VERSION,
    currentProvider: 'anthropic',
    providers: {
      anthropic: getDefaultProviderSettings('anthropic'),
      openai: getDefaultProviderSettings('openai'),
      google: getDefaultProviderSettings('google'),
      ollama: getDefaultProviderSettings('ollama'),
    },
  };
}

function encryptAPIKey(apiKey: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // If encryption is not available, store in plaintext
    return apiKey;
  }
  return safeStorage.encryptString(apiKey).toString('base64');
}

function decryptAPIKey(storedAPIKey: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    // If encryption is not available, assume it's stored in plaintext
    return storedAPIKey;
  }
  // Try to decrypt - if it fails, assume it's plaintext (for backwards compatibility)
  try {
    const buffer = Buffer.from(storedAPIKey, 'base64');
    return safeStorage.decryptString(buffer);
  } catch {
    // If decryption fails, assume it's plaintext
    return storedAPIKey;
  }
}

function migrateSettings(data: unknown): SettingsFile {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid settings file format');
  }

  const version =
    'version' in data && typeof data.version === 'number' ? data.version : 0;

  if (version > CURRENT_VERSION) {
    throw new Error(`Unsupported settings file version: ${version}`);
  }

  // Migrate from old format (single provider) to new format (per-provider)
  if (
    version < CURRENT_VERSION ||
    ('provider' in data && !('currentProvider' in data))
  ) {
    const oldData = data as {
      provider?: Provider;
      model?: string;
      apiKey?: string;
      ollamaEndpoint?: string;
    };
      const provider = oldData.provider ?? 'anthropic';
      const defaultSettings = getDefaultSettings();
      const defaultProviderSettings = getDefaultProviderSettings(provider);
      return {
        version: CURRENT_VERSION,
        currentProvider: provider,
        providers: {
          ...defaultSettings.providers,
          [provider]: {
            model: oldData.model ?? defaultProviderSettings.model,
            apiKey: oldData.apiKey ?? defaultProviderSettings.apiKey,
            ollamaEndpoint:
              oldData.ollamaEndpoint ?? defaultProviderSettings.ollamaEndpoint,
          },
        },
      };
  }

  return SettingsFileSchema.parse(data);
}

async function loadSettingsFile(): Promise<SettingsFile> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    return migrateSettings(parsed);
  } catch (error) {
    // If validation or migration fails, recreate default file
    logger.error(
      `Failed to load settings file: ${error instanceof Error ? error.message : String(error)}`,
    );
    const defaultSettings = getDefaultSettings();
    await fs.writeFile(filePath, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
}

export async function loadSettings(): Promise<ProviderSettings> {
  const settingsFile = await loadSettingsFile();
  const currentProviderSettings =
    settingsFile.providers[settingsFile.currentProvider] ??
    getDefaultProviderSettings(settingsFile.currentProvider);
  return {
    provider: settingsFile.currentProvider,
    model: currentProviderSettings.model,
    apiKey: decryptAPIKey(currentProviderSettings.apiKey),
    ollamaEndpoint: currentProviderSettings.ollamaEndpoint,
  };
}

export async function loadSettingsForProvider(
  provider: Provider,
): Promise<Omit<ProviderSettings, 'provider'>> {
  const settingsFile = await loadSettingsFile();
  const providerSettings =
    settingsFile.providers[provider] ?? getDefaultProviderSettings(provider);
  return {
    model: providerSettings.model,
    apiKey: decryptAPIKey(providerSettings.apiKey),
    ollamaEndpoint: providerSettings.ollamaEndpoint,
  };
}

export async function saveSettings(settings: ProviderSettings): Promise<void> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  // Load existing settings to preserve other providers
  let existingSettings: SettingsFile;
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    existingSettings = migrateSettings(parsed);
  } catch {
    // If loading fails, use defaults
    existingSettings = getDefaultSettings();
  }

  // Update the current provider's settings
  const encryptedApiKey = encryptAPIKey(settings.apiKey);
  const updatedSettings: SettingsFile = {
    version: CURRENT_VERSION,
    currentProvider: settings.provider,
    providers: {
      ...existingSettings.providers,
      [settings.provider]: {
        model: settings.model,
        apiKey: encryptedApiKey,
        ollamaEndpoint: settings.ollamaEndpoint,
      },
    },
  };

  await fs.writeFile(filePath, JSON.stringify(updatedSettings, null, 2));
}
