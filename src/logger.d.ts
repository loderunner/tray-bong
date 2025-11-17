declare global {
  interface Window {
    logger: {
      error: (message: string) => void;
      info: (message: string) => void;
      debug: (message: string) => void;
    };
  }
}

export {};



