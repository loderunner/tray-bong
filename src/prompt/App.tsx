import { useChat } from '@ai-sdk/react';
import type { ChatStatus, UIMessage, UIMessageChunk } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { twMerge } from 'tailwind-merge';

type PromptAPI = {
  getPromptInfo: () => Promise<{ label: string; systemPrompt: string }>;
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

function Message({
  message,
  isLastMessage,
  status,
}: {
  message: UIMessage;
  isLastMessage: boolean;
  status: ChatStatus;
}) {
  const textParts = message.parts.filter((part) => part.type === 'text');
  const textContent = textParts
    .map((part) => ('text' in part ? part.text : ''))
    .join('');

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const hasEmptyText = textParts.some(
    (part) => 'text' in part && part.text === '',
  );
  const showActivityIndicator =
    isAssistant &&
    isLastMessage &&
    (status === 'submitted' || (status === 'streaming' && hasEmptyText));

  return (
    <div
      className={twMerge(
        'flex max-w-[80%] flex-col transition-opacity duration-200 no-app-drag',
        isUser && 'self-end',
        isAssistant && 'self-start',
      )}
    >
      <div
        className={twMerge(
          'rounded-2xl px-4 py-3 leading-6 wrap-break-word markdown-content',
          isUser && 'rounded-br-sm bg-blue-500/20',
          isAssistant && 'rounded-bl-sm bg-white/10',
          !showActivityIndicator && 'select-text',
        )}
      >
        {showActivityIndicator ? (
          <span className="inline-block animate-pulse text-white/60">●</span>
        ) : (
          <ReactMarkdown>{textContent}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [label, setLabel] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
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
                setStreamingError(error);
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
      logger.error(`useChat error: ${error.message}`);
      setStreamingError(error.message);
    },
  });

  useEffect(() => {
    logger.debug(`Status changed: ${status}`);
  }, [status]);

  useEffect(() => {
    async function init(): Promise<void> {
      const { label: promptLabel, systemPrompt: systemPromptText } =
        await promptAPI.getPromptInfo();
      setLabel(promptLabel);
      setSystemPrompt(systemPromptText);
      document.title = promptLabel;

      // Initialize chat with system prompt as first message
      if (systemPromptText.trim() !== '') {
        setMessages([
          {
            id: 'system',
            role: 'system',
            parts: [{ type: 'text', text: systemPromptText }],
          },
        ]);
      }
    }

    void init();
  }, [setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const messagesElements = useMemo(() => {
    const visibleMessages = messages.filter(
      (message) => message.role !== 'system',
    );
    const elements = visibleMessages.map((message, index) => (
      <Message
        key={message.id}
        message={message}
        isLastMessage={index === visibleMessages.length - 1}
        status={status}
      />
    ));
    if (
      status === 'submitted' &&
      visibleMessages.length > 0 &&
      visibleMessages[visibleMessages.length - 1]?.role === 'user'
    ) {
      elements.push(
        <Message
          message={{
            id: 'placeholder',
            role: 'assistant',
            parts: [{ type: 'text', text: '' }],
          }}
          isLastMessage={true}
          status={status}
        />,
      );
    }

    return elements;
  }, [messages, status]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-white/10 p-4">
        <h1 className="w-fit text-xl font-semibold no-app-drag">{label}</h1>
        {systemPrompt.trim() !== '' && (
          <button
            type="button"
            onClick={() => {
              setShowSystemPrompt(!showSystemPrompt);
            }}
            className={twMerge(
              'mt-1 block text-left text-xs transition-colors no-app-drag',
              !showSystemPrompt &&
                'max-w-1/2 overflow-hidden text-ellipsis whitespace-nowrap text-black/30 hover:text-black/50',
              showSystemPrompt &&
                'max-w-full whitespace-pre-wrap text-black/40 hover:text-black/60',
            )}
          >
            {showSystemPrompt ? '▼ ' : '► '}
            <span className={twMerge(!showSystemPrompt && 'italic')}>
              {systemPrompt}
            </span>
          </button>
        )}
      </div>
      {streamingError !== null && (
        <div className="shrink-0 border-b border-red-500/20 bg-red-500/20 px-4 py-3 no-app-drag">
          <div className="flex items-center gap-3">
            <div className="flex-1 text-xs text-red-700 select-text">
              {streamingError}
            </div>
            <button
              type="button"
              onClick={() => {
                setStreamingError(null);
              }}
              className="shrink-0 rounded px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-500/20"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-white/20 p-4 no-app-drag">
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
            setStreamingError(null);
          }
        }}
        className="shrink-0 border-t border-white/10 p-4"
      >
        <div className="flex gap-2">
          <textarea
            className="max-h-60 flex-1 resize-none overflow-y-auto rounded-3xl border border-white/20 bg-white/5 px-4 py-3 text-[0.95rem] transition-[border-color] duration-200 outline-none no-app-drag focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
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
          />
          <button
            type="submit"
            disabled={
              status === 'streaming' ||
              status === 'submitted' ||
              input.trim() === ''
            }
            className="cursor-pointer rounded-3xl border-none bg-blue-500/30 px-6 py-3 text-[0.95rem] font-medium transition-[background] duration-200 no-app-drag hover:bg-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500/30"
          >
            {status === 'streaming' ? 'Stop' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
