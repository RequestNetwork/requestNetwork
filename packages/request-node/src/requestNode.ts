import { DataAccess, TransactionIndex } from '@requestnetwork/data-access';
import { LogTypes, StorageTypes } from '@requestnetwork/types';
import Utils from '@requestnetwork/utils';

import cors from 'cors';
import { Server } from 'http';
import express, { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';

import { getCustomHeaders, getInitializationStorageFilePath, getMnemonic } from './config';
import ConfirmedTransactionStore from './request/confirmedTransactionStore';
import { getEthereumStorage } from './storageUtils';

import GetConfirmedTransactionHandler from './request/getConfirmedTransactionHandler';
import GetTransactionsByChannelIdHandler from './request/getTransactionsByChannelId';
import PersistTransactionHandler from './request/persistTransaction';
import GetChannelsByTopicHandler from './request/getChannelsByTopic';
import GetStatusHandler from './request/getStatus';
import IpfsAddHandler from './request/ipfsAdd';
import KeyvFile from 'keyv-file';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

const NOT_FOUND_MESSAGE =
  'Not found\nAvailable endpoints:\n/POST persistTransaction\n/GET getTransactionsByChannelId\n/GET getChannelsByTopic\n/POST /ipfsAdd\nGET getConfirmedTransaction\nGET status';

const NOT_INITIALIZED_MESSAGE = 'The node is not initialized';

const REQUEST_NODE_VERSION_HEADER = 'X-Request-Network-Node-Version';

/**
 * Main class for request node express server
 * This class defines routes to handle requests from client
 */
class RequestNode {
  /**
   * DataAccess layer of the protocol
   * This attribute is left public for mocking purpose
   */
  public dataAccess: DataAccess;
  public ethereumStorage: StorageTypes.IStorage;

  private express: express.Application;
  private initialized: boolean;
  private logger: LogTypes.ILogger;
  private persistTransactionHandler: PersistTransactionHandler;
  private confirmedTransactionStore: ConfirmedTransactionStore;
  private requestNodeVersion: string;

  private getTransactionsByChannelIdHandler: GetTransactionsByChannelIdHandler;
  private getConfirmedTransactionHandler: GetConfirmedTransactionHandler;
  private getChannelByTopicHandler: GetChannelsByTopicHandler;
  private getStatusHandler: GetStatusHandler;
  private ipfsAddHandler: IpfsAddHandler;
  store: Keyv.Store<any> | undefined;
  /**
   * Request Node constructor
   *
   * @param [logger] The logger instance
   */
  constructor(logger?: LogTypes.ILogger) {
    this.initialized = false;

    this.logger = logger || new Utils.SimpleLogger();

    const initializationStoragePath = getInitializationStorageFilePath();

    this.store = initializationStoragePath
      ? initializationStoragePath.match(/^redis:\/\//)
        ? new KeyvRedis(initializationStoragePath, {})
        : new KeyvFile({ filename: initializationStoragePath })
      : undefined;

    // Use ethereum storage for the storage layer
    const ethereumStorage = getEthereumStorage(getMnemonic(), this.logger, this.store);

    // Use an in-file Transaction index if a path is specified, an in-memory otherwise
    const transactionIndex = new TransactionIndex(this.store);

    this.ethereumStorage = ethereumStorage;

    this.dataAccess = new DataAccess(ethereumStorage, {
      logger: this.logger,
      transactionIndex,
    });

    this.confirmedTransactionStore = new ConfirmedTransactionStore(this.store);
    this.getConfirmedTransactionHandler = new GetConfirmedTransactionHandler(
      this.logger,
      this.confirmedTransactionStore,
    );
    this.getTransactionsByChannelIdHandler = new GetTransactionsByChannelIdHandler(
      this.logger,
      this.dataAccess,
    );
    this.getChannelByTopicHandler = new GetChannelsByTopicHandler(this.logger, this.dataAccess);
    this.getStatusHandler = new GetStatusHandler(this.logger, this.dataAccess);
    this.ipfsAddHandler = new IpfsAddHandler(this.logger, this.ethereumStorage);
    this.persistTransactionHandler = new PersistTransactionHandler(
      this.confirmedTransactionStore,
      this.dataAccess,
      this.logger,
    );

    this.express = express();
    this.mountRoutes();

    // Get the version of the Request Node for the request's response header
    this.requestNodeVersion = packageJson.version;
  }

  /**
   * Initialize data access layer
   * This function must be called before listening for requests
   * because the data-access layer must be synchronized
   * with the current state of the storage smart contract
   */
  public async initialize(): Promise<void> {
    this.logger.info('Node initialization');

    const initializationStartTime: number = Date.now();

    try {
      await this.dataAccess.initialize();
    } catch (error) {
      this.logger.error(`Node failed to initialize: ${error.message}`);
      throw error;
    }

    try {
      this.dataAccess.startAutoSynchronization();
    } catch (error) {
      this.logger.error(`Node failed to start auto synchronization`);
      throw error;
    }

    this.initialized = true;

    this.logger.info('Node initialized');

    const initializationEndTime: number = Date.now();

    this.logger.info(
      // eslint-disable-next-line no-magic-numbers
      `Time to initialize: ${(initializationEndTime - initializationStartTime) / 1000}s`,
      ['metric', 'initialization'],
    );
  }

  /**
   * Listen for requests
   *
   * @param port Port used for listening on the server
   * @param callback Callback called before listening for request
   * @returns Object of the listening server
   */
  public listen(port: number | string, callback: () => number): Server {
    return this.express.listen(port, callback);
  }

  // Defines handlers for necessary routes
  private mountRoutes(): void {
    const router = express.Router();

    // Enable all CORS requests
    this.express.use(cors());

    const customHeaders = getCustomHeaders();
    if (customHeaders) {
      this.express.use(this.customHeadersMiddelware(customHeaders));
    }

    // Set the Request Node version to the header
    this.express.use((_, res, next) => {
      res.header(REQUEST_NODE_VERSION_HEADER, this.requestNodeVersion);
      next();
    });

    // Supported encodings
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    router.get('/healthz', (_, res) => res.status(StatusCodes.OK).send('OK'));
    router.use(this.initializedMiddelware());
    router.get('/readyz', (_, res) => res.status(StatusCodes.OK).send('OK'));
    router.get('/status', this.getStatusHandler.handler);
    router.post('/ipfsAdd', this.ipfsAddHandler.handler);
    router.post('/persistTransaction', this.persistTransactionHandler.handler);
    router.get('/getConfirmedTransaction', this.getConfirmedTransactionHandler.handler);
    router.get('/getTransactionsByChannelId', this.getTransactionsByChannelIdHandler.handler);
    router.get('/getChannelsByTopic', this.getChannelByTopicHandler.handler);
    this.express.use('/', router);

    // Any other route returns error 404
    this.express.use((_clientRequest, serverResponse) => {
      serverResponse.status(StatusCodes.NOT_FOUND).send(NOT_FOUND_MESSAGE);
    });
  }

  /**
   * Middleware to send custom header on every response
   */
  private customHeadersMiddelware(customHeaders: Record<string, string>) {
    return (_: Request, res: Response, next: NextFunction) => {
      Object.entries(customHeaders).forEach(([key, value]: [string, string]) =>
        res.header(key, value),
      );
      next();
    };
  }

  /**
   * Middleware to refuse traffic if node is not initialized yet
   */
  private initializedMiddelware() {
    return (_: Request, res: Response, next: NextFunction) => {
      if (!this.initialized) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      } else {
        next();
      }
    };
  }
}

export default RequestNode;
