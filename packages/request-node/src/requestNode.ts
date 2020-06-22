import { DataAccess, TransactionIndex } from '@requestnetwork/data-access';
import { LogTypes, StorageTypes } from '@requestnetwork/types';

import * as cors from 'cors';
import * as express from 'express';
import * as httpStatus from 'http-status-codes';
import KeyvFile from 'keyv-file';

import Utils from '@requestnetwork/utils';
import { getCustomHeaders, getInitializationStorageFilePath, getMnemonic } from './config';
import ConfirmedTransactionStore from './request/confirmedTransactionStore';
import getChannelsByTopic from './request/getChannelsByTopic';
import getStatus from './request/getStatus';
import getTransactionsByChannelId from './request/getTransactionsByChannelId';
import ipfsAdd from './request/ipfsAdd';
import PersistTransaction from './request/persistTransaction';
import { getEthereumStorage } from './storageUtils';

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

  private express: any;
  private initialized: boolean;
  private logger: LogTypes.ILogger;
  private persistTransaction: PersistTransaction;
  private confirmedTransactionStore: ConfirmedTransactionStore;
  private requestNodeVersion: string;
  /**
   * Request Node constructor
   *
   * @param [logger] The logger instance
   */
  constructor(logger?: LogTypes.ILogger) {
    this.initialized = false;

    this.logger = logger || new Utils.SimpleLogger();

    const initializationStoragePath = getInitializationStorageFilePath();

    const store = initializationStoragePath
      ? new KeyvFile({
          filename: initializationStoragePath,
        })
      : undefined;

    // Use ethereum storage for the storage layer
    const ethereumStorage = getEthereumStorage(getMnemonic(), this.logger, store);

    // Use an in-file Transaction index if a path is specified, an in-memory otherwise
    const transactionIndex = new TransactionIndex(store);

    this.ethereumStorage = ethereumStorage;

    this.dataAccess = new DataAccess(ethereumStorage, {
      logger: this.logger,
      transactionIndex,
    });

    this.confirmedTransactionStore = new ConfirmedTransactionStore(store);
    this.persistTransaction = new PersistTransaction(this.confirmedTransactionStore);

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

    this.logger.info(
      // tslint:disable-next-line:no-magic-numbers
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

    // Set the Request Node version to the header
    this.express.use((_: any, res: any, next: any) => {
      res.header(REQUEST_NODE_VERSION_HEADER, this.requestNodeVersion);
      next();
    });

    // Supported encodings
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    // Route for health check
    router.get('/healthz', (_, serverResponse: any) => {
      return serverResponse.status(httpStatus.OK).send('OK');
    });

    // Route for readiness check
    router.get('/readyz', (_, serverResponse: any) => {
      if (this.initialized) {
        return serverResponse.status(httpStatus.OK).send('OK');
      }
      return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
    });

    // Route for satus check
    router.get('/status', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return getStatus(clientRequest, serverResponse, this.dataAccess, this.logger);
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });

    // Route for ipfs-add request
    router.post('/ipfsAdd', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return ipfsAdd(clientRequest, serverResponse, this.ethereumStorage, this.logger);
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });

    // Route for persistTransaction request
    router.post('/persistTransaction', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return this.persistTransaction.persistTransaction(
          clientRequest,
          serverResponse,
          this.dataAccess,
          this.logger,
        );
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });

    // Route for getConfirmedTransaction request
    router.get('/getConfirmedTransaction', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return this.confirmedTransactionStore.getConfirmedTransaction(
          clientRequest,
          serverResponse,
          this.logger,
        );
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });

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

    // Route for getChannelsByTopic request
    router.get('/getChannelsByTopic', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return getChannelsByTopic(clientRequest, serverResponse, this.dataAccess, this.logger);
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });

    this.express.use('/', router);

    // Any other route returns error 404
    this.express.use((_clientRequest: any, serverResponse: any) => {
      serverResponse.status(httpStatus.NOT_FOUND).send(NOT_FOUND_MESSAGE);
    });
  }
}

export default RequestNode;
