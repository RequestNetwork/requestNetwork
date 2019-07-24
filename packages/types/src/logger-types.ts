/** Log levels used by the logger. */
export enum LogLevel {
  // No logs
  QUIET,
  // Any error which is fatal to the operation. These errors will force user intervention.
  ERROR,
  // Anything that can potentially cause application oddities, but for which the code can automatically recover.
  WARN,
  // Generally useful information to log.
  INFO,
  // Information that is diagnostically helpful to people running the code.
  DEBUG,
}

/** The generic logger interface. */
export interface ILogger {
  error: (message: string, tags?: string[]) => void;
  warn: (message: string, tags?: string[]) => void;
  info: (message: string, tags?: string[]) => void;
  debug: (message: string, tags?: string[]) => void;
}
