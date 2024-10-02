import { DataAccessTypes, LogTypes, StorageTypes } from '@requestnetwork/types';
import { SimpleLogger } from '@requestnetwork/utils';
import cors from 'cors';
import { Server } from 'http';
import express, { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import ConfirmedTransactionStore from './request/confirmedTransactionStore';
import GetConfirmedTransactionHandler from './request/getConfirmedTransactionHandler';
import GetTransactionsByChannelIdHandler from './request/getTransactionsByChannelId';
import PersistTransactionHandler from './request/persistTransaction';
import GetChannelsByTopicHandler from './request/getChannelsByTopic';
import GetStatusHandler from './request/getStatus';
import IpfsAddHandler from './request/ipfsAdd';
import morgan from 'morgan';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../package.json');

export const NOT_FOUND_MESSAGE =
  'Not found\nAvailable endpoints:\n/POST persistTransaction\n/GET getTransactionsByChannelId\n/GET getChannelsByTopic\n/POST /ipfsAdd\nGET getConfirmedTransaction\nGET status';

export const NOT_INITIALIZED_MESSAGE = 'The node is not initialized';

export const REQUEST_NODE_VERSION_HEADER = 'X-Request-Network-Node-Version';

/**
 * Main class for request node express server
 * This class defines routes to handle requests from client
 */

export class RequestNode {
  /**
   * DataAccess layer of the protocol
   * This attribute is left public for mocking purpose
   */
  protected dataAccess: DataAccessTypes.IDataAccess;

  private express: express.Application;
  private initialized: boolean;
  private logger: LogTypes.ILogger;
  private persistTransactionHandler: PersistTransactionHandler;
  private requestNodeVersion: string;

  private getTransactionsByChannelIdHandler: GetTransactionsByChannelIdHandler;
  private getConfirmedTransactionHandler: GetConfirmedTransactionHandler;
  private getChannelByTopicHandler: GetChannelsByTopicHandler;
  private getStatusHandler: GetStatusHandler;
  private ipfsAddHandler: IpfsAddHandler;
  /**
   * Request Node constructor
   *
   * @param [logger] The logger instance
   */
  constructor(
    dataAccess: DataAccessTypes.IDataAccess,
    ipfsStorage: StorageTypes.IIpfsStorage,
    confirmedTransactionStore: ConfirmedTransactionStore,
    logger?: LogTypes.ILogger,
  ) {
    this.initialized = false;

    this.logger = logger || new SimpleLogger();
    this.dataAccess = dataAccess;

    this.getConfirmedTransactionHandler = new GetConfirmedTransactionHandler(
      this.logger,
      confirmedTransactionStore,
    );
    this.getTransactionsByChannelIdHandler = new GetTransactionsByChannelIdHandler(
      this.logger,
      this.dataAccess,
    );
    this.getChannelByTopicHandler = new GetChannelsByTopicHandler(this.logger, this.dataAccess);
    this.getStatusHandler = new GetStatusHandler(this.logger, this.dataAccess);
    this.ipfsAddHandler = new IpfsAddHandler(this.logger, ipfsStorage);
    this.persistTransactionHandler = new PersistTransactionHandler(this.dataAccess, this.logger);

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

    this.initialized = true;

    this.logger.info('Node initialized');

    const initializationEndTime: number = Date.now();

    this.logger.info(
      // eslint-disable-next-line no-magic-numbers
      `Time to initialize: ${(initializationEndTime - initializationStartTime) / 1000}s`,
      ['metric', 'initialization'],
    );
  }

  async close(): Promise<void> {
    await this.dataAccess.close();
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

    // Enable logging of all requests
    this.express.use(morgan('combined'));

    // Set the Request Node version to the header
    this.express.use((_, res, next) => {
      res.header(REQUEST_NODE_VERSION_HEADER, this.requestNodeVersion);
      next();
    });

    // Supported encodings
    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: true }));

    router.get('/healthz', (_, res) => res.status(StatusCodes.OK).send('OK'));
    router.use(this.initializedMiddleware());
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
   * Middleware to refuse traffic if node is not initialized yet
   */
  private initializedMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!this.initialized) {
        res.status(StatusCodes.SERVICE_UNAVAILABLE).send(NOT_INITIALIZED_MESSAGE);
      } else {
        const start = Date.now();
        // Log the request time and status
        res.on('finish', () => {
          const path = req.path.replace(/^\//, '');
          this.logger.debug(`${path} latency: ${Date.now() - start}ms. Status: ${res.statusCode}`, [
            'metric',
            'latency',
          ]);
        });
        next();
      }
    };
  }
}
