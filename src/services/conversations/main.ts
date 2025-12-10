import fs from 'node:fs/promises';
import path from 'node:path';

import { validateUIMessages } from 'ai';
import { app } from 'electron';
import { uuidv7 } from 'uuidv7';
import { ZodError, z } from 'zod';
import { createZodJSON } from 'zod-file/json';

import type { Conversation, ConversationMetadata } from './conversation';

import { useLogger } from '@/services/logger/main';

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

const isoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});

const ConversationSchema = z.object({
  id: z.string(),
  createdAt: isoDatetimeToDate,
  updatedAt: isoDatetimeToDate,
  title: z.string(),
  messages: UIMessagesSchema,
}) satisfies z.ZodType<Conversation>;

const conversationJSON = createZodJSON({
  version: 1,
  schema: ConversationSchema,
});

export function getConversationsDirectory(): string {
  return path.join(app.getPath('userData'), 'userData', 'conversations');
}

function getConversationFilePath(id: string): string {
  return path.join(getConversationsDirectory(), `${id}.json`);
}

export async function saveConversation(
  conversation: Conversation,
): Promise<void> {
  const filePath = getConversationFilePath(conversation.id);
  const directory = getConversationsDirectory();

  await fs.mkdir(directory, { recursive: true });

  const updatedConversation: Conversation = {
    ...conversation,
    updatedAt: new Date(),
  };

  await conversationJSON.save(updatedConversation, filePath);
}

export async function loadConversation(id: string): Promise<Conversation> {
  const filePath = getConversationFilePath(id);
  return conversationJSON.load(filePath);
}

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
        const conversation = await conversationJSON.load(filePath);
        metadata.push({
          id: conversation.id,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          title: conversation.title,
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
