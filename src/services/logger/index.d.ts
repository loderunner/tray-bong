declare global {
  var LoggerBackend: {
    write: (
      level: string,
      world: string,
      moduleName: string,
      message: string,
    ) => void;
  };
}

export {};
