import * as express from 'express';
import * as httpStatus from 'http-status-codes';

/**
 * Main class for request node express server
 */
class RequestNode {
  public express: any;

  constructor() {
    this.express = express();
    this.mountRoutes();
  }

  private mountRoutes(): void {
    const router = express.Router();

    // Supported encodings
    this.express.use(express.json());
    this.express.use(express.urlencoded());

    // Default route returns error 404
    router.get('/', (_req: any, res: any) => {
      res.status(httpStatus.NOT_FOUND).send('Not found');
    });
    this.express.use('/', router);
  }
}

export default new RequestNode().express;
