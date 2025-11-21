import fs from 'node:fs/promises';
import path from 'node:path';

import { app, shell } from 'electron';
import { z } from 'zod';

const CURRENT_VERSION = 1;

const SystemPromptSchema = z.object({
  label: z.string(),
  prompt: z.string(),
});
export type SystemPrompt = z.infer<typeof SystemPromptSchema>;

const PromptsFileSchema = z.object({
  version: z.number(),
  prompts: z.array(SystemPromptSchema),
});
type PromptsFile = z.infer<typeof PromptsFileSchema>;

export function getPromptsFilePath(): string {
  return path.join(app.getPath('userData'), 'config', 'prompts.json');
}

function getDefaultPrompts(): PromptsFile {
  return {
    version: CURRENT_VERSION,
    prompts: [
      {
        label: 'Code Review',
        prompt:
          'Review this code for bugs, performance issues, and best practices.',
      },
      {
        label: 'Debug Help',
        prompt: 'Help me debug this issue. What could be causing this problem?',
      },
      {
        label: 'Explain Code',
        prompt: 'Explain what this code does in simple terms.',
      },
    ],
  };
}

function migratePrompts(data: unknown): PromptsFile {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid prompts file format');
  }

  const version =
    'version' in data && typeof data.version === 'number' ? data.version : 0;

  if (version > CURRENT_VERSION) {
    throw new Error(`Unsupported prompts file version: ${version}`);
  }

  if (version < CURRENT_VERSION) {
    // Future migrations would go here
    // For now, if version is less than current, do nothing
  }

  return PromptsFileSchema.parse(data);
}

export async function loadPrompts(): Promise<SystemPrompt[]> {
  const filePath = getPromptsFilePath();

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    const migrated = migratePrompts(parsed);
    return migrated.prompts;
  } catch (_error) {
    // If validation or migration fails, recreate default file
    const defaultPrompts = getDefaultPrompts();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultPrompts, null, 2));
    return defaultPrompts.prompts;
  }
}

export function revealPromptsFile(): void {
  const filePath = getPromptsFilePath();
  void shell.showItemInFolder(filePath);
}
