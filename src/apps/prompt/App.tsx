/// <reference types="./index.d.ts" />
import { useChat } from '@ai-sdk/react';
import {
  type ChatOnFinishCallback,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { twMerge } from 'tailwind-merge';

import { Message } from './Message';

import { type Conversation } from '@/services/conversations/conversation';
import { useLogger } from '@/services/logger/LoggerProvider';

function getSystemPrompt(conversation: Conversation): string {
  const systemMessage = conversation.messages.find(
    (msg) => msg.role === 'system',
  );
  if (systemMessage === undefined) {
    return '';
  }
  const textParts = systemMessage.parts.filter((part) => part.type === 'text');
  return textParts.map((part) => part.text).join('');
}

type Props = {
  initialData: Conversation;
};

export default function App({ initialData }: Props) {
  const logger = useLogger('Prompt');
  const [title, setTitle] = useState<string>(initialData.title);
  const titleRef = useRef<string>(title);
  const systemPrompt = useMemo(
    () => getSystemPrompt(initialData),
    [initialData],
  );
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [streamingError, setStreamingError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const onFinish: ChatOnFinishCallback<UIMessage> = async ({
    messages: finishedMessages,
  }) => {
    try {
      logger.info(
        `Saving conversation ${initialData.id} "${titleRef.current}" with ${finishedMessages.length} messages`,
      );
      await Conversations.saveConversation({
        ...initialData,
        title: titleRef.current,
        messages: finishedMessages,
      });
    } catch (error) {
      logger.error(
        `Failed to save conversation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const { messages, sendMessage, status, stop, setMessages, regenerate } =
    useChat({
      id: initialData.id,
      messages: initialData.messages,
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
              const abortStream = AI.streamChat({
                messages: uiMessages,
                onChunk: (chunk) => {
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
      onFinish,
    });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => message.role !== 'system');
  }, [messages]);

  const editingMessageIndex = useMemo(() => {
    if (editingMessageId === null) {
      return -1;
    }
    return visibleMessages.findIndex((m) => m.id === editingMessageId);
  }, [editingMessageId, visibleMessages]);

  const handleEdit = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setInput(content);
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement !== undefined) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 100);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setInput('');
    inputRef.current?.focus();
  }, []);

  // Custom window drag implementation to work around Chromium bug where
  // -webkit-app-region: drag doesn't respect overflow: hidden clipping bounds.
  // We apply this to the entire window background instead of using CSS.
  const draggingRef = useRef(false);

  const handleWindowDrag = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) {
      return;
    }

    const target = e.target as HTMLElement;

    // Don't start drag if clicking on interactive elements
    if (
      target.closest('button') !== null ||
      target.closest('a') !== null ||
      target.closest('input') !== null ||
      target.closest('textarea') !== null ||
      target.closest('.select-text') !== null ||
      target.closest('.select-all') !== null
    ) {
      return;
    }

    e.preventDefault();
    draggingRef.current = true;
    PromptWindow.startDrag(e.screenX, e.screenY);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (draggingRef.current) {
        PromptWindow.dragMove(moveEvent.screenX, moveEvent.screenY);
      }
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      PromptWindow.endDrag();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleMessagesAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (editingMessageId === null) {
        return;
      }

      const target = e.currentTarget;
      const editedMessageElement = messageRefs.current.get(editingMessageId);

      if (
        editedMessageElement !== undefined &&
        !editedMessageElement.contains(target)
      ) {
        handleCancelEdit();
      }
    },
    [editingMessageId, handleCancelEdit],
  );

  const messagesElements = useMemo(() => {
    const elements = visibleMessages.map((message, index) => {
      const ephemeral =
        editingMessageId !== null && index > editingMessageIndex;
      const messageRef = (element: HTMLDivElement | null) => {
        if (element !== null) {
          messageRefs.current.set(message.id, element);
        } else {
          messageRefs.current.delete(message.id);
        }
      };
      return (
        <Message
          key={message.id}
          ref={messageRef}
          editing={editingMessageId === message.id}
          ephemeral={ephemeral}
          lastMessage={index === visibleMessages.length - 1}
          message={message}
          status={status}
          onEdit={handleEdit}
        />
      );
    });
    if (
      status === 'submitted' &&
      visibleMessages.length > 0 &&
      visibleMessages[visibleMessages.length - 1]?.role === 'user'
    ) {
      elements.push(
        <Message
          lastMessage
          message={{
            id: 'placeholder',
            role: 'assistant',
            parts: [{ type: 'text', text: '' }],
          }}
          status={status}
          onEdit={handleEdit}
        />,
      );
    }

    return elements;
  }, [
    visibleMessages,
    status,
    editingMessageId,
    editingMessageIndex,
    handleEdit,
  ]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (status === 'streaming') {
        void stop();
      } else if (input.trim() !== '') {
        if (editingMessageId !== null) {
          if (editingMessageIndex !== -1) {
            const updatedMessages = [...messages];
            const editedMessage = updatedMessages.find(
              (m) => m.id === editingMessageId,
            );
            if (editedMessage !== undefined) {
              editedMessage.parts = [{ type: 'text', text: input.trim() }];
            }

            setMessages(updatedMessages);

            const firstAssistantAfterEdit = updatedMessages
              .slice(editingMessageIndex + 1)
              .find((m) => m.role === 'assistant');

            if (firstAssistantAfterEdit !== undefined) {
              void regenerate({ messageId: firstAssistantAfterEdit.id });
            }
          }
          setEditingMessageId(null);
          setInput('');
          setStreamingError(null);
        } else {
          const userMessageText = input.trim();
          const isFirstUserMessage = visibleMessages.length === 0;

          if (isFirstUserMessage && systemPrompt.trim() !== '') {
            const titlePrompt = `Generate a concise 3-8 word title for this conversation.\nSystem context: ${systemPrompt}\nFirst user message: ${userMessageText}\n\nRespond with ONLY the title, nothing else.`;
            try {
              const generatedTitle = await AI.generateText(titlePrompt);
              titleRef.current = generatedTitle;
              setTitle(generatedTitle);
              document.title = generatedTitle;
            } catch (error) {
              logger.error(
                `Failed to generate title: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }

          void sendMessage({ text: userMessageText });
          setInput('');
          setStreamingError(null);
        }
      }
    },
    [
      editingMessageId,
      editingMessageIndex,
      input,
      logger,
      messages,
      regenerate,
      sendMessage,
      setMessages,
      status,
      stop,
      systemPrompt,
      visibleMessages.length,
    ],
  );

  return (
    <div className="flex h-full flex-col" onMouseDown={handleWindowDrag}>
      <div className="shrink-0 p-4">
        <h1 className="w-fit text-xl font-semibold">{title}</h1>
        {systemPrompt.trim() !== '' && (
          <button
            className={twMerge(
              'mt-1 block text-left text-xs transition-colors',
              !showSystemPrompt &&
                'max-w-1/2 overflow-hidden text-ellipsis whitespace-nowrap text-black/30 hover:text-black/50',
              showSystemPrompt &&
                'max-w-full whitespace-pre-wrap text-black/40 hover:text-black/60',
            )}
            type="button"
            onClick={() => {
              setShowSystemPrompt(!showSystemPrompt);
            }}
          >
            {showSystemPrompt ? '▼ ' : '► '}
            <span className={twMerge(!showSystemPrompt && 'italic')}>
              {systemPrompt}
            </span>
          </button>
        )}
      </div>
      {streamingError !== null && (
        <div className="shrink-0 border-b border-red-500/20 bg-red-500/20 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 text-xs text-red-700 select-text">
              {streamingError}
            </div>
            <button
              aria-label="Dismiss error"
              className="shrink-0 rounded px-2 py-1 text-xs text-red-700 transition-colors hover:bg-red-500/20"
              type="button"
              onClick={() => {
                setStreamingError(null);
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4"
        onClick={handleMessagesAreaClick}
      >
        {messagesElements}
        <div ref={messagesEndRef} />
      </div>
      <form className="shrink-0 p-4" onSubmit={handleSubmit}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            autoFocus
            className={twMerge(
              'max-h-60 flex-1 resize-none overflow-y-auto rounded-3xl border bg-white/5 px-4 py-3 text-[0.95rem] transition-[border-color] duration-200 outline-none focus:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50',
              editingMessageId !== null
                ? 'border-amber-500/70'
                : 'border-white/20',
            )}
            disabled={status === 'streaming' || status === 'submitted'}
            id="message-input"
            placeholder="Type your message..."
            rows={input.split('\n').length}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && editingMessageId !== null) {
                e.preventDefault();
                handleCancelEdit();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const form = e.currentTarget.form;
                form?.requestSubmit();
              }
            }}
          />
          {editingMessageId !== null && (
            <button
              className="rounded-3xl border-none bg-white/10 px-6 py-3 text-[0.95rem] font-medium transition-[background] duration-200 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === 'streaming' || status === 'submitted'}
              type="button"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
          <button
            className="rounded-3xl border-none bg-blue-500/30 px-6 py-3 text-[0.95rem] font-medium transition-[background] duration-200 hover:bg-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-500/30"
            disabled={
              status === 'streaming' ||
              status === 'submitted' ||
              input.trim() === ''
            }
            type="submit"
          >
            {status === 'streaming' ? 'Stop' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
