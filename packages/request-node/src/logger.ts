import { LogTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';
import chalk from 'chalk';

/** The different logging modes supported by this logger */
export enum modeType {
  human = 'human',
  machine = 'machine',
}

/** The different console color for every log level */
const levelColor = {
  [LogTypes.LogLevel.ERROR]: chalk.red,
  [LogTypes.LogLevel.WARN]: chalk.yellow,
  [LogTypes.LogLevel.INFO]: chalk.cyan,
  [LogTypes.LogLevel.DEBUG]: chalk.magenta,
  [LogTypes.LogLevel.QUIET]: chalk.black,
};

/**
 * A logger for the Request Node that extends the `SimpleLogger`
 */
export class Logger extends Utils.SimpleLogger {
  // The class modeType
  private mode: modeType;

  /**
   * Creates an instance of Logger
   *
   * @param [maxLogLevel] The maximum log level for this logger
   * @param [mode] The logging mode, can be human or
   */
  constructor(maxLogLevel: LogTypes.LogLevel, mode: modeType) {
    super(maxLogLevel);
    this.mode = mode;
  }

  /**
   * Formats the message using the correct mode log format
   *
   * @param level The log level of the message
   * @param message The log message
   * @param [tags] The log tags
   * @returns A string with the formatted log message
   */
  protected formatLog(level: LogTypes.LogLevel, message: string, tags?: string[]): string {
    if (this.mode === modeType.human) {
      return this.formatHuman(level, message, tags);
    }

    return super.formatLog(level, message, tags);
  }

  /**
   * Formats the message on the human mode log format
   *
   * @param level The log level of the message
   * @param message The log message
   * @param [tags] The log tags
   * @returns A string with the formatted log message
   */
  private formatHuman(level: LogTypes.LogLevel, message: string, tags?: string[]): string {
    const now = new Date();
    const time = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0',
    )}:${String(now.getSeconds()).padStart(2, '0')}]`;
    const content = `${time} ${levelColor[level](
      LogTypes.LogLevel[level].padStart(5),
    )}: ${message}`;

    const tagList = tags && tags.length ? `(#${tags.join(', #')})` : '';

    return `${content} ${tagList}`;
  }
}
