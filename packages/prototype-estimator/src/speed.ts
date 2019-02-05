import { RequestNetwork } from '@requestnetwork/request-client.js';
import {
  Identity as IdentityTypes,
  RequestLogic as RequestLogicTypes,
  Signature as SignatureTypes,
} from '@requestnetwork/types';
const Benchmark = require('benchmark');

const signatureInfo: SignatureTypes.ISignatureParameters = {
  method: SignatureTypes.REQUEST_SIGNATURE_METHOD.ECDSA,
  privateKey: '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
};

const requestCreationHash: RequestLogicTypes.IRequestLogicCreateParameters = {
  currency: RequestLogicTypes.REQUEST_LOGIC_CURRENCY.ETH,
  expectedAmount: '100000000000',
  payee: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  },
  payer: {
    type: IdentityTypes.REQUEST_IDENTITY_TYPE.ETHEREUM_ADDRESS,
    value: '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
  },
};

const topics = [
  '0x627306090abab3a6e1400e9345bc60c78a8bef57',
  '0x740fc87Bd3f41d07d23A01DEc90623eBC5fed9D6',
];

/**
 * Creates several requests and returns how many requests have been created per second
 *
 * @param {String} actions.content Content of the request
 * @returns {Promise<IBenchmark>}
 */
function getCreateRequestThroughput(
  actions: any = {
    content: '',
  },
): Promise<IBenchmark> {
  return new Promise(resolve => {
    const requestNetwork = new RequestNetwork();

    const suite = new Benchmark.Suite();

    return suite
      .add('create request', {
        defer: true,
        fn(deferred: any): Promise<any> {
          // TODO: add actions.content when client-size has the content-data feature
          if (actions.content) {
            // This block is only here to keep the argument while making tsc happy
            actions.content = '';
          }
          return requestNetwork
            .createRequest(requestCreationHash, signatureInfo, topics)
            .then(() => deferred.resolve());
        },
      })
      .on('complete', (results: any) => resolve(analyzeBenchmark(results.currentTarget[0])))
      .run();
  });
}

/**
 * Extracts and renames the results from Benchmark
 *
 * @param {*} benchmark
 * @returns
 */
function analyzeBenchmark(benchmark: any): IBenchmark {
  const {
    count,
    hz: countPerSec,
    stats: { mean, moe: marginOfError },
  } = benchmark;
  return { count, countPerSec: Math.round(countPerSec), mean, marginOfError };
}

/**
 * Readable results of a benchmark
 *
 * @export
 * @interface IBenchmark
 */
export interface IBenchmark {
  count: number;
  countPerSec: number;
  mean: number;
  marginOfError: number;
}

export default getCreateRequestThroughput;
