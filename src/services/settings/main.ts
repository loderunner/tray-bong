import fs from 'node:fs/promises';
import path from 'node:path';

import { app, safeStorage } from 'electron';
import { z } from 'zod';

import { useLogger } from '@/services/logger/useLogger';

const CURRENT_VERSION = 2;

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

const SettingsFileSchemaV2 = z.object({
  version: z.literal(2),
  currentProvider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  providers: z.record(
    z.enum(['openai', 'anthropic', 'google', 'ollama']),
    ProviderSettingsSchema,
  ),
});

const SettingsFileSchemaV1 = z.object({
  version: z.literal(1),
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  model: z.string(),
  apiKey: z.string(), // encrypted
  ollamaEndpoint: z.string().optional(),
});

type SettingsFileV2 = z.infer<typeof SettingsFileSchemaV2>;
type SettingsFileV1 = z.infer<typeof SettingsFileSchemaV1>;

export type ProviderSettings = {
  provider: Provider;
  model: string;
  apiKey: string;
  ollamaEndpoint?: string;
};

export function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'userData', 'settings.json');
}

function getDefaultProviderSettings(provider: Provider): {
  model: string;
  apiKey: string;
  ollamaEndpoint?: string;
} {
  const models = PROVIDER_MODELS[provider];
  return {
    model: models.length > 0 ? models[0].id : '',
    apiKey: encryptAPIKey(''),
    ollamaEndpoint: provider === 'ollama' ? 'http://localhost:11434' : undefined,
  };
}

function getDefaultSettings(): SettingsFileV2 {
  const defaultProvider: Provider = 'anthropic';
  return {
    version: 2,
    currentProvider: defaultProvider,
    providers: {
      [defaultProvider]: getDefaultProviderSettings(defaultProvider),
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

function migrateSettings(data: unknown): SettingsFileV2 {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid settings file format');
  }

  const version =
    'version' in data && typeof data.version === 'number' ? data.version : 0;

  if (version > CURRENT_VERSION) {
    throw new Error(`Unsupported settings file version: ${version}`);
  }

  if (version === 1) {
    // Migrate from v1 (single provider) to v2 (per-provider)
    const v1Data = SettingsFileSchemaV1.parse(data);
    return {
      version: 2,
      currentProvider: v1Data.provider,
      providers: {
        [v1Data.provider]: {
          model: v1Data.model,
          apiKey: v1Data.apiKey,
          ollamaEndpoint: v1Data.ollamaEndpoint,
        },
      },
    };
  }

  if (version === 2) {
    return SettingsFileSchemaV2.parse(data);
  }

  // If version is 0 or unknown, return default
  return getDefaultSettings();
}

export async function loadSettings(): Promise<ProviderSettings> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    const migrated = migrateSettings(parsed);
    
    const providerSettings = migrated.providers[migrated.currentProvider];
    if (!providerSettings) {
      // Provider settings missing, use defaults
      const defaultSettings = getDefaultProviderSettings(migrated.currentProvider);
      migrated.providers[migrated.currentProvider] = defaultSettings;
      await fs.writeFile(filePath, JSON.stringify(migrated, null, 2));
      return {
        provider: migrated.currentProvider,
        model: defaultSettings.model,
        apiKey: decryptAPIKey(defaultSettings.apiKey),
        ollamaEndpoint: defaultSettings.ollamaEndpoint,
      };
    }

    return {
      provider: migrated.currentProvider,
      model: providerSettings.model,
      apiKey: decryptAPIKey(providerSettings.apiKey),
      ollamaEndpoint: providerSettings.ollamaEndpoint,
    };
  } catch (error) {
    // If validation or migration fails, recreate default file
    logger.error(
      `Failed to load settings file: ${error instanceof Error ? error.message : String(error)}`,
    );
    const defaultSettings = getDefaultSettings();
    await fs.writeFile(filePath, JSON.stringify(defaultSettings, null, 2));
    const providerSettings = defaultSettings.providers[defaultSettings.currentProvider];
    return {
      provider: defaultSettings.currentProvider,
      model: providerSettings.model,
      apiKey: decryptAPIKey(providerSettings.apiKey),
      ollamaEndpoint: providerSettings.ollamaEndpoint,
    };
  }
}

/**
 * Loads settings for a specific provider.
 * If settings don't exist for the provider, returns defaults.
 *
 * @param provider - The provider to load settings for
 * @returns Settings for the specified provider
 */
export async function loadProviderSettings(
  provider: Provider,
): Promise<Omit<ProviderSettings, 'provider'>> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    const migrated = migrateSettings(parsed);

    const providerSettings = migrated.providers[provider];
    if (providerSettings) {
      return {
        model: providerSettings.model,
        apiKey: decryptAPIKey(providerSettings.apiKey),
        ollamaEndpoint: providerSettings.ollamaEndpoint,
      };
    }
  } catch (error) {
    logger.debug(
      `Failed to load provider settings: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Return defaults if settings don't exist
  const defaults = getDefaultProviderSettings(provider);
  return {
    model: defaults.model,
    apiKey: decryptAPIKey(defaults.apiKey),
    ollamaEndpoint: defaults.ollamaEndpoint,
  };
}

export async function saveSettings(settings: ProviderSettings): Promise<void> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  let currentFile: SettingsFileV2;
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    currentFile = migrateSettings(parsed);
  } catch {
    // If file doesn't exist or is invalid, start with defaults
    currentFile = getDefaultSettings();
  }

  // Update or create settings for this provider
  const encryptedApiKey = encryptAPIKey(settings.apiKey);
  currentFile.providers[settings.provider] = {
    model: settings.model,
    apiKey: encryptedApiKey,
    ollamaEndpoint: settings.ollamaEndpoint,
  };
  
  // Update current provider
  currentFile.currentProvider = settings.provider;

  await fs.writeFile(filePath, JSON.stringify(currentFile, null, 2));
}
