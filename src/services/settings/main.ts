import fs from 'node:fs/promises';
import path from 'node:path';

import { app, safeStorage } from 'electron';
import { z } from 'zod';

import {
  Providers,
  anthropicModelIds,
  googleModelIds,
  openaiModelIds,
} from './models';
import { type Settings } from './settings';

import { useLogger } from '@/services/logger/useLogger';

const CURRENT_VERSION = 1;

const SecureStringSchema = z.codec(z.base64(), z.string(), {
  encode: (value) => encryptAPIKey(value),
  decode: (value) => decryptAPIKey(value),
});

const AnthropicOptionsSchema = z.object({
  model: z.enum(anthropicModelIds),
  apiKey: SecureStringSchema,
});

const OpenAIOptionsSchema = z.object({
  model: z.enum(openaiModelIds),
  apiKey: SecureStringSchema,
});

const GoogleOptionsSchema = z.object({
  model: z.enum(googleModelIds),
  apiKey: SecureStringSchema,
});

const OllamaOptionsSchema = z.object({
  model: z.string(),
  endpointURL: z.string(),
});

const SettingsFileSchema = z.object({
  version: z.number(),
  provider: z.enum(Providers),
  anthropic: AnthropicOptionsSchema,
  openai: OpenAIOptionsSchema,
  google: GoogleOptionsSchema,
  ollama: OllamaOptionsSchema,
}) satisfies z.ZodType<Settings>;

export function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'userData', 'settings.json');
}

function getDefaultSettings(): Settings {
  return {
    version: CURRENT_VERSION,
    provider: 'anthropic',
    anthropic: {
      model: 'claude-sonnet-4-5',
      apiKey: encryptAPIKey(''),
    },
    openai: {
      model: 'gpt-5.1',
      apiKey: encryptAPIKey(''),
    },
    google: {
      model: 'gemini-3-pro',
      apiKey: encryptAPIKey(''),
    },
    ollama: {
      model: '',
      endpointURL: 'http://localhost:11434',
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

function migrateSettings(data: unknown): Settings {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid settings file format');
  }

  if (!('version' in data) || typeof data.version !== 'number') {
    throw new Error('Invalid settings file format');
  }

  if (data.version > CURRENT_VERSION) {
    throw new Error(`Unsupported settings file version: ${data.version}`);
  }

  if (data.version < CURRENT_VERSION) {
    // Future migrations would go here
    // For now, if version is less than current, do nothing
  }

  return SettingsFileSchema.parse(data);
}

export async function loadSettings(): Promise<Settings> {
  const filePath = getSettingsFilePath();
  const logger = useLogger('Settings');

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    const migrated = migrateSettings(parsed);
    return migrated;
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

export async function saveSettings(settings: Settings): Promise<void> {
  const filePath = getSettingsFilePath();
  await fs.writeFile(
    filePath,
    JSON.stringify(SettingsFileSchema.encode(settings), null, 2),
  );
}
