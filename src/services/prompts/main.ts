import path from 'node:path';

import { app } from 'electron';
import { z } from 'zod';

import type { SystemPrompt } from './prompt';

import { createZodJSON } from '@/zod-json';

const SystemPromptSchema = z.object({
  label: z.string(),
  prompt: z.string(),
}) satisfies z.ZodType<SystemPrompt>;

const PromptsFileSchema = z.object({
  prompts: z.array(SystemPromptSchema),
});

export function getPromptsFilePath(): string {
  return path.join(app.getPath('userData'), 'userData', 'prompts.json');
}

function getDefaultPrompts(): z.infer<typeof PromptsFileSchema> {
  return {
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

const promptsJSON = createZodJSON({
  version: 1,
  schema: PromptsFileSchema,
  default: getDefaultPrompts,
});

export async function loadPrompts(): Promise<SystemPrompt[]> {
  const filePath = getPromptsFilePath();
  const data = await promptsJSON.load(filePath);
  return data.prompts;
}
