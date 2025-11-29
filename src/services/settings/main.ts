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

import { createZodJSON } from '@/zod-json';

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

const settingsJSON = createZodJSON({
  version: 1,
  schema: SettingsFileSchema,
  default: getDefaultSettings,
});

export async function loadSettings(): Promise<Settings> {
  return settingsJSON.load(getSettingsFilePath());
}

export async function saveSettings(settings: Settings): Promise<void> {
  await settingsJSON.save(settings, getSettingsFilePath());
}
