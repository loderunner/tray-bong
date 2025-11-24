declare global {
  var Logger: {
    error: (message: string) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
  };
}

export {};
