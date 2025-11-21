import fs from 'node:fs/promises';
import path from 'node:path';

import { app, safeStorage } from 'electron';
import { z } from 'zod';

import * as logger from '@/services/logger/main';

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

const SettingsFileSchema = z.object({
  version: z.number(),
  provider: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  model: z.string(),
  apiKey: z.string(), // encrypted
  ollamaEndpoint: z.string().optional(),
});
type SettingsFile = z.infer<typeof SettingsFileSchema>;

export type ProviderSettings = {
  provider: Provider;
  model: string;
  apiKey: string;
  ollamaEndpoint?: string;
};

export function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function getDefaultSettings(): SettingsFile {
  return {
    version: CURRENT_VERSION,
    provider: 'anthropic',
    model: PROVIDER_MODELS.anthropic[0].id,
    apiKey: encryptAPIKey(''),
    ollamaEndpoint: 'http://localhost:11434',
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

  if (version < CURRENT_VERSION) {
    // Future migrations would go here
    // For now, if version is less than current, do nothing
  }

  return SettingsFileSchema.parse(data);
}

export async function loadSettings(): Promise<ProviderSettings> {
  const filePath = getSettingsFilePath();

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    const migrated = migrateSettings(parsed);
    return {
      provider: migrated.provider,
      model: migrated.model,
      apiKey: decryptAPIKey(migrated.apiKey),
      ollamaEndpoint: migrated.ollamaEndpoint,
    };
  } catch (error) {
    // If validation or migration fails, recreate default file
    logger.error(
      `Failed to load settings file: ${error instanceof Error ? error.message : String(error)}`,
    );
    const defaultSettings = getDefaultSettings();
    await fs.writeFile(filePath, JSON.stringify(defaultSettings, null, 2));
    return {
      provider: defaultSettings.provider,
      model: defaultSettings.model,
      apiKey: decryptAPIKey(defaultSettings.apiKey),
      ollamaEndpoint: defaultSettings.ollamaEndpoint,
    };
  }
}

export async function saveSettings(settings: ProviderSettings): Promise<void> {
  const filePath = getSettingsFilePath();
  const encryptedApiKey = encryptAPIKey(settings.apiKey);
  const settingsFile: SettingsFile = {
    version: CURRENT_VERSION,
    provider: settings.provider,
    model: settings.model,
    apiKey: encryptedApiKey,
    ollamaEndpoint: settings.ollamaEndpoint,
  };
  await fs.writeFile(filePath, JSON.stringify(settingsFile, null, 2));
}
