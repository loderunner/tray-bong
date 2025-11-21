/// <reference types="./index.d.ts" />
import type { ChatStatus, UIMessage } from 'ai';
import { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { twMerge } from 'tailwind-merge';

interface Props extends React.RefAttributes<HTMLDivElement> {
  message: UIMessage;
  lastMessage: boolean;
  status: ChatStatus;
  editing?: boolean;
  ephemeral?: boolean;
  onEdit: (messageId: string, content: string) => void;
}

export function Message({
  message,
  lastMessage,
  status,
  editing = false,
  ephemeral = false,
  onEdit,
  ref,
}: Props) {
  const textParts = message.parts.filter((part) => part.type === 'text');
  const textContent = textParts
    .map((part) => ('text' in part ? part.text : ''))
    .join('');

  const hasEmptyText = textParts.some(
    (part) => 'text' in part && part.text === '',
  );
  const showActivityIndicator =
    message.role === 'assistant' &&
    lastMessage &&
    (status === 'submitted' || (status === 'streaming' && hasEmptyText));

  const [copyIcon, setCopyIcon] = useState<string | null>(null);
  const [showCopiedPopover, setShowCopiedPopover] = useState<boolean>(false);
  const [editIcon, setEditIcon] = useState<string | null>(null);

  const messageComplete =
    textContent.trim() !== '' &&
    (!lastMessage || (status !== 'submitted' && status !== 'streaming'));

  useEffect(() => {
    if (!messageComplete) {
      return;
    }

    let cancelled = false;

    if (message.role === 'assistant') {
      void PromptWindow.getSFSymbol('square.on.square').then((icon) => {
        if (!cancelled) {
          setCopyIcon(icon);
        }
      });
    } else if (message.role === 'user') {
      void PromptWindow.getSFSymbol('square.and.pencil').then((icon) => {
        if (!cancelled) {
          setEditIcon(icon);
        }
      });
    }

    return () => {
      cancelled = true;
      setCopyIcon(null);
      setEditIcon(null);
    };
  }, [messageComplete, message.role]);

  useEffect(() => {
    if (showCopiedPopover) {
      const timer = setTimeout(() => {
        setShowCopiedPopover(false);
      }, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [showCopiedPopover]);

  const handleCopy = () => {
    void PromptWindow.copyToClipboard(textContent);
    setShowCopiedPopover(true);
  };

  const handleEdit = useCallback(() => {
    onEdit(message.id, textContent);
  }, [message.id, onEdit, textContent]);

  return (
    <div
      ref={ref}
      className={twMerge(
        'relative flex max-w-[80%] flex-col transition-opacity duration-200 no-app-drag',
        message.role === 'user' && 'self-end',
        message.role === 'assistant' && 'self-start',
        ephemeral && 'opacity-40',
      )}
    >
      <div
        className={twMerge(
          'markdown-content rounded-2xl px-4 py-3 leading-6 wrap-break-word',
          message.role === 'user' && 'rounded-br-sm bg-blue-500/20',
          message.role === 'assistant' && 'rounded-bl-sm bg-white/10',
          !showActivityIndicator && 'select-text',
          editing && 'bg-amber-500/10 ring-2 ring-amber-500/50',
        )}
      >
        {showActivityIndicator ? (
          <span className="inline-block animate-pulse text-white/60">●</span>
        ) : (
          <ReactMarkdown>{textContent}</ReactMarkdown>
        )}
      </div>
      {!showActivityIndicator &&
        message.role === 'assistant' &&
        copyIcon !== null && (
          <div className="pointer-events-none absolute right-2 -bottom-3">
            <button
              aria-label="Copy message"
              className="pointer-events-auto relative flex h-6 w-6 items-center justify-center rounded border border-white/20 bg-white/10 transition-all duration-300 no-app-drag hover:bg-white/40 starting:opacity-0"
              type="button"
              onClick={handleCopy}
            >
              <img alt="Copy" className="h-4 w-4 opacity-60" src={copyIcon} />
            </button>
            {showCopiedPopover && (
              <div className="pointer-events-auto absolute right-0 bottom-full mb-2 rounded bg-black/50 px-2 py-1 text-xs whitespace-nowrap text-white backdrop-blur-sm transition-all duration-300 ease-out starting:translate-y-1 starting:opacity-0">
                Copied!
              </div>
            )}
          </div>
        )}
      {!showActivityIndicator &&
        message.role === 'user' &&
        !editing &&
        editIcon !== null && (
          <div className="pointer-events-none absolute right-2 -bottom-3">
            <button
              aria-label="Edit message"
              className="pointer-events-auto relative flex h-6 w-6 items-center justify-center rounded border border-blue-500/20 bg-blue-500/10 transition-all duration-300 no-app-drag hover:bg-blue-500/20 starting:opacity-0"
              type="button"
              onClick={handleEdit}
            >
              <img alt="Edit" className="h-4 w-4 opacity-60" src={editIcon} />
            </button>
          </div>
        )}
    </div>
  );
}
