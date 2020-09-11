import { LogTypes } from '@requestnetwork/types';
import SimpleLogger from '../src/simple-logger';

const LogLevel = LogTypes.LogLevel;

const fakeConsole = Object.assign({}, console, {
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
});

jest.useFakeTimers('modern');
// tslint:disable-next-line: no-magic-numbers
const now = new Date(1599641831325);
jest.setSystemTime(now);

// tslint:disable:no-console
describe('Simple logger', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('logs an error', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.error('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.ERROR]}|test message`;
    expect(fakeConsole.error).toHaveBeenCalledWith(expectedLog);
  });

  it('logs a warning', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.warn('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.WARN]}|test message`;
    expect(fakeConsole.warn).toHaveBeenCalledWith(expectedLog);
  });

  it('logs an info', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.info('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.INFO]}|test message`;
    expect(fakeConsole.info).toHaveBeenCalledWith(expectedLog);
  });

  it('logs a debug message', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.debug('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.DEBUG]}|test message`;
    expect(fakeConsole.debug).toHaveBeenCalledWith(expectedLog);
  });

  it('does not log in quiet log level', () => {
    const logger = new SimpleLogger(LogLevel.QUIET);
    logger.output = fakeConsole;
    logger.error('test message');
    logger.warn('test message');
    logger.info('test message');
    logger.debug('test message');
    expect(fakeConsole.debug).not.toHaveBeenCalled();
  });

  it('does not log a message with higher log lever than the one set at construction', () => {
    const logger = new SimpleLogger(LogLevel.ERROR);
    const spy = jest.fn();
    logger.output = Object.assign({}, console, {
      debug: spy,
      error: spy,
      info: spy,
      warn: spy,
    });
    logger.error('test message');
    logger.warn('test message');
    logger.info('test message');
    logger.debug('test message');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('shows a log with tags', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.debug('test message', ['tag1', 'tag2']);
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.DEBUG]}|test message|tag1,tag2`;
    expect(fakeConsole.debug).toHaveBeenCalledWith(expectedLog);
  });

  it('throws if a tag has the `|` separator character', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    expect(() => logger.debug('test message', ['tag|1', 'tag2'])).toThrowError(
      `Log tags can't can't contain | character`,
    );
  });
});
