import { useChat } from '@ai-sdk/react';
import type { UIMessage, UIMessageChunk } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

type PromptAPI = {
  getPromptLabel: () => Promise<string>;
  streamChat: (
    messages: UIMessage[],
    callbacks: {
      onChunk: (chunk: UIMessageChunk) => void;
      onDone: () => void;
      onError: (error: string) => void;
    },
  ) => () => void;
};

declare global {
  var promptAPI: PromptAPI;
  var logger: {
    info: (message: string) => void;
    debug: (message: string) => void;
    error: (message: string) => void;
  };
}

function Message({ message }: { message: UIMessage }) {
  const textParts = message.parts.filter((part) => part.type === 'text');
  const hasEmptyText = textParts.some(
    (part) => 'text' in part && part.text === '',
  );
  const textContent = textParts
    .map((part) => ('text' in part ? part.text : ''))
    .join('');

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={twMerge(
        'flex max-w-[80%] flex-col transition-opacity duration-200',
        isUser && 'self-end',
        isAssistant && 'self-start',
      )}
    >
      <div
        className={twMerge(
          'rounded-2xl px-4 py-3 leading-6 wrap-break-word whitespace-pre-wrap',
          isUser && 'rounded-br-sm bg-blue-500/20',
          isAssistant && 'rounded-bl-sm bg-white/10',
        )}
      >
        {hasEmptyText ? (
          <span className="inline-block animate-pulse text-white/60">●</span>
        ) : (
          textContent
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [label, setLabel] = useState<string>('');
  const [input, setInput] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    transport: {
      sendMessages: async ({ messages: uiMessages, abortSignal }) => {
        logger.info(`sendMessages called with ${uiMessages.length} messages`);

        return new ReadableStream<UIMessageChunk>({
          start(controller) {
            if (abortSignal !== undefined && abortSignal.aborted) {
              logger.debug('ReadableStream aborted before start');
              controller.close();
              return;
            }

            logger.debug('ReadableStream started');
            const abortStream = promptAPI.streamChat(uiMessages, {
              onChunk: (chunk) => {
                logger.debug(
                  `onChunk: type=${chunk.type}, id=${'id' in chunk ? chunk.id : 'N/A'}`,
                );
                controller.enqueue(chunk);
              },
              onDone: () => {
                logger.debug('onDone called');
                controller.close();
              },
              onError: (error) => {
                logger.error(`onError: ${error}`);
                controller.enqueue({
                  type: 'error',
                  errorText: error,
                });
                controller.close();
              },
            });

            abortSignal?.addEventListener('abort', () => {
              logger.debug('ReadableStream aborted');
              abortStream();
              controller.close();
            });
          },
          cancel() {
            logger.debug('ReadableStream cancelled');
          },
        });
      },
      reconnectToStream: async () => {
        return null;
      },
    },
    onError: (error) => {
      logger.error(
        `useChat error: ${error.message} (${error.stack?.split('\n')[1].trim()})`,
      );
    },
  });

  useEffect(() => {
    logger.debug(`Status changed: ${status}`);
  }, [status]);

  useEffect(() => {
    async function init(): Promise<void> {
      const promptLabel = await promptAPI.getPromptLabel();
      setLabel(promptLabel);
      document.title = promptLabel;
    }

    void init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const messagesElements = useMemo(
    () =>
      messages.map((message) => <Message key={message.id} message={message} />),
    [messages],
  );

  return (
    <div className="flex h-full flex-col">
      <h1 className="shrink-0 border-b border-white/10 p-4 text-xl font-semibold">
        {label}
      </h1>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {messagesElements}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (status === 'streaming') {
            void stop();
          } else if (input.trim() !== '') {
            void sendMessage({ text: input.trim() });
            setInput('');
          }
        }}
        className="shrink-0 border-t border-white/10 p-4"
      >
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                form?.requestSubmit();
              }
            }}
            placeholder="Type your message..."
            disabled={status === 'streaming' || status === 'submitted'}
            rows={input.split('\n').length}
            className="max-h-60 flex-1 resize-none overflow-y-auto rounded-3xl border border-white/20 bg-white/5 px-4 py-3 text-[0.95rem] transition-[border-color] duration-200 outline-none focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-3xl border-none bg-blue-500/30 px-6 py-3 text-[0.95rem] font-medium transition-[background] duration-200 hover:bg-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500/30"
          >
            {status === 'streaming' ? 'Stop' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
