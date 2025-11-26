import fs from 'node:fs/promises';
import path from 'node:path';

import { validateUIMessages } from 'ai';
import { app } from 'electron';
import { uuidv7 } from 'uuidv7';
import { ZodError, z } from 'zod';

import { useLogger } from '@/services/logger/useLogger';

const CURRENT_VERSION = 1;

const UIMessagesSchema = z.array(z.looseObject({})).pipe(
  z.transform(async (messages, ctx) => {
    try {
      const logger = useLogger('Conversations');
      logger.debug(`Validating ${messages.length} messages`);
      const parsed = await validateUIMessages({ messages });
      return parsed;
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          ctx.issues.push(issue as z.core.$ZodRawIssue);
        }
      } else {
        ctx.issues.push({
          code: 'custom',
          message: error instanceof Error ? error.message : String(error),
          input: messages,
        });
      }
      return z.NEVER;
    }
  }),
);

const WindowBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const ConversationSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  title: z.string(),
  messages: UIMessagesSchema,
  windowBounds: WindowBoundsSchema.optional(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

const ConversationFileSchema = z.object({
  version: z.literal(CURRENT_VERSION),
  conversation: ConversationSchema,
});
type ConversationFile = z.infer<typeof ConversationFileSchema>;

export function getConversationsDirectory(): string {
  return path.join(app.getPath('userData'), 'userData', 'conversations');
}

function getConversationFilePath(id: string): string {
  return path.join(getConversationsDirectory(), `${id}.json`);
}

async function migrateConversation(data: unknown): Promise<ConversationFile> {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid conversation file format');
  }

  const version =
    'version' in data && typeof data.version === 'number' ? data.version : 0;

  if (version === 0) {
    throw new Error('Missing conversation file version');
  }

  if (version > CURRENT_VERSION) {
    throw new Error(`Unsupported conversation file version: ${version}`);
  }

  if (version < CURRENT_VERSION) {
    // Future migrations would go here
  }

  return ConversationFileSchema.parseAsync(data);
}

export async function saveConversation(
  conversation: Conversation,
): Promise<void> {
  const filePath = getConversationFilePath(conversation.id);
  const directory = getConversationsDirectory();

  await fs.mkdir(directory, { recursive: true });

  const file: ConversationFile = {
    version: CURRENT_VERSION,
    conversation: {
      ...conversation,
      updatedAt: Date.now(),
    },
  };

  await fs.writeFile(filePath, JSON.stringify(file, null, 2));
}

export async function loadConversation(id: string): Promise<Conversation> {
  const filePath = getConversationFilePath(id);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(fileContent);
    const migrated = await migrateConversation(parsed);
    return migrated.conversation;
  } catch (error) {
    throw new Error(
      `Failed to load conversation ${id}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export type ConversationMetadata = {
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string;
};

export async function listConversations(
  limit = 5,
  offset = 0,
): Promise<ConversationMetadata[]> {
  const directory = getConversationsDirectory();
  const logger = useLogger('Conversations');

  try {
    const files = await fs.readdir(directory);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    // Sort by filename (UUIDv7 = chronological)
    jsonFiles.sort().reverse();

    const metadata: ConversationMetadata[] = [];

    for (const file of jsonFiles.slice(offset, offset + limit)) {
      const filePath = path.join(directory, file);
      try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const parsed: unknown = JSON.parse(fileContent);
        const migrated = await migrateConversation(parsed);
        metadata.push({
          id: migrated.conversation.id,
          createdAt: migrated.conversation.createdAt,
          updatedAt: migrated.conversation.updatedAt,
          title: migrated.conversation.title,
        });
      } catch (error) {
        // Skip invalid files
        let message: string;
        if (error instanceof ZodError) {
          message = z.prettifyError(error);
        } else if (error instanceof Error) {
          message = error.message;
        } else {
          message = String(error);
        }
        logger.error(`Failed to load conversation ${filePath}: ${message}`);
        continue;
      }
    }

    return metadata;
  } catch (error) {
    // Directory doesn't exist yet, return empty array
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export function createConversationId(): string {
  return uuidv7();
}

