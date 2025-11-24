import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
  type LanguageModel,
  type UIMessage,
  type UIMessageChunk,
  convertToModelMessages,
  generateText,
  pruneMessages,
  smoothStream,
  streamText,
} from 'ai';
import { createOllama } from 'ollama-ai-provider-v2';

import { useLogger } from '@/services/logger/useLogger';
import { loadSettings } from '@/services/settings/main';

/**
 * Gets the configured language model based on settings.
 *
 * @returns The configured language model
 */
export async function getModel(): Promise<LanguageModel> {
  const settings = await loadSettings();

  switch (settings.provider) {
    case 'openai': {
      const provider = createOpenAI({ apiKey: settings.apiKey });
      return provider(settings.model);
    }
    case 'anthropic': {
      const provider = createAnthropic({ apiKey: settings.apiKey });
      return provider(settings.model);
    }
    case 'google': {
      const provider = createGoogleGenerativeAI({ apiKey: settings.apiKey });
      return provider(settings.model);
    }
    case 'ollama': {
      const baseURL =
        settings.ollamaEndpoint !== undefined && settings.ollamaEndpoint !== ''
          ? `${settings.ollamaEndpoint}/api`
          : 'http://localhost:11434/api';
      const provider = createOllama({ baseURL });
      return provider(settings.model);
    }
  }
}

/**
 * Generates text from a prompt using the configured model.
 *
 * @param prompt - The prompt to generate text from
 * @returns The generated text
 */
export async function generateTextFromPrompt(prompt: string): Promise<string> {
  const logger = useLogger('AI');
  logger.info(`Generating text from prompt`);
  const model = await getModel();

  try {
    const result = await generateText({
      model,
      prompt,
    });

    const text = result.text.trim();
    logger.debug(`Generated text: ${text}`);
    return text;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error generating text: ${errorMessage}`);
    throw error;
  }
}

/**
 * Streams chat messages and returns an async generator of chunks.
 *
 * @param messages - The UI messages to stream
 * @param abortSignal - Optional abort signal to cancel the stream
 * @returns Async generator of UIMessageChunk
 */
export async function* streamChat(
  messages: UIMessage[],
  abortSignal?: AbortSignal,
): AsyncGenerator<UIMessageChunk, void, unknown> {
  const logger = useLogger('AI');
  logger.info(`Streaming chat starting`);

  const modelMessages = pruneMessages({
    messages: convertToModelMessages(messages),
    emptyMessages: 'remove',
    reasoning: 'before-last-message',
  });

  const model = await getModel();

  const result = streamText({
    model,
    messages: modelMessages,
    experimental_transform: smoothStream(),
    abortSignal,
  });

  const uiStream = result.toUIMessageStream({
    originalMessages: messages,
  });

  logger.info(`Starting stream, originalMessages count: ${messages.length}`);

  for await (const chunk of uiStream) {
    if (abortSignal !== undefined && abortSignal.aborted) {
      logger.debug('Stream aborted during iteration');
      break;
    }
    yield chunk;
  }

  if (abortSignal !== undefined && !abortSignal.aborted) {
    logger.info('Stream complete.');
  } else {
    logger.debug('Stream aborted, not sending done message');
  }
}
