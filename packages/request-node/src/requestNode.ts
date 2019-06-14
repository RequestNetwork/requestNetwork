import { DataAccess, TransactionIndex } from '@requestnetwork/data-access';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

import * as cors from 'cors';
import * as express from 'express';
import * as httpStatus from 'http-status-codes';
import KeyvFile from 'keyv-file';

import Utils from '@requestnetwork/utils';
import { getCustomHeaders, getMnemonic, getTransactionIndexFilePath } from './config';
import getChannelsByTopic from './request/getChannelsByTopic';
import getTransactionsByChannelId from './request/getTransactionsByChannelId';
import persistTransaction from './request/persistTransaction';
import { getEthereumStorage } from './storageUtils';

const NOT_FOUND_MESSAGE =
  'Not found\nAvailable endpoints:\n/POST persistTransaction\n/GET getTransactionsByChannelId\n/GET getChannelsByTopic';

const NOT_INITIALIZED_MESSAGE = 'The node is not initialized';

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

  private express: any;
  private initialized: boolean;
  private logger: LogTypes.ILogger;

  /**
   * Request Node constructor
   *
   * @param [logger] The logger instance
   */
  constructor(logger?: LogTypes.ILogger) {
    this.initialized = false;

    this.logger = logger || new Utils.SimpleLogger();

    // Use ethereum storage for the storage layer
    const ethereumStorage: StorageTypes.IStorage = getEthereumStorage(getMnemonic(), this.logger);

    const transactionIndexStoragePath = getTransactionIndexFilePath();

    const store = transactionIndexStoragePath
      ? new KeyvFile({
          filename: transactionIndexStoragePath,
        })
      : undefined;

    // Use an in-file Transaction index if a path is specified, an in-memory otherwise
    const transactionIndex = new TransactionIndex(store);

    this.dataAccess = new DataAccess(ethereumStorage, {
      transactionIndex,
    });

    this.express = express();
    this.mountRoutes();
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
      this.logger.error(`Node failed to initialize`);
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
    this.logger.info(`Time to initialize: ${initializationEndTime - initializationStartTime}s`, ['metric']);
  }

  /**
   * Listen for requests
   *
   * @param port Port used for listening on the server
   * @param callback Callback called before listening for request
   * @returns Object of the listening server
   */
  public listen(port: number | string, callback: () => number): any {
    return this.express.listen(port, callback);
  }

  // Defines handlers for necessary routes
  private mountRoutes(): void {
    const router = express.Router();

    // Enable all CORS requests
    this.express.use(cors());

    // Middleware to send custom header on every response
    const customHeaders = getCustomHeaders();
    if (customHeaders) {
      this.express.use((_: any, res: any, next: any) => {
        Object.entries(customHeaders).forEach(([key, value]: [string, string]) =>
          res.header(key, value),
        );
        next();
      });
    }

    // Supported encodings
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    this.express.use('/', router);

    // Route for persistTransaction request
    router.post('/persistTransaction', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return persistTransaction(clientRequest, serverResponse, this.dataAccess, this.logger);
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });
    this.express.use('/persistTransaction', router);

    // Route for getTransactionsByChannelId request
    router.get('/getTransactionsByChannelId', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return getTransactionsByChannelId(
          clientRequest,
          serverResponse,
          this.dataAccess,
          this.logger,
        );
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });
    this.express.use('/getTransactionsByChannelId', router);

    // Route for getChannelsByTopic request
    router.get('/getChannelsByTopic', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return getChannelsByTopic(clientRequest, serverResponse, this.dataAccess, this.logger);
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });
    this.express.use('/getChannelsByTopic', router);

    // Any other route returns error 404
    this.express.use((_clientRequest: any, serverResponse: any) => {
      serverResponse.status(httpStatus.NOT_FOUND).send(NOT_FOUND_MESSAGE);
    });
  }
}

export default RequestNode;
