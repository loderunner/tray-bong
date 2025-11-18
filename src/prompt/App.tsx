import { useChat } from '@ai-sdk/react';
import type { UIMessage, UIMessageChunk } from 'ai';
import { useEffect, useMemo, useRef, useState } from 'react';

type PromptAPI = {
  getPromptLabel: () => Promise<string>;
  streamChat: (
    messages: UIMessage[],
    callbacks: {
      onChunk: (chunk: UIMessageChunk) => void;
      onDone: () => void;
      onError: (error: string) => void;
    },
  ) => void;
};

declare global {
  interface Window {
    promptAPI: PromptAPI;
  }
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

  return (
    <div className={`message message-${message.role}`}>
      <div className="message-content">
        {hasEmptyText ? (
          <span className="streaming-indicator">●</span>
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
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status } = useChat({
    transport: {
      sendMessages: async ({ messages: uiMessages }) => {
        logger.info(
          `[App] sendMessages called with ${uiMessages.length} messages`,
        );

        return new ReadableStream<UIMessageChunk>({
          start(controller) {
            logger.debug('[App] ReadableStream started');
            window.promptAPI.streamChat(uiMessages, {
              onChunk: (chunk) => {
                logger.debug(
                  `[App] onChunk: type=${chunk.type}, id=${'id' in chunk ? chunk.id : 'N/A'}`,
                );
                controller.enqueue(chunk);
              },
              onDone: () => {
                logger.debug('[App] onDone called');
                controller.close();
              },
              onError: (error) => {
                logger.error(`[App] onError: ${error}`);
                controller.enqueue({
                  type: 'error',
                  errorText: error,
                });
                controller.close();
              },
            });
          },
          cancel() {
            logger.debug('[App] ReadableStream cancelled');
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
      const promptLabel = await window.promptAPI.getPromptLabel();
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
    <>
      <h1>{label}</h1>
      <div className="messages-container">
        {messagesElements}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim() !== '' && status !== 'streaming') {
            void sendMessage({ text: input.trim() });
            setInput('');
          }
        }}
        className="input-form"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
          }}
          placeholder="Type your message..."
          disabled={status === 'streaming' || status === 'submitted'}
          className="chat-input"
        />
        <button
          type="submit"
          disabled={
            status === 'streaming' ||
            status === 'submitted' ||
            input.trim() === ''
          }
        >
          Send
        </button>
      </form>
    </>
  );
}
