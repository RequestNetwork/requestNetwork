import { LogTypes } from '@requestnetwork/types';
import * as sinon from 'sinon';
import SimpleLogger from '../src/simple-logger';

const LogLevel = LogTypes.LogLevel;

const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const expect = chai.expect;

const fakeConsole = Object.assign({}, console, {
  debug: chai.spy(),
  error: chai.spy(),
  info: chai.spy(),
  warn: chai.spy(),
});

// tslint:disable:no-console
describe('Simple logger', () => {
  beforeEach(() => {
    sinon.useFakeTimers();
  });
  afterEach(() => {
    sinon.restore();
  });

  it('logs an error', () => {
    const now = new Date();
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.error('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.ERROR]}|test message`;
    expect(fakeConsole.error).to.have.been.called.with(expectedLog);
  });

  it('logs a warning', () => {
    const now = new Date();
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.warn('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.WARN]}|test message`;
    expect(fakeConsole.warn).to.have.been.called.with(expectedLog);
  });

  it('logs an info', () => {
    const now = new Date();
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.info('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.INFO]}|test message`;
    expect(fakeConsole.info).to.have.been.called.with(expectedLog);
  });

  it('logs a debug message', () => {
    const now = new Date();
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.debug('test message');
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.DEBUG]}|test message`;
    expect(fakeConsole.debug).to.have.been.called.with(expectedLog);
  });

  it('does not log in quiet log level', () => {
    const logger = new SimpleLogger(LogLevel.QUIET);
    logger.output = fakeConsole;
    logger.error('test message');
    logger.warn('test message');
    logger.info('test message');
    logger.debug('test message');
    expect(fakeConsole.debug).to.not.have.been.called;
  });

  it(
    'does not log a message with higher log lever than the one set at construction',
    () => {
      const logger = new SimpleLogger(LogLevel.ERROR);
      const spy = chai.spy();
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

      expect(spy).to.have.been.called.once;
    }
  );

  it('shows a log with tags', () => {
    const now = new Date();
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    logger.debug('test message', ['tag1', 'tag2']);
    const expectedLog = `${now.toISOString()}|${LogLevel[LogLevel.DEBUG]}|test message|tag1,tag2`;
    expect(fakeConsole.debug).to.have.been.called.with(expectedLog);
  });

  it('throws if a tag has the `|` separator character', () => {
    const logger = new SimpleLogger(LogLevel.DEBUG);
    logger.output = fakeConsole;
    expect(() => logger.debug('test message', ['tag|1', 'tag2'])).to.throw(
      `Log tags can't can't contain | character`,
    );
  });
});
