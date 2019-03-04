import { DataAccess } from '@requestnetwork/data-access';
import { Storage as StorageTypes } from '@requestnetwork/types';

import * as cors from 'cors';
import * as express from 'express';
import * as httpStatus from 'http-status-codes';
import { getCustomHeaders, getMnemonic } from './config';
import getTransactionsByTopic from './request/getTransactionsByTopic';
import persistTransaction from './request/persistTransaction';
import { getEthereumStorage } from './storageUtils';

const NOT_FOUND_MESSAGE =
  'Not found\nAvailable endpoints:\n/POST persistTransaction\n/GET getTransactionsByTopic';

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

  constructor() {
    this.initialized = false;

    // Use ethereum storage for the storage layer
    const ethereumStorage: StorageTypes.IStorage = getEthereumStorage(getMnemonic());

    this.dataAccess = new DataAccess(ethereumStorage);

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
    // tslint:disable-next-line:no-console
    console.log('Node initialization');

    try {
      await this.dataAccess.initialize();
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error(`Node failed to initialize`);
      throw error;
    }

    try {
      await this.dataAccess.startAutoSynchronization();
    } catch (error) {
      // tslint:disable-next-line:no-console
      console.error(`Node failed to start auto synchronization`);
      throw error;
    }

    this.initialized = true;

    // tslint:disable-next-line:no-console
    console.log('Node initialized');
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
    this.express.use(express.urlencoded());

    this.express.use('/', router);

    // Route for persistTransaction request
    router.post('/persistTransaction', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return persistTransaction.actionPersistTransaction(
          clientRequest,
          serverResponse,
          this.dataAccess,
        );
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });
    this.express.use('/persistTransaction', router);

    // Route for getTransactionsByTopic request
    router.get('/getTransactionsByTopic', (clientRequest: any, serverResponse: any) => {
      if (this.initialized) {
        return getTransactionsByTopic.actionGetTransactionsByTopic(
          clientRequest,
          serverResponse,
          this.dataAccess,
        );
      } else {
        return serverResponse.status(httpStatus.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      }
    });
    this.express.use('/getTransactionsByTopic', router);

    // Any other route returns error 404
    this.express.use((_clientRequest: any, serverResponse: any) => {
      serverResponse.status(httpStatus.NOT_FOUND).send(NOT_FOUND_MESSAGE);
    });
  }
}

export default RequestNode;
