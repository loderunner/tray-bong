import type { Logger } from './renderer';

declare global {
  var createLogger: (context: string) => Logger;
}

export {};
