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
  openai: ProviderSettingsSchema,
  anthropic: ProviderSettingsSchema,
  google: ProviderSettingsSchema,
  ollama: ProviderSettingsSchema,
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
    anthropic: getDefaultProviderSettings('anthropic'),
    openai: getDefaultProviderSettings('openai'),
    google: getDefaultProviderSettings('google'),
    ollama: getDefaultProviderSettings('ollama'),
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

async function loadSettingsFile(): Promise<SettingsFile> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    return SettingsFileSchema.parse(parsed);
  } catch (error) {
    // If validation fails, reset to defaults
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
  const currentProviderSettings = settingsFile[settingsFile.currentProvider];
  return {
    provider: settingsFile.currentProvider,
    model: currentProviderSettings.model,
    apiKey: decryptAPIKey(currentProviderSettings.apiKey),
    ollamaEndpoint: currentProviderSettings.ollamaEndpoint,
  };
}

export async function loadAllSettings(): Promise<SettingsFile> {
  return await loadSettingsFile();
}

export async function saveSettings(settings: ProviderSettings): Promise<void> {
  const filePath = getSettingsFilePath();
  const existingSettings = await loadSettingsFile();

  const encryptedApiKey = encryptAPIKey(settings.apiKey);
  const updatedSettings: SettingsFile = {
    ...existingSettings,
    version: CURRENT_VERSION,
    currentProvider: settings.provider,
    [settings.provider]: {
      model: settings.model,
      apiKey: encryptedApiKey,
      ollamaEndpoint: settings.ollamaEndpoint,
    },
  };

  await fs.writeFile(filePath, JSON.stringify(updatedSettings, null, 2));
}
