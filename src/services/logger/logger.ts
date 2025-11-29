export type LogLevel = 'ERROR' | 'INFO' | 'DEBUG';

export type LoggerBackend = {
  write: (
    level: LogLevel,
    world: string,
    moduleName: string,
    message: string,
  ) => void;
};

export type Logger = {
  error: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
};
