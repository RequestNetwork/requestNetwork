// tslint:disable:no-console
import { LogTypes } from '@requestnetwork/types';

// The default log level to use if none is used at the constructor.
const DEFAULT_LOG_LEVEL = LogTypes.LogLevel.QUIET;

/**
 * Simple logger that outputs content to the console.
 */
export default class SimpleLogger implements LogTypes.ILogger {
  /**
   * maxLogLevel, the maximum log level to display
   */
  public maxLogLevel: LogTypes.LogLevel;

  /**
   * The output console to use for logging
   */
  public output = console;

  /**
   * Creates an instance of SimpleLogger
   *
   * @param [maxLogLevel=DEFAULT_LOG_LEVEL] The maximum log level for this logger
   */
  constructor(maxLogLevel: LogTypes.LogLevel = DEFAULT_LOG_LEVEL) {
    this.maxLogLevel = maxLogLevel;
  }

  /**
   * Logs an error message
   *
   * @param message The error message to log
   * @param [tags] The array of tags concerning this message
   */
  public error(message: string, tags?: string[]): void {
    if (this.maxLogLevel >= LogTypes.LogLevel.ERROR) {
      this.output.error(this.formatLog(LogTypes.LogLevel.ERROR, message, tags));
    }
  }

  /**
   * Logs a warning message
   *
   * @param message The warning message to log
   * @param [tags] The array of tags concerning this message
   */
  public warn(message: string, tags?: string[]): void {
    if (this.maxLogLevel >= LogTypes.LogLevel.WARN) {
      this.output.warn(this.formatLog(LogTypes.LogLevel.WARN, message, tags));
    }
  }

  /**
   * Logs an info message
   *
   * @param message The info message to log
   * @param [tags] The array of tags concerning this message
   */
  public info(message: string, tags?: string[]): void {
    if (this.maxLogLevel >= LogTypes.LogLevel.INFO) {
      this.output.info(this.formatLog(LogTypes.LogLevel.INFO, message, tags));
    }
  }

  /**
   * Logs a debug message
   *
   * @param message The debug message to log
   * @param [tags] The array of tags concerning this message
   */
  public debug(message: string, tags?: string[]): void {
    if (this.maxLogLevel >= LogTypes.LogLevel.DEBUG) {
      this.output.debug(this.formatLog(LogTypes.LogLevel.DEBUG, message, tags));
    }
  }

  /**
   * Formats the message on the log format
   * The format is: ISO date|level|message|tag1,tag2,...,tagM
   *
   * @param level The log level of the message
   * @param message The log message
   * @param [tags] The log tags
   * @returns A string with the formatted log message
   */
  protected formatLog(level: LogTypes.LogLevel, message: string, tags?: string[]): string {
    const now = new Date();
    let log = `${now.toISOString()}|${LogTypes.LogLevel[level]}|${message}`;

    if (tags && tags.length) {
      this.checkForSeparator(tags, '|');
      const tagList = tags.join(',');
      log += `|${tagList}`;
    }
    return log;
  }

  /**
   * Throws if tags contain the log separator character
   *
   * @param tags The list of tags to check
   * @param separator The log separator character
   */
  protected checkForSeparator(tags: string[], separator: string): void {
    if (tags.some(tag => tag.includes(separator))) {
      throw new Error(`Log tags can't can't contain ${separator} character`);
    }
  }
}
