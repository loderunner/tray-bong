import { type ReactNode, createContext, useContext } from 'react';

import { type Logger } from './main';

const LoggerContext = createContext<Logger | null>(null);

export function LoggerProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const logger: Logger = {
    error: (message: string) => {
      Logger.error(message);
    },
    info: (message: string) => {
      Logger.info(message);
    },
    debug: (message: string) => {
      Logger.debug(message);
    },
  };
  return <LoggerContext value={logger}>{children}</LoggerContext>;
}

export function useLogger(): Logger {
  const logger = useContext(LoggerContext);
  if (logger === null) {
    throw new Error('Logger not found');
  }
  return logger;
}
