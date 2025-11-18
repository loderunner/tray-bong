declare global {
  var logger: {
    error: (message: string) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
  };
}

export {};
