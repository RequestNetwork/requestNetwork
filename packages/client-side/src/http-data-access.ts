const axios = require('axios');
import { DataAccess as DataAccessTypes, Signature as SignatureTypes } from '@requestnetwork/types';

/**
 * Exposes a Data-Access module over HTTP
 *
 * @export
 * @class HttpDataAccess
 * @implements {DataAccessTypes.IDataAccess}
 */
export default class HttpDataAccess implements DataAccessTypes.IDataAccess {
  public async initialize(): Promise<void> {
    // no-op, nothing to do
    return;
  }

  public async persistTransaction(
    transactionData: string,
    signatureParams: SignatureTypes.ISignatureParameters,
    topics?: string[],
  ): Promise<DataAccessTypes.IRequestDataReturnPersistTransaction> {
    const { data } = await axios.post('/persistTransaction', {
      signatureParams,
      topics,
      transactionData,
    });
    return data;
  }

  public async getTransactionsByTopic(
    topic: string,
  ): Promise<DataAccessTypes.IRequestDataReturnGetTransactionsByTopic> {
    const { data } = await axios.get('/getTransactionsByTopic', {
      params: { topic },
    });
    return data;
  }
}
